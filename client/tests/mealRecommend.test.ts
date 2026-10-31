import { describe, expect, it } from "vitest";
import { DEFAULT_MEAL_PREFERENCES } from "../src/store/useAppStore";
import { recommendMeals, scoreMeal } from "../src/lib/mealRecommend";
import { parseFoodIntent } from "../src/lib/preferenceParser";
import { recommendForGroup } from "../src/lib/groupRecommend";
import { createDailyMissions, progressMission } from "../src/lib/gamification";
import { MEAL_BY_ID } from "../src/data/meals";

describe("meal recommendation", () => {
  it("scores a matching spicy rice meal above an unrelated drink", () => {
    const prefs = { ...DEFAULT_MEAL_PREFERENCES, category: "Rice" as const, tastes: ["Spicy" as const], cuisine: "Thai" as const, budgetMax: 120 };
    const krapow = scoreMeal(MEAL_BY_ID.get("pad-krapow")!, prefs);
    const coffee = scoreMeal(MEAL_BY_ID.get("coffee")!, prefs);
    expect(krapow.score).toBeGreaterThan(coffee.score);
    expect(krapow.reasons.length).toBeGreaterThan(0);
  });

  it("Try Another excludes the current result", () => {
    const first = recommendMeals(DEFAULT_MEAL_PREFERENCES)[0];
    const second = recommendMeals(DEFAULT_MEAL_PREFERENCES, { excludeMealIds: [first.meal.id] })[0];
    expect(second.meal.id).not.toBe(first.meal.id);
  });

  it("filters meals that violate an explicit vegan restriction", () => {
    const results = recommendMeals({ ...DEFAULT_MEAL_PREFERENCES, dietaryRestrictions: ["vegan"] });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.meal.dietary.includes("vegan"))).toBe(true);
  });
});

describe("food intent parser", () => {
  it("extracts Thai taste, budget, cuisine, and distance", () => {
    const result = parseFoodIntent("อยากกินอาหารญี่ปุ่นเผ็ดๆ ไม่เกิน 150 บาท ใกล้ฉันไม่เกิน 3 km");
    expect(result.preferences.cuisine).toBe("Japanese");
    expect(result.preferences.tastes).toContain("Spicy");
    expect(result.preferences.budgetMax).toBe(150);
    expect(result.preferences.distanceKm).toBe(3);
    expect(result.asksForRestaurants).toBe(true);
  });
});

describe("group scoring and missions", () => {
  it("returns a group score with member satisfaction evidence", () => {
    const members = [
      { id: "1", name: "A", preferences: { ...DEFAULT_MEAL_PREFERENCES, category: "Rice" as const } },
      { id: "2", name: "B", preferences: { ...DEFAULT_MEAL_PREFERENCES, category: "Rice" as const } },
    ];
    const result = recommendForGroup(members)[0];
    expect(result.memberMatches).toBe(2);
    expect(result.compromiseReason).toContain("2/2");
  });

  it("completes but does not auto-claim a mission", () => {
    const mission = progressMission(createDailyMissions(), "complete-meal").find((item) => item.id === "complete-meal")!;
    expect(mission.status).toBe("completed");
  });
});
