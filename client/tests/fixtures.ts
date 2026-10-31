import type { Restaurant } from "../src/types";

const base: Omit<Restaurant, "id" | "osmId" | "name" | "foodType" | "cuisine" | "distanceKm" | "openNow"> = {
  osmType: "node",
  priceLevel: 2,
  priceLevelEstimated: true,
  lat: 13.7563,
  lng: 100.5018,
  address: null,
  openingHoursRaw: null,
  phone: null,
  website: null,
  wheelchair: null,
  takeaway: null,
  delivery: null,
  outdoorSeating: null,
  parking: null,
  color: "#fde68a",
  menu: [],
  isRealData: true,
};

export const TEST_RESTAURANTS: Restaurant[] = [
  { ...base, id: 1, osmId: "node/1", name: "Thai Test Fixture", foodType: "Thai", cuisine: "thai", distanceKm: 0.8, openNow: true, takeaway: true },
  { ...base, id: 2, osmId: "node/2", name: "Japanese Test Fixture", foodType: "Japanese", cuisine: "japanese;ramen", distanceKm: 2.2, openNow: true },
  { ...base, id: 3, osmId: "node/3", name: "Cafe Test Fixture", foodType: "Cafe", cuisine: "coffee_shop", distanceKm: 1.4, openNow: null },
  { ...base, id: 4, osmId: "node/4", name: "Vegetarian Test Fixture", foodType: "Vegetarian", cuisine: "vegan", distanceKm: 3.5, openNow: false },
];
