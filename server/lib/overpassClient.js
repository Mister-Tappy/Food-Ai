// =========================================================
// OVERPASS CLIENT
// Free, keyless replacement for the Google Places Nearby Search client
// that used to live at server/lib/googlePlacesClient.js.
//
// Queries the public Overpass API for real OpenStreetMap data — never
// generates or falls back to fake/mock restaurants. If Overpass is
// unreachable or returns nothing, callers get an empty list (or an
// error), never invented data.
//
// Docs: https://wiki.openstreetmap.org/wiki/Overpass_API
// =========================================================

const { isOpenNow } = require("./openingHours");
const { fetchIPv4, describeError } = require("./httpClient");

// A small pool of public Overpass mirrors — tried in order so a single
// instance being overloaded doesn't take the whole feature down.
// Override with OVERPASS_URL to point at a self-hosted instance.
// Keep this list aligned with the global instances published by the
// OpenStreetMap wiki: https://wiki.openstreetmap.org/wiki/Overpass_API
const configuredEndpoints = (process.env.OVERPASS_URLS || process.env.OVERPASS_URL || "")
  .split(",")
  .map((endpoint) => endpoint.trim())
  .filter(Boolean);
const OVERPASS_ENDPOINTS = configuredEndpoints.length
  ? configuredEndpoints
  : [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.private.coffee/api/interpreter",
      "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    ];
const USER_AGENT =
  process.env.OVERPASS_USER_AGENT ||
  "FoodieAI-OSM-Restaurant-Platform/2.0 (OpenStreetMap restaurant search)";

// Avoid paying the connection-timeout cost again on every request while a
// public mirror is known to be unavailable. If every mirror is cooling down,
// the pool is retried so recovery is detected without requiring a restart.
const ENDPOINT_COOLDOWN_MS = 60 * 1000;
const endpointCooldowns = new Map();
let nextEndpointIndex = 0;

class OverpassApiError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "OverpassApiError";
    this.status = status;
  }
}

// Food-related OSM tags we accept as "a real restaurant / place to eat".
// (amenity=restaurant is the core case; the rest broaden coverage to
// cafes, fast food, food courts, pubs that serve food, and bakeries,
// which the product spec's cuisine chips imply — e.g. "Dessert", "Cafe".)
const FOOD_SELECTORS = [
  'amenity=restaurant',
  'amenity=cafe',
  'amenity=fast_food',
  'amenity=food_court',
  'amenity=pub',
  'amenity=bar',
  'shop=bakery',
  'shop=confectionery',
];

function buildQuery({ lat, lng, radiusMeters }) {
  const around = `(around:${radiusMeters},${lat},${lng})`;
  const clauses = FOOD_SELECTORS.map((sel) => `  nwr[${sel}]${around};`).join("\n");
  return `
[out:json][timeout:25];
(
${clauses}
);
out center tags;
`.trim();
}

// Cuisine keyword -> app FoodType bucket. OSM's cuisine tag is a
// semicolon-separated free-text-ish taxonomy (https://wiki.openstreetmap.org/wiki/Key:cuisine).
const CUISINE_TO_FOOD_TYPE = [
  ["thai", "Thai"],
  ["japanese", "Japanese"],
  ["sushi", "Japanese"],
  ["ramen", "Japanese"],
  ["chinese", "Chinese"],
  ["korean", "Korean"],
  ["coffee_shop", "Cafe"],
  ["cafe", "Cafe"],
  ["dessert", "Dessert"],
  ["ice_cream", "Dessert"],
  ["cake", "Dessert"],
  ["bakery", "Dessert"],
  ["confectionery", "Dessert"],
  ["burger", "Fast Food"],
  ["fast_food", "Fast Food"],
  ["chicken", "Fast Food"],
  ["pizza", "Fast Food"],
  ["steak_house", "Steak"],
  ["steak", "Steak"],
  ["seafood", "Seafood"],
  ["fish", "Seafood"],
  ["vegetarian", "Vegetarian"],
  ["vegan", "Vegetarian"],
  ["halal", "Halal"],
];

function guessFoodType(tags) {
  const haystack = `${tags.cuisine || ""} ${tags.name || ""} ${tags.amenity || ""}`.toLowerCase();
  for (const [keyword, foodType] of CUISINE_TO_FOOD_TYPE) {
    if (haystack.includes(keyword)) return foodType;
  }
  if (tags.amenity === "fast_food") return "Fast Food";
  if (tags.amenity === "cafe") return "Cafe";
  if (tags.shop === "bakery" || tags.shop === "confectionery") return "Dessert";
  return "Other";
}

// OSM very rarely tags price directly. `price_level`/`fee` aren't used
// this way in practice, so we estimate a 1-4 budget bucket from cheap
// signals (amenity type + cuisine) and always flag it as an estimate —
// never presented to the user as ground truth.
function estimatePriceLevel(tags) {
  if (tags.amenity === "fast_food" || tags.amenity === "food_court") return 1;
  if (tags.amenity === "cafe" || tags.shop === "bakery" || tags.shop === "confectionery") return 1;
  const haystack = `${tags.cuisine || ""}`.toLowerCase();
  if (haystack.includes("steak") || haystack.includes("fine_dining") || haystack.includes("seafood")) return 3;
  return 2;
}

