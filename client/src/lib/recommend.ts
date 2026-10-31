import type { Restaurant, RecommendationPreferences, ScoredRestaurant, FoodType, MoodKey, Meal } from "../types";

interface ScoreContext {
  isFavorite: boolean;
  previouslyViewed: boolean;
  searchedFoodTypes: Set<string>; // from search history — favorite categories signal
  likedFoodTypes?: FoodType[]; // from the Preferences page taste profile
  mood?: MoodKey | null; // self-reported mood check-in, never camera/biometric-derived
  selectedMeal?: Meal | null;
}

const EMPTY_CONTEXT: ScoreContext = {
  isFavorite: false,
  previouslyViewed: false,
  searchedFoodTypes: new Set(),
};

// A mood is just a self-reported hint the user picked from a few buttons —
// it nudges scoring toward a few plausible cuisines, nothing more.
const MOOD_FOOD_TYPES: Record<MoodKey, FoodType[]> = {
  spicy: ["Thai", "Korean"],
  hungry: [], // no cuisine bias — just proceed normally
  neutral: [],
  light: ["Cafe", "Dessert", "Vegetarian"],
  lowAppetite: ["Cafe", "Fast Food"],
};

/**
 * Scores a restaurant 0-100 and returns the grounded reasons behind the
 * score ("Recommended because ..."), using only real, present fields —
 * distance, cuisine match, budget fit, opening status, tags, and the
 * user's own history/favorites/search history. There is no star-rating
 * input: OpenStreetMap doesn't provide one, so we never fabricate it.
 */
