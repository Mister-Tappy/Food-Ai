export type FoodType =
  | "Thai"
  | "Japanese"
  | "Chinese"
  | "Korean"
  | "Cafe"
  | "Dessert"
  | "Fast Food"
  | "Steak"
  | "Seafood"
  | "Vegetarian"
  | "Halal"
  | "Other";

export type MealTime = "Breakfast" | "Lunch" | "Dinner" | "Late Night";
export type BudgetLevel = 1 | 2 | 3 | 4;

export type MealCategory = "Rice" | "Noodles" | "Soup" | "Snack" | "Dessert" | "Drink";
export type MealTaste = "Spicy" | "Mild" | "Sweet" | "Savory" | "Sour";
export type DietaryRestriction = "vegetarian" | "vegan" | "halal";

export interface Meal {
  id: string;
  name: string;
  nameTh: string;
  category: MealCategory;
  tastes: MealTaste[];
  cuisines: FoodType[];
  keywords: string[];
  priceRange: [number, number];
  restaurantSearchTerms: string[];
  tags: string[];
  dietary: DietaryRestriction[];
  image: string | null;
}

export interface MealPreferences {
  category: MealCategory | "Any";
  tastes: MealTaste[];
  cuisine: FoodType | "Any";
  budgetMax: number | null;
  distanceKm: number;
  openNowOnly: boolean;
  requireTakeaway: boolean;
  requireDelivery: boolean;
  requireParking: boolean;
  requireOutdoorSeating: boolean;
  dietaryRestrictions: DietaryRestriction[];
  exclusions: string[];
}

export interface MealRecommendation {
  meal: Meal;
  score: number;
  reasons: string[];
  scoreBreakdown: {
    preference: number;
    taste: number;
    budget: number;
    affinity: number;
    novelty: number;
  };
}

export interface CompletedMeal {
  id: string;
  completedAt: string;
  meal: Meal;
  recommendationScore: number;
  restaurant: Pick<Restaurant, "id" | "osmId" | "name" | "lat" | "lng" | "address" | "cuisine"> | null;
  preferences: MealPreferences;
  locationLabel: string | null;
  stickerId: string;
}

export interface StickerDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

export type MissionStatus = "available" | "in_progress" | "completed" | "claimed";
export interface DailyMission {
  id: string;
  title: string;
  description: string;
  coinReward: number;
  status: MissionStatus;
  progress: number;
  target: number;
}

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: "theme" | "sticker-pack" | "profile";
}

export interface UserSettings {
  displayName: string;
  preferredCuisines: FoodType[];
  preferredCategories: MealCategory[];
  preferredTastes: MealTaste[];
  defaultBudgetMax: number | null;
  defaultRadiusKm: number;
  dietaryRestrictions: DietaryRestriction[];
  exclusions: string[];
}

export interface GroupMember {
  id: string;
  name: string;
  preferences: MealPreferences;
}

export interface GroupRecommendation extends MealRecommendation {
  memberMatches: number;
  memberCount: number;
  compromiseReason: string;
}

export interface MenuItem {
  name: string;
  price: number;
}

/**
 * A real, named place to eat sourced from OpenStreetMap (via Overpass).
 * There is no mock/hardcoded fallback shape — every field here is either
 * a real OSM tag or derived directly from one. Fields OSM doesn't reliably
 * provide (menus, star ratings) are simply absent rather than fabricated.
 */
export interface Restaurant {
  id: number; // stable positive int hashed from osmId — numeric ids are used throughout routes/favorites/history
  osmId: string; // canonical id, e.g. "node/123456" or "way/98765"
  osmType: "node" | "way" | "relation";
  name: string;

  foodType: FoodType; // best-effort bucket from the OSM cuisine tag, used for filter chips
  cuisine: string | null; // raw OSM `cuisine` tag (may be semicolon-separated, e.g. "thai;noodle")
  amenity?: string | null;

  priceLevel: BudgetLevel; // heuristic estimate — see priceLevelEstimated
  priceLevelEstimated: boolean;

  distanceKm: number;
  lat: number;
  lng: number;

  address: string | null; // built from addr:* tags
  openingHoursRaw: string | null; // raw OSM `opening_hours` syntax, shown verbatim as a fallback
  openNow: boolean | null; // parsed from openingHoursRaw; null = unknown, never assumed closed

  phone: string | null;
  website: string | null;
  /** Exact venue Wikidata entity, when tagged in OpenStreetMap. */
  wikidataId?: string | null;
  /** Real store photo linked from OSM's image/Wikimedia Commons tags, when available. */
  imageUrl?: string | null;
  imageSourceUrl?: string | null;

  wheelchair: boolean | null;
  takeaway: boolean | null;
  delivery: boolean | null;
  outdoorSeating: boolean | null;
  parking: boolean | null;

  color: string; // stable pastel color derived from osmId, used as a card fallback background
  menu: MenuItem[]; // always [] for real OSM data — OSM has no menu-item API; kept for type compatibility

  aiSummary?: string | null;
  isRealData?: boolean;
}

export interface ScoredRestaurant extends Restaurant {
  score: number; // 0-100
  reasons: string[]; // "Recommended because ..." bullet list, grounded in the fields above
  matchLevel?: "keyword" | "cuisine" | "category" | "nearby";
  matchDisclosure?: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export type SearchMode = "current" | "manual" | "map";

export interface RecommendationPreferences {
  foodType: FoodType | "Any";
  budget: BudgetLevel;
  distanceKm: number;
  time: MealTime;
  openNowOnly: boolean;
  requireTakeaway: boolean;
  requireDelivery: boolean;
  requireParking: boolean;
  requireOutdoorSeating: boolean;
}

/**
 * Self-reported "how are you feeling about food right now" check-in.
 * Deliberately NOT camera/face-based — Claude doesn't fabricate biometric
 * emotion-recognition. The user picks how they feel; that honestly biases
 * scoring toward matching cuisines instead of pretending to detect it.
 */
export type MoodKey = "spicy" | "hungry" | "neutral" | "light" | "lowAppetite";

/** Longer-lived taste profile (Preferences page) — distinct from the
 * single-select session filter on Home. `disliked` hard-excludes;
 * `liked` gives a soft scoring bonus. */
export interface TasteProfile {
  liked: FoodType[];
  disliked: FoodType[];
}

export interface FeedbackEvent {
  restaurantId: number;
  action: "selected" | "ignored" | "favorited" | "rated";
  rating?: number;
  timestamp: string;
}

export interface ModelStatus {
  trained: boolean;
  lastTrainedAt: string | null;
  validationMae: number | null;
  datasetRows: number;
}

export interface HistoryEntry {
  restaurantId: number;
  viewedAt: string;
}

export interface UserProfile {
  id: number;
  displayName: string;
  email: string;
  favoriteFoodTypes: FoodType[];
}

/** A Nominatim search/reverse-geocode result — powers the manual location autocomplete. */
export interface LocationSuggestion {
  label: string;
  lat: number;
  lng: number;
  type: string;
  osmId?: string | null;
}