function buildAddress(tags) {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"] || tags["addr:town"] || tags["addr:village"],
    tags["addr:province"] || tags["addr:state"],
    tags["addr:postcode"],
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

function yesNo(value) {
  if (value === undefined) return null;
  const v = String(value).toLowerCase();
  if (["yes", "true", "1", "designated", "limited"].includes(v)) return true;
  if (["no", "false", "0"].includes(v)) return false;
  return null;
}

function imageDetails(tags) {
  const raw = String(tags.image || tags.wikimedia_commons || "").trim();
  if (!raw) return { imageUrl: null, imageSourceUrl: null };

  const value = raw.split(";")[0].trim();
  const commonsFileMatch = value.match(
    /^(?:File:|https:\/\/commons\.wikimedia\.org\/wiki\/File:)(.+)$/i
  );

  if (commonsFileMatch) {
    let decodedFilename = commonsFileMatch[1];
    try {
      decodedFilename = decodeURIComponent(decodedFilename);
    } catch {
      // Keep the original OSM tag when it contains a stray percent sign.
    }
    const filename = decodedFilename.replace(/_/g, " ");
    return {
      imageUrl: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`,
      imageSourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename.replace(/ /g, "_"))}`,
    };
  }

  if (value.startsWith("https://")) {
    return { imageUrl: value, imageSourceUrl: value };
  }

  return { imageUrl: null, imageSourceUrl: null };
}

function normalizeElement(el) {
  const tags = el.tags || {};
  if (!tags.name) return null; // never surface an unnamed "restaurant" — not useful/real enough to show

  const lat = el.type === "node" ? el.lat : el.center?.lat;
  const lng = el.type === "node" ? el.lon : el.center?.lon;
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  const openingHoursRaw = tags.opening_hours || null;
  const { imageUrl, imageSourceUrl } = imageDetails(tags);

  return {
    osmId: `${el.type}/${el.id}`,
    osmType: el.type,
    name: tags.name,
    lat,
    lng,
    cuisine: tags.cuisine || null,
    foodType: guessFoodType(tags),
    priceLevel: estimatePriceLevel(tags),
    priceLevelEstimated: true,
    address: buildAddress(tags),
    openingHoursRaw,
    openNow: isOpenNow(openingHoursRaw),
    phone: tags.phone || tags["contact:phone"] || null,
    website: tags.website || tags["contact:website"] || null,
    wikidataId: tags.wikidata || null,
    imageUrl,
    imageSourceUrl,
    wheelchair: yesNo(tags.wheelchair),
    takeaway: yesNo(tags.takeaway),
    delivery: yesNo(tags.delivery),
    outdoorSeating: yesNo(tags.outdoor_seating),
    parking: yesNo(tags.parking) ?? (tags.amenity === "parking" ? true : null),
    amenity: tags.amenity || tags.shop || null,
  };
}

// A stalled connection would otherwise hang until Node's default socket
// timeout, surfacing as the same vague failure as a real outage.
const REQUEST_TIMEOUT_MS = 8000;

function endpointsForAttempt() {
  const now = Date.now();
  const available = OVERPASS_ENDPOINTS.filter(
    (endpoint) => (endpointCooldowns.get(endpoint) || 0) <= now
  );
  const candidates = available.length ? available : OVERPASS_ENDPOINTS;
  const start = nextEndpointIndex % candidates.length;
  nextEndpointIndex = (nextEndpointIndex + 1) % candidates.length;
  return candidates.slice(start).concat(candidates.slice(0, start));
}

async function queryOverpass(query, options = {}) {
  let lastErr;
  const endpoints = options.endpoints || endpointsForAttempt();
  const fetcher = options.fetcher || fetchIPv4;
  for (const endpoint of endpoints) {
    try {
      const res = await fetcher(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          Accept: "application/json",
          "User-Agent": USER_AGENT,
        },
        body: query,
        timeoutMs: REQUEST_TIMEOUT_MS,
      });
      if ([429, 502, 503, 504].includes(res.status)) {
        endpointCooldowns.set(endpoint, Date.now() + ENDPOINT_COOLDOWN_MS);
        lastErr = new OverpassApiError("Restaurant data is temporarily busy. Please try again shortly.", 503);
        console.warn(`[overpass] ${endpoint} returned ${res.status}, trying next mirror.`);
        continue; // try next mirror
      }
      if (!res.ok) {
        throw new OverpassApiError(`Overpass API error (${res.status}).`, 502);
      }
      let data;
      try {
        data = await res.json();
      } catch {
        throw new OverpassApiError("Overpass returned malformed JSON.", 502);
      }
      if (!data || !Array.isArray(data.elements)) {
        throw new OverpassApiError("Overpass returned an invalid response.", 502);
      }
      endpointCooldowns.delete(endpoint);
      return data;
    } catch (err) {
      // Log the REAL cause server-side (DNS failure, ECONNREFUSED, connect
      // timeout, proxy/allowlist rejection, malformed JSON, etc.) — the
      // message we throw onward to the client stays generic and safe, but
      // this line is what you want in your server logs when debugging.
      const cause = describeError(err);
      console.error(`[overpass] ${endpoint} failed: ${cause}`);
      endpointCooldowns.set(endpoint, Date.now() + ENDPOINT_COOLDOWN_MS);
      lastErr =
        err instanceof OverpassApiError
          ? err
          : new OverpassApiError("Restaurant data is temporarily unavailable. Please try again.", 503);
    }
  }
  throw lastErr || new OverpassApiError("Restaurant data is temporarily unavailable. Please try again.", 503);
}

/**
 * Real restaurants (and cafes/fast food/etc.) around a point, from OpenStreetMap.
 * Never returns mock/fake data — an empty array means Overpass genuinely
 * has nothing tagged nearby.
 */
async function nearbyRestaurants({ lat, lng, radiusMeters }) {
  const query = buildQuery({ lat, lng, radiusMeters });
  const data = await queryOverpass(query);
  const elements = data.elements || [];
  return elements.map(normalizeElement).filter(Boolean);
}

module.exports = { nearbyRestaurants, OverpassApiError, buildQuery, normalizeElement, queryOverpass };