export function scoreRestaurant(
  restaurant: Restaurant,
  prefs: RecommendationPreferences,
  ctx: ScoreContext = EMPTY_CONTEXT
): { score: number; reasons: string[] } {
  let score = 50;
  const reasons: string[] = [];

  // ---- Distance ----
  if (restaurant.distanceKm <= prefs.distanceKm) {
    const bonus = Math.max(0, 18 - restaurant.distanceKm * 3);
    score += bonus;
    reasons.push(`only ${formatDistance(restaurant.distanceKm)} away`);
  } else {
    score -= (restaurant.distanceKm - prefs.distanceKm) * 6;
  }

  // ---- Opening status ----
  if (restaurant.openNow === true) {
    score += 15;
    reasons.push("open now");
  } else if (restaurant.openNow === false) {
    score -= 25;
  } // unknown (null) — no penalty, no bonus; never assumed closed

  // ---- Cuisine match ----
  if (prefs.foodType !== "Any" && restaurant.foodType === prefs.foodType) {
    score += 20;
    reasons.push(`matches your preferred ${prefs.foodType} cuisine`);
  }

  // ---- Budget fit ----
  if (!restaurant.priceLevelEstimated) {
    const priceDiff = Math.abs(restaurant.priceLevel - prefs.budget);
    if (priceDiff === 0) {
      score += 10;
      reasons.push("tagged price level fits your budget");
    } else {
      score -= priceDiff * 6;
    }
  }

  // ---- Restaurant tags (amenities) ----
  const tagHits: string[] = [];
  if (prefs.requireDelivery) {
    if (restaurant.delivery) {
      score += 8;
      tagHits.push("offers delivery");
    } else {
      score -= 12;
    }
  }
  if (prefs.requireTakeaway) {
    if (restaurant.takeaway) {
      score += 8;
      tagHits.push("offers takeaway");
    } else {
      score -= 12;
    }
  }
  if (prefs.requireParking) {
    if (restaurant.parking) {
      score += 6;
      tagHits.push("has parking");
    } else {
      score -= 10;
    }
  }
  if (prefs.requireOutdoorSeating) {
    if (restaurant.outdoorSeating) {
      score += 6;
      tagHits.push("has outdoor seating");
    } else {
      score -= 10;
    }
  }
  reasons.push(...tagHits);

  // A little unprompted credit for richly-tagged, accessible places —
  // reflects real amenity data without requiring the user to filter for it.
  if (restaurant.wheelchair) score += 2;
  if (restaurant.takeaway) score += 2;

  // ---- User history / favorites / search history ----
  if (ctx.isFavorite) {
    score += 12;
    reasons.push("one of your favorites");
  }
  if (ctx.previouslyViewed) {
    score += 4;
    reasons.push("you've viewed this before");
  }
  if (ctx.searchedFoodTypes.has(restaurant.foodType)) {
    score += 5;
    reasons.push("similar to your recent searches");
  }
  if (ctx.likedFoodTypes?.includes(restaurant.foodType)) {
    score += 8;
    reasons.push("matches a cuisine you like");
  }
  if (ctx.mood && MOOD_FOOD_TYPES[ctx.mood].includes(restaurant.foodType)) {
    score += 6;
    reasons.push("fits how you're feeling right now");
  }

  if (ctx.selectedMeal) {
    const match = matchRestaurantToMeal(restaurant, ctx.selectedMeal);
    score += match.bonus;
    reasons.unshift(match.reason);
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons };
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} meters`;
  return `${km.toFixed(1)} km`;
}

/**
 * Ranking workflow: User -> restaurants -> AI Model -> Ranking -> Top 10
 * -> Weighted Random -> UI. Weighted random re-ordering of the top N
 * keeps recommendations from feeling robotic/identical on repeat taps
 * while still favoring high scores.
 */
export function rankAndSample(
  restaurants: Restaurant[],
  prefs: RecommendationPreferences,
  ctxFor: (r: Restaurant) => ScoreContext = () => EMPTY_CONTEXT,
  topN = 10,
  dislikedFoodTypes: FoodType[] = []
): ScoredRestaurant[] {
  let pool = restaurants;
  if (prefs.openNowOnly) pool = pool.filter((r) => r.openNow !== false);
  if (prefs.requireTakeaway) pool = pool.filter((r) => Boolean(r.takeaway));
  if (prefs.requireDelivery) pool = pool.filter((r) => Boolean(r.delivery));
  if (prefs.requireParking) pool = pool.filter((r) => Boolean(r.parking));
  if (prefs.requireOutdoorSeating) pool = pool.filter((r) => Boolean(r.outdoorSeating));
  if (dislikedFoodTypes.length) pool = pool.filter((r) => !dislikedFoodTypes.includes(r.foodType));

  const scored: ScoredRestaurant[] = pool
    .map((r) => {
      const context = ctxFor(r);
      const { score, reasons } = scoreRestaurant(r, prefs, context);
      const meal = context.selectedMeal;
      const match = meal ? matchRestaurantToMeal(r, meal) : null;
      return {
        ...r,
        score,
        reasons,
        matchLevel: match?.level,
        matchDisclosure: match?.disclosure,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return weightedShuffle(scored);
}

export function matchRestaurantToMeal(
  restaurant: Restaurant,
  meal: Meal
): { level: "keyword" | "cuisine" | "category" | "nearby"; bonus: number; reason: string; disclosure: string } {
  const text = `${restaurant.name} ${restaurant.cuisine || ""}`.toLowerCase().replace(/_/g, " ");
  const keyword = [...meal.keywords, ...meal.restaurantSearchTerms].find((term) =>
    text.includes(term.toLowerCase().replace(/_/g, " "))
  );
  if (keyword) {
    return {
      level: "keyword",
      bonus: 24,
      reason: `OSM name/cuisine tags match “${keyword}”`,
      disclosure: "Strong tag match. OSM still does not confirm the current menu.",
    };
  }

  const cuisineMatch = meal.cuisines.some(
    (cuisine) =>
      restaurant.foodType === cuisine ||
      (restaurant.cuisine || "").toLowerCase().includes(cuisine.toLowerCase())
  );
  if (cuisineMatch) {
    return {
      level: "cuisine",
      bonus: 16,
      reason: `Cuisine tags are compatible with ${meal.nameTh}`,
      disclosure: "Cuisine match only—exact dish availability is not confirmed by OSM.",
    };
  }

  const compatible =
    (meal.category === "Drink" && restaurant.foodType === "Cafe") ||
    (meal.category === "Dessert" && ["Cafe", "Dessert"].includes(restaurant.foodType)) ||
    (meal.category === "Snack" && ["Fast Food", "Cafe"].includes(restaurant.foodType)) ||
    ["restaurant", "fast_food", "food_court", "cafe"].includes(restaurant.amenity || "");
  if (compatible) {
    return {
      level: "category",
      bonus: 7,
      reason: "Restaurant category is compatible with this meal type",
      disclosure: "Category match only—check the venue’s menu before visiting.",
    };
  }

  return {
    level: "nearby",
    bonus: 0,
    reason: "Nearby real restaurant with limited cuisine tags",
    disclosure: "Nearby alternative; OSM has insufficient tags to confirm a meal match.",
  };
}

function weightedShuffle(list: ScoredRestaurant[]): ScoredRestaurant[] {
  const pool = [...list];
  const result: ScoredRestaurant[] = [];

  while (pool.length) {
    const totalWeight = pool.reduce((sum, r) => sum + r.score + 1, 0);
    let roll = Math.random() * totalWeight;
    let pickIndex = 0;
    for (let i = 0; i < pool.length; i++) {
      roll -= pool[i].score + 1;
      if (roll <= 0) {
        pickIndex = i;
        break;
      }
    }
    result.push(pool.splice(pickIndex, 1)[0]);
  }
  return result;
}

/** Marker color by AI score: Green = highly recommended, Yellow = recommended, Red = low match. */
export function scoreToMarkerColor(score: number): "green" | "yellow" | "red" {
  if (score >= 75) return "green";
  if (score >= 50) return "yellow";
  return "red";
}
