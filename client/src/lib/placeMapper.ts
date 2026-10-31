import type { FoodType, GeoPoint, Restaurant } from "../types";
import type { RawOsmRestaurant } from "./osmPlaces";
import { haversineKm, hashOsmId } from "./geo";

const KNOWN_FOOD_TYPES: FoodType[] = [
  "Thai",
  "Japanese",
  "Chinese",
  "Korean",
  "Cafe",
  "Dessert",
  "Fast Food",
  "Steak",
  "Seafood",
  "Vegetarian",
  "Halal",
  "Other",
];

function coerceFoodType(value: string): FoodType {
  return (KNOWN_FOOD_TYPES as string[]).includes(value) ? (value as FoodType) : "Other";
}

// Stable pastel color derived from the OSM id, used as a card fallback background.
const PALETTE = ["#FDE68A", "#BFDBFE", "#FCA5A5", "#FDBA74", "#86EFAC", "#F9A8D4", "#C4B5FD", "#99F6E4"];
function colorForId(osmId: string): string {
  let sum = 0;
  for (let i = 0; i < osmId.length; i++) sum += osmId.charCodeAt(i);
  return PALETTE[sum % PALETTE.length];
}

/**
 * Converts a raw Overpass/OSM restaurant into the app's Restaurant shape.
 * Coordinates are copied verbatim from OSM. Distance is computed from the
 * chosen search origin via the haversine formula (OSM doesn't return one).
 */
export function osmToRestaurant(place: RawOsmRestaurant, origin: GeoPoint): Restaurant {
  return {
    id: hashOsmId(place.osmId),
    osmId: place.osmId,
    osmType: place.osmType,
    isRealData: true,
    name: place.name,
    foodType: coerceFoodType(place.foodType),
    cuisine: place.cuisine,
    amenity: place.amenity ?? null,
    priceLevel: place.priceLevel,
    priceLevelEstimated: place.priceLevelEstimated,
    distanceKm: Math.round(haversineKm(origin, { lat: place.lat, lng: place.lng }) * 10) / 10,
    lat: place.lat,
    lng: place.lng,
    address: place.address,
    openingHoursRaw: place.openingHoursRaw,
    openNow: place.openNow,
    phone: place.phone,
    website: place.website,
    wikidataId: place.wikidataId ?? null,
    imageUrl: place.imageUrl ?? null,
    imageSourceUrl: place.imageSourceUrl ?? null,
    wheelchair: place.wheelchair,
    takeaway: place.takeaway,
    delivery: place.delivery,
    outdoorSeating: place.outdoorSeating,
    parking: place.parking,
    color: colorForId(place.osmId),
    menu: [], // OSM has no menu-item API — left empty by design, never fabricated
    aiSummary: place.aiSummary,
  };
}
