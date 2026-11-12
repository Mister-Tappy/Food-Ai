import type { GeoPoint, LocationSuggestion } from "../types";

/** Browser-only OSM client. GitHub Pages needs no proxy or API key. */
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const cooldowns = new Map<string, number>();
const nearbyCache = new Map<string, RawOsmRestaurant[]>();
const searchCache = new Map<string, LocationSuggestion[]>();
const reverseCache = new Map<string, LocationSuggestion | null>();
let nextEndpoint = 0;
let lastNominatimRequest = 0;
let nominatimQueue = Promise.resolve();

export interface RawOsmRestaurant {
  osmId: string; osmType: "node" | "way" | "relation"; name: string; lat: number; lng: number;
  cuisine: string | null; amenity?: string | null; foodType: string; priceLevel: 1 | 2 | 3 | 4;
  priceLevelEstimated: boolean; address: string | null; openingHoursRaw: string | null; openNow: boolean | null;
  phone: string | null; website: string | null; wikidataId?: string | null; imageUrl?: string | null;
  imageSourceUrl?: string | null; wheelchair: boolean | null; takeaway: boolean | null; delivery: boolean | null;
  outdoorSeating: boolean | null; parking: boolean | null; aiSummary: string | null;
}
interface OverpassElement { type: "node" | "way" | "relation"; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string>; }

export class OsmApiError extends Error { constructor(message: string, public status?: number) { super(message); this.name = "OsmApiError"; } }

function validate(point: GeoPoint): void {
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng) || Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180) throw new OsmApiError("Choose a valid map location.", 400);
}
function query(origin: GeoPoint, radius: number): string {
  const around = `(around:${radius},${origin.lat},${origin.lng})`;
  return `[out:json][timeout:20];(nwr["amenity"~"^(restaurant|cafe|fast_food|food_court)$"]["name"]${around};nwr["shop"~"^(bakery|confectionery)$"]["name"]${around};);out center tags 120;`;
}
async function fetchTimeout(url: string, options: RequestInit = {}, timeout = 12_000): Promise<Response> {
  const controller = new AbortController(); const timer = window.setTimeout(() => controller.abort(), timeout);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  catch { throw new OsmApiError("Restaurant data is temporarily unavailable. Please try again.", 503); }
  finally { window.clearTimeout(timer); }
}
function typeFor(tags: Record<string, string>): string {
  const source = `${tags.cuisine || ""} ${tags.name || ""} ${tags.amenity || ""} ${tags.shop || ""}`.toLowerCase();
  const map: Array<[string, string]> = [["thai", "Thai"], ["japanese", "Japanese"], ["sushi", "Japanese"], ["ramen", "Japanese"], ["chinese", "Chinese"], ["korean", "Korean"], ["coffee", "Cafe"], ["cafe", "Cafe"], ["dessert", "Dessert"], ["ice_cream", "Dessert"], ["cake", "Dessert"], ["bakery", "Dessert"], ["confectionery", "Dessert"], ["burger", "Fast Food"], ["fast_food", "Fast Food"], ["chicken", "Fast Food"], ["pizza", "Fast Food"], ["steak", "Steak"], ["seafood", "Seafood"], ["fish", "Seafood"], ["vegetarian", "Vegetarian"], ["vegan", "Vegetarian"], ["halal", "Halal"]];
  return map.find(([term]) => source.includes(term))?.[1] || (tags.amenity === "fast_food" ? "Fast Food" : tags.amenity === "cafe" ? "Cafe" : "Other");
}
function priceFor(tags: Record<string, string>): 1 | 2 | 3 | 4 {
  if (["fast_food", "food_court", "cafe"].includes(tags.amenity) || ["bakery", "confectionery"].includes(tags.shop)) return 1;
  return /steak|fine_dining|seafood/.test(tags.cuisine || "") ? 3 : 2;
}
function yesNo(value?: string): boolean | null {
  if (value === undefined) return null; if (["yes", "true", "1", "designated", "limited"].includes(value.toLowerCase())) return true;
  return ["no", "false", "0"].includes(value.toLowerCase()) ? false : null;
}
function addressFor(tags: Record<string, string>): string | null {
  const values = [tags["addr:housenumber"], tags["addr:street"], tags["addr:suburb"], tags["addr:city"] || tags["addr:town"] || tags["addr:village"], tags["addr:province"] || tags["addr:state"], tags["addr:postcode"]].filter(Boolean);
  return values.length ? values.join(" ") : null;
}
function imageFor(tags: Record<string, string>): Pick<RawOsmRestaurant, "imageUrl" | "imageSourceUrl"> {
  const raw = (tags.image || tags.wikimedia_commons || "").split(";")[0].trim(); const match = raw.match(/^(?:File:|https:\/\/commons\.wikimedia\.org\/wiki\/File:)(.+)$/i);
  if (match) { const file = decodeURIComponent(match[1]).replace(/_/g, " "); return { imageUrl: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}`, imageSourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}` }; }
  return raw.startsWith("https://") ? { imageUrl: raw, imageSourceUrl: raw } : { imageUrl: null, imageSourceUrl: null };
}
function openNow(hours: string | null): boolean | null {
  if (!hours) return null; if (/^(24\/7|Mo-Su\s+24\/7)$/i.test(hours.trim())) return true;
  const match = hours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/); if (!match) return null;
  const now = new Date(); const value = now.getHours() * 60 + now.getMinutes(); const from = Number(match[1]) * 60 + Number(match[2]); const to = Number(match[3]) * 60 + Number(match[4]); return to >= from ? value >= from && value <= to : value >= from || value <= to;
}
function normalize(element: OverpassElement): RawOsmRestaurant | null {
  const tags = element.tags || {}; const lat = element.type === "node" ? element.lat : element.center?.lat; const lng = element.type === "node" ? element.lon : element.center?.lon;
  if (!tags.name || typeof lat !== "number" || typeof lng !== "number") return null;
  const openingHoursRaw = tags.opening_hours || null;
  return { osmId: `${element.type}/${element.id}`, osmType: element.type, name: tags.name, lat, lng, cuisine: tags.cuisine || null, amenity: tags.amenity || tags.shop || null, foodType: typeFor(tags), priceLevel: priceFor(tags), priceLevelEstimated: true, address: addressFor(tags), openingHoursRaw, openNow: openNow(openingHoursRaw), phone: tags.phone || tags["contact:phone"] || null, website: tags.website || tags["contact:website"] || null, wikidataId: tags.wikidata || null, ...imageFor(tags), wheelchair: yesNo(tags.wheelchair), takeaway: yesNo(tags.takeaway), delivery: yesNo(tags.delivery), outdoorSeating: yesNo(tags.outdoor_seating), parking: yesNo(tags.parking), aiSummary: null };
}
async function overpass(text: string): Promise<OverpassElement[]> {
  const now = Date.now(); const candidates = OVERPASS_ENDPOINTS.filter((url) => (cooldowns.get(url) || 0) <= now); const pool = candidates.length ? candidates : OVERPASS_ENDPOINTS;
  const ordered = pool.slice(nextEndpoint % pool.length).concat(pool.slice(0, nextEndpoint % pool.length)); nextEndpoint = (nextEndpoint + 1) % pool.length;
  for (const endpoint of ordered) {
    try {
      const response = await fetchTimeout(endpoint, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: `data=${encodeURIComponent(text)}`,
        referrerPolicy: "strict-origin-when-cross-origin",
      }, 20_000);
      if (!response.ok) { cooldowns.set(endpoint, Date.now() + 60_000); continue; }
      const data = await response.json() as { elements?: OverpassElement[] };
      if (Array.isArray(data.elements)) return data.elements;
    }
    catch { cooldowns.set(endpoint, Date.now() + 60_000); }
  }
  throw new OsmApiError("Restaurant data is temporarily unavailable. Please try again.", 503);
}
function throttled<T>(loader: () => Promise<T>): Promise<T> {
  const task = nominatimQueue.then(async () => { const wait = Math.max(0, 1_100 - (Date.now() - lastNominatimRequest)); if (wait) await new Promise((resolve) => window.setTimeout(resolve, wait)); lastNominatimRequest = Date.now(); return loader(); }); nominatimQueue = task.then(() => undefined, () => undefined); return task;
}
type NominatimPlace = { display_name: string; lat: string; lon: string; type?: string; class?: string; osm_type?: string; osm_id?: number; error?: string };
async function nominatim(path: string): Promise<NominatimPlace[] | NominatimPlace> {
  return throttled(async () => { const response = await fetchTimeout(`${NOMINATIM_URL}${path}`, { headers: { Accept: "application/json" } }); if (!response.ok) throw new OsmApiError("Location search is temporarily unavailable.", 503); return response.json(); });
}
function suggestion(place: NominatimPlace): LocationSuggestion { return { label: place.display_name, lat: Number(place.lat), lng: Number(place.lon), type: place.type || place.class || "place", osmId: place.osm_type && place.osm_id ? `${place.osm_type}/${place.osm_id}` : null }; }

