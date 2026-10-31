import { MEALS } from "../data/meals";
import type { CompletedMeal, Meal, MealPreferences, MealRecommendation, UserSettings } from "../types";

export interface MealScoreContext {
  history?: CompletedMeal[];
  likedMealIds?: string[];
  dislikedMealIds?: string[];
  settings?: UserSettings;
  excludeMealIds?: string[];
}

function intersects<T>(a: T[], b: T[]): boolean {
  return a.some((value) => b.includes(value));
}

export function mealIsAllowed(meal: Meal, prefs: MealPreferences): boolean {
  if (prefs.dietaryRestrictions.some((restriction) => !meal.dietary.includes(restriction))) return false;
  const haystack = `${meal.name} ${meal.nameTh} ${meal.keywords.join(" ")} ${meal.tags.join(" ")}`.toLowerCase();
  return !prefs.exclusions.some((term) => term.trim() && haystack.includes(term.trim().toLowerCase()));
}

export function scoreMeal(meal: Meal, prefs: MealPreferences, ctx: MealScoreContext = {}): MealRecommendation {
  let preference = 8;
  let taste = 6;
  let budget = 6;
  let affinity = 4;
  let novelty = 10;
  const reasons: string[] = [];

  if (prefs.category !== "Any") {
    if (meal.category === prefs.category) {
      preference += 20;
      reasons.push(`Matches your ${prefs.category.toLowerCase()} choice`);
    } else preference -= 10;
  }

  if (prefs.cuisine !== "Any") {
    if (meal.cuisines.includes(prefs.cuisine)) {
      preference += 14;
      reasons.push(`Fits your ${prefs.cuisine} cuisine preference`);
    } else preference -= 8;
  }

  if (prefs.tastes.length) {
    const matches = meal.tastes.filter((item) => prefs.tastes.includes(item));
    taste += Math.round((matches.length / prefs.tastes.length) * 18);
    if (matches.length) reasons.push(`${matches.join(" and ")} taste profile`);
  }

  if (prefs.budgetMax != null) {
    if (meal.priceRange[0] <= prefs.budgetMax) {
      budget += meal.priceRange[1] <= prefs.budgetMax ? 14 : 8;
      reasons.push(`Typical price can fit within ฿${prefs.budgetMax}`);
    } else budget -= 12;
  }

  if (ctx.likedMealIds?.includes(meal.id)) {
    affinity += 10;
    reasons.push("Similar to meals you liked");
  }
  if (ctx.settings && intersects(meal.cuisines, ctx.settings.preferredCuisines)) affinity += 6;
  if (ctx.settings && ctx.settings.preferredCategories.includes(meal.category)) affinity += 4;
  if (ctx.settings && intersects(meal.tastes, ctx.settings.preferredTastes)) affinity += 4;

  const recent = (ctx.history || []).slice(0, 8);
  const exactRecency = recent.findIndex((entry) => entry.meal.id === meal.id);
  if (exactRecency >= 0) {
    novelty -= Math.max(6, 18 - exactRecency * 2);
  } else {
    novelty += 8;
    reasons.push("Adds variety to your recent meals");
  }
  if (ctx.dislikedMealIds?.includes(meal.id)) preference -= 40;
  if (ctx.excludeMealIds?.includes(meal.id)) novelty -= 50;

  const raw = preference + taste + budget + affinity + novelty;
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  return {
    meal,
    score,
    reasons: reasons.slice(0, 4),
    scoreBreakdown: { preference, taste, budget, affinity, novelty },
  };
}

export function recommendMeals(
  prefs: MealPreferences,
  ctx: MealScoreContext = {},
  limit = 10
): MealRecommendation[] {
  const allowed = MEALS.filter((meal) => mealIsAllowed(meal, prefs));
  const withoutExcluded = allowed.filter((meal) => !ctx.excludeMealIds?.includes(meal.id));
  const pool = withoutExcluded.length ? withoutExcluded : allowed;
  return pool
    .map((meal) => scoreMeal(meal, prefs, ctx))
    .sort((a, b) => b.score - a.score || a.meal.id.localeCompare(b.meal.id))
    .slice(0, limit);
}
