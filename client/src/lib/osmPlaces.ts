import type { GeoPoint, LocationSuggestion } from "../types";

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

export interface RawOsmRestaurant {
  osmId: string;
  osmType: "node" | "way" | "relation";
  name: string;
  lat: number;
  lng: number;
  cuisine: string | null;
  amenity?: string | null;
  foodType: string;
  priceLevel: 1 | 2 | 3 | 4;
  priceLevelEstimated: boolean;
  address: string | null;
  openingHoursRaw: string | null;
  openNow: boolean | null;
  phone: string | null;
  website: string | null;
  wikidataId?: string | null;
  imageUrl?: string | null;
  imageSourceUrl?: string | null;
  wheelchair: boolean | null;
  takeaway: boolean | null;
  delivery: boolean | null;
  outdoorSeating: boolean | null;
  parking: boolean | null;
  aiSummary: string | null;
}

export class OsmApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "OsmApiError";
  }
}

async function request<T>(path: string): Promise<T> {
  if (!API_URL) {
    throw new OsmApiError(
      "No backend configured (VITE_API_URL is unset) — real restaurant search requires the backend API."
    );
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`);
  } catch {
    throw new OsmApiError("Could not reach the backend API. Check your connection and try again.");
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* non-JSON error body — keep default message */
    }
    throw new OsmApiError(message, res.status);
  }
  return (await res.json()) as T;
}

export const osmPlaces = {
  /** Real restaurants around `origin` from OpenStreetMap (via Overpass) — never mock data. */
  async nearby(origin: GeoPoint, radiusKm: number): Promise<RawOsmRestaurant[]> {
    const radiusMeters = Math.round(radiusKm * 1000);
    const params = new URLSearchParams({
      lat: String(origin.lat),
      lng: String(origin.lng),
      radius: String(radiusMeters),
    });
    const data = await request<{ results: RawOsmRestaurant[] }>(`/places/nearby?${params.toString()}`);
    return data.results;
  },

  /** Address/landmark autocomplete (province, district, university, mall, hospital, landmark, address) via Nominatim. */
  async search(query: string): Promise<LocationSuggestion[]> {
    const params = new URLSearchParams({ q: query });
    const data = await request<{ results: LocationSuggestion[] }>(`/places/search?${params.toString()}`);
    return data.results;
  },

  /** Reverse-geocode a point the user clicked on the map into a human-readable label. */
  async reverse(point: GeoPoint): Promise<LocationSuggestion | null> {
    const params = new URLSearchParams({ lat: String(point.lat), lng: String(point.lng) });
    const data = await request<{ result: LocationSuggestion | null }>(`/places/reverse?${params.toString()}`);
    return data.result;
  },

  /** Real image published by the venue's official site or exact Wikidata record. */
  async photo(
    website: string | null,
    wikidataId: string | null
  ): Promise<{ url: string; sourceUrl: string; label: string } | null> {
    if (!website && !wikidataId) return null;
    const params = new URLSearchParams();
    if (website) params.set("website", website);
    if (wikidataId) params.set("wikidataId", wikidataId);
    const data = await request<{
      photo: { url: string; sourceUrl: string; label: string } | null;
    }>(`/places/photo?${params.toString()}`);
    return data.photo;
  },

  isLive(): boolean {
    return Boolean(API_URL);
  },
};