export const osmPlaces = {
  async nearby(origin: GeoPoint, radiusKm: number): Promise<RawOsmRestaurant[]> {
    validate(origin); const radius = Math.max(100, Math.min(20_000, Math.round(radiusKm * 1000))); const key = `${origin.lat.toFixed(3)},${origin.lng.toFixed(3)}:${radius}`; const cached = nearbyCache.get(key); if (cached) return cached;
    const results = (await overpass(query(origin, radius))).map(normalize).filter((item): item is RawOsmRestaurant => Boolean(item)); nearbyCache.set(key, results); return results;
  },
  async search(queryText: string): Promise<LocationSuggestion[]> {
    const q = queryText.trim(); if (q.length < 2 || q.length > 200) return []; const key = q.toLowerCase(); const cached = searchCache.get(key); if (cached) return cached;
    const data = await nominatim(`/search?${new URLSearchParams({ format: "jsonv2", q, addressdetails: "1", limit: "8" })}`); const results = Array.isArray(data) ? data.map(suggestion).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng)) : []; searchCache.set(key, results); return results;
  },
  async reverse(point: GeoPoint): Promise<LocationSuggestion | null> {
    validate(point); const key = `${point.lat.toFixed(3)},${point.lng.toFixed(3)}`; if (reverseCache.has(key)) return reverseCache.get(key) ?? null;
    const data = await nominatim(`/reverse?${new URLSearchParams({ format: "jsonv2", lat: String(point.lat), lon: String(point.lng), zoom: "18", addressdetails: "1" })}`); const result = !Array.isArray(data) && !data.error ? suggestion(data) : null; reverseCache.set(key, result); return result;
  },
  async photo(_website: string | null, wikidataId: string | null): Promise<{ url: string; sourceUrl: string; label: string } | null> {
    if (!wikidataId || !/^Q\d+$/.test(wikidataId)) return null;
    try { const response = await fetchTimeout(`https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`, { headers: { Accept: "application/json" } }, 8_000); const data = await response.json() as { entities?: Record<string, { claims?: { P18?: Array<{ mainsnak?: { datavalue?: { value?: string } } }> } }> }; const file = data.entities?.[wikidataId]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value; return file ? { url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}`, sourceUrl: `https://www.wikidata.org/wiki/${wikidataId}`, label: "Wikidata venue photo" } : null; } catch { return null; }
  },
  isLive(): boolean { return true; },
};
