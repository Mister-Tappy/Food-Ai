import { describe, it, expect } from "vitest";
import { haversineKm, hashOsmId } from "../src/lib/geo";
import { osmToRestaurant } from "../src/lib/placeMapper";
import type { RawOsmRestaurant } from "../src/lib/osmPlaces";

describe("haversineKm", () => {
  it("returns ~0 for the same point", () => {
    const p = { lat: 13.7563, lng: 100.5018 };
    expect(haversineKm(p, p)).toBeCloseTo(0, 5);
  });

  it("computes a known distance (Bangkok landmarks, roughly a few km apart)", () => {
    const a = { lat: 13.7563, lng: 100.5018 };
    const b = { lat: 13.746, lng: 100.534 };
    const km = haversineKm(a, b);
    expect(km).toBeGreaterThan(2);
    expect(km).toBeLessThan(6);
  });
});

describe("hashOsmId", () => {
  it("is deterministic for the same osmId", () => {
    expect(hashOsmId("node/123456")).toBe(hashOsmId("node/123456"));
  });

  it("differs for different osmIds (no collision in this small sample)", () => {
    expect(hashOsmId("node/123456")).not.toBe(hashOsmId("way/987654"));
  });

  it("always returns a positive integer", () => {
    const id = hashOsmId("node/999");
    expect(Number.isInteger(id)).toBe(true);
    expect(id).toBeGreaterThan(0);
  });
});

describe("osmToRestaurant", () => {
  const origin = { lat: 13.7563, lng: 100.5018 };
  const place: RawOsmRestaurant = {
    osmId: "node/42",
    osmType: "node",
    name: "Test Sushi Bar",
    lat: 13.746,
    lng: 100.534,
    cuisine: "japanese;sushi",
    foodType: "Japanese",
    priceLevel: 3,
    priceLevelEstimated: true,
    address: "Somewhere, Bangkok",
    openingHoursRaw: "Mo-Su 11:00-22:00",
    openNow: true,
    phone: "+66 2 000 0000",
    website: "https://example.com",
    wheelchair: true,
    takeaway: true,
    delivery: false,
    outdoorSeating: false,
    parking: null,
    aiSummary: "A mid-range spot serving Japanese food.",
  };

  it("copies OSM's coordinates exactly (no rounding/mutation)", () => {
    const r = osmToRestaurant(place, origin);
    expect(r.lat).toBe(place.lat);
    expect(r.lng).toBe(place.lng);
  });

  it("marks the restaurant as real data and keeps the original osmId", () => {
    const r = osmToRestaurant(place, origin);
    expect(r.isRealData).toBe(true);
    expect(r.osmId).toBe("node/42");
  });

  it("keeps a recognized food type as-is", () => {
    const r = osmToRestaurant(place, origin);
    expect(r.foodType).toBe("Japanese");
  });

  it("falls back to 'Other' for an unrecognized food type", () => {
    const r = osmToRestaurant({ ...place, foodType: "made_up_type" }, origin);
    expect(r.foodType).toBe("Other");
  });

  it("computes distanceKm from the given origin via haversine", () => {
    const r = osmToRestaurant(place, origin);
    const expected = haversineKm(origin, { lat: place.lat, lng: place.lng });
    expect(r.distanceKm).toBeCloseTo(expected, 0);
  });

  it("never fabricates a menu", () => {
    const r = osmToRestaurant(place, origin);
    expect(r.menu).toEqual([]);
  });
});
