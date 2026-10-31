import { recommendMeals } from "./mealRecommend";
import type { GroupMember, GroupRecommendation, Meal, MealPreferences } from "../types";

function commonPreferences(members: GroupMember[]): MealPreferences {
  const base = members[0]?.preferences;
  if (!base) {
    return { category: "Any", tastes: [], cuisine: "Any", budgetMax: null, distanceKm: 5, openNowOnly: false, requireTakeaway: false, requireDelivery: false, requireParking: false, requireOutdoorSeating: false, dietaryRestrictions: [], exclusions: [] };
  }
  const budgets = members.map((m) => m.preferences.budgetMax).filter((v): v is number => v != null);
  const restrictions = Array.from(new Set(members.flatMap((m) => m.preferences.dietaryRestrictions)));
  return {
    category: members.every((m) => m.preferences.category === base.category) ? base.category : "Any",
    tastes: Array.from(new Set(members.flatMap((m) => m.preferences.tastes))),
    cuisine: members.every((m) => m.preferences.cuisine === base.cuisine) ? base.cuisine : "Any",
    budgetMax: budgets.length ? Math.min(...budgets) : null,
    distanceKm: Math.min(...members.map((m) => m.preferences.distanceKm)),
    openNowOnly: members.some((m) => m.preferences.openNowOnly),
    requireTakeaway: members.some((m) => m.preferences.requireTakeaway),
    requireDelivery: members.some((m) => m.preferences.requireDelivery),
    requireParking: members.some((m) => m.preferences.requireParking),
    requireOutdoorSeating: members.some((m) => m.preferences.requireOutdoorSeating),
    dietaryRestrictions: restrictions,
    exclusions: Array.from(new Set(members.flatMap((m) => m.preferences.exclusions))),
  };
}

function memberLikesMeal(member: GroupMember, meal: Meal): boolean {
  const prefs = member.preferences;
  const categoryMatch = prefs.category === "Any" || prefs.category === meal.category;
  const cuisineMatch = prefs.cuisine === "Any" || meal.cuisines.includes(prefs.cuisine);
  const tasteMatch = !prefs.tastes.length || meal.tastes.some((taste) => prefs.tastes.includes(taste));
  const budgetMatch = prefs.budgetMax == null || meal.priceRange[0] <= prefs.budgetMax;
  return categoryMatch && cuisineMatch && tasteMatch && budgetMatch;
}

export function recommendForGroup(members: GroupMember[], limit = 5): GroupRecommendation[] {
  if (!members.length) return [];
  const aggregate = commonPreferences(members);
  return recommendMeals(aggregate, {}, 30)
    .map((recommendation) => {
      const memberMatches = members.filter((member) => memberLikesMeal(member, recommendation.meal)).length;
      const satisfaction = memberMatches / members.length;
      return {
        ...recommendation,
        score: Math.round(recommendation.score * 0.55 + satisfaction * 45),
        memberMatches,
        memberCount: members.length,
        compromiseReason: `Matches ${memberMatches}/${members.length} members and respects all combined dietary restrictions.`,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
