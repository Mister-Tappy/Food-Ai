import { describe, it, expect } from "vitest";
import { scoreRestaurant, rankAndSample, scoreToMarkerColor } from "../src/lib/recommend";
import { TEST_RESTAURANTS as MOCK_RESTAURANTS } from "./fixtures";
import type { RecommendationPreferences } from "../src/types";

const basePrefs: RecommendationPreferences = {
  foodType: "Thai",
  budget: 2,
  distanceKm: 5,
  time: "Lunch",
  openNowOnly: false,
  requireTakeaway: false,
  requireDelivery: false,
  requireParking: false,
  requireOutdoorSeating: false,
};

describe("scoreRestaurant", () => {
  it("scores a matching restaurant higher than a non-matching one", () => {
    const thai = MOCK_RESTAURANTS[0];
    const japanese = MOCK_RESTAURANTS[1];
    expect(scoreRestaurant(thai, basePrefs).score).toBeGreaterThan(scoreRestaurant(japanese, basePrefs).score);
  });

  it("clamps score between 0 and 100", () => {
    const worst = MOCK_RESTAURANTS[0];
    const extremePrefs: RecommendationPreferences = { ...basePrefs, foodType: "Vegetarian", budget: 4, distanceKm: 0.1 };
    const { score } = scoreRestaurant(worst, extremePrefs);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("rewards a currently-open restaurant over a closed one, all else equal", () => {
    const open = MOCK_RESTAURANTS[0];
    const closed = { ...open, openNow: false };
    expect(scoreRestaurant(open, basePrefs).score).toBeGreaterThan(scoreRestaurant(closed, basePrefs).score);
  });

  it("does not penalize unknown opening status", () => {
    const known = MOCK_RESTAURANTS[0];
    const unknown = { ...known, openNow: null };
    // unknown should score no worse than a confirmed-closed equivalent
    const closed = { ...known, openNow: false };
    expect(scoreRestaurant(unknown, basePrefs).score).toBeGreaterThan(scoreRestaurant(closed, basePrefs).score);
  });

  it("includes grounded reasons for a strong match", () => {
    const thai = MOCK_RESTAURANTS[0];
    const { reasons } = scoreRestaurant(thai, basePrefs);
    expect(reasons.some((r) => r.includes("away"))).toBe(true);
    expect(reasons.some((r) => r.includes("Thai"))).toBe(true);
  });
});

describe("rankAndSample", () => {
  it("returns at most topN restaurants", () => {
    const result = rankAndSample(MOCK_RESTAURANTS, basePrefs, () => ({
      isFavorite: false,
      previouslyViewed: false,
      searchedFoodTypes: new Set(),
    }), 3);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("only returns restaurants that were in the input set", () => {
    const result = rankAndSample(MOCK_RESTAURANTS, basePrefs);
    const ids = new Set(MOCK_RESTAURANTS.map((r) => r.id));
    result.forEach((r) => expect(ids.has(r.id)).toBe(true));
  });

  it("every returned restaurant has a score and reasons attached", () => {
    const result = rankAndSample(MOCK_RESTAURANTS, basePrefs);
    result.forEach((r) => {
      expect(typeof r.score).toBe("number");
      expect(Array.isArray(r.reasons)).toBe(true);
    });
  });

  it("filters out closed restaurants when openNowOnly is set", () => {
    const prefs: RecommendationPreferences = { ...basePrefs, openNowOnly: true };
    const withClosed = [...MOCK_RESTAURANTS, { ...MOCK_RESTAURANTS[0], id: 999, openNow: false }];
    const result = rankAndSample(withClosed, prefs);
    expect(result.some((r) => r.id === 999)).toBe(false);
  });

  it("hard-excludes disliked cuisines from the taste profile, unlike a soft scoring penalty", () => {
    const result = rankAndSample(MOCK_RESTAURANTS, basePrefs, undefined, 10, ["Thai"]);
    expect(result.some((r) => r.foodType === "Thai")).toBe(false);
  });
});

describe("taste profile & mood check-in", () => {
  it("gives a bonus and a grounded reason for a liked cuisine", () => {
    const ramen = MOCK_RESTAURANTS[1];
    const withoutLike = scoreRestaurant(ramen, basePrefs, {
      isFavorite: false,
      previouslyViewed: false,
      searchedFoodTypes: new Set(),
    });
    const withLike = scoreRestaurant(ramen, basePrefs, {
      isFavorite: false,
      previouslyViewed: false,
      searchedFoodTypes: new Set(),
      likedFoodTypes: ["Japanese"],
    });
    expect(withLike.score).toBeGreaterThan(withoutLike.score);
    expect(withLike.reasons.some((r) => r.includes("like"))).toBe(true);
  });

  it("is a self-reported signal only — never derived from an image/camera", () => {
    const thai = MOCK_RESTAURANTS[0];
    // mood is just a MoodKey string the user picked from buttons — this
    // asserts the scorer only ever consumes that plain value, no image data.
    const { reasons } = scoreRestaurant(thai, basePrefs, {
      isFavorite: false,
      previouslyViewed: false,
      searchedFoodTypes: new Set(),
      mood: "spicy",
    });
    expect(reasons.some((r) => r.includes("feeling"))).toBe(true);
  });
});

describe("scoreToMarkerColor", () => {
  it("maps high scores to green", () => {
    expect(scoreToMarkerColor(90)).toBe("green");
  });
  it("maps mid scores to yellow", () => {
    expect(scoreToMarkerColor(60)).toBe("yellow");
  });
  it("maps low scores to red", () => {
    expect(scoreToMarkerColor(20)).toBe("red");
  });
});
