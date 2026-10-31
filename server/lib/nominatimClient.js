// =========================================================
// NOMINATIM CLIENT
// Free, keyless geocoding/autocomplete against OpenStreetMap data.
// Replaces the Google Places Autocomplete usage in the old
// LocationSelector — supports searching provinces, districts,
// universities, malls, hospitals, landmarks, and street addresses.
//
// Nominatim's usage policy (https://operations.osmfoundation.org/policies/nominatim/)
// requires a descriptive User-Agent and at most ~1 request/second —
// we set the header below and rely on the route-level TTL cache to
// keep real request volume low.
// =========================================================

const NOMINATIM_BASE = process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org";
const USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ||
  "EatPick/3.0 (local development; configure NOMINATIM_USER_AGENT for production)";
const { fetchIPv4, describeError } = require("./httpClient");

class NominatimApiError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "NominatimApiError";
    this.status = status;
  }
}

const REQUEST_TIMEOUT_MS = 12000;
const MIN_REQUEST_INTERVAL_MS = 1100;
let lastRequestAt = 0;
let requestQueue = Promise.resolve();

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function throttle(loader) {
  const queued = requestQueue.then(async () => {
    const delay = Math.max(0, MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt));
    if (delay) await wait(delay);
    lastRequestAt = Date.now();
    return loader();
  });
  requestQueue = queued.catch(() => {});
  return queued;
}

async function request(path) {
  const url = `${NOMINATIM_BASE}${path}`;
  return throttle(async () => {
    let res;
    try {
      res = await fetchIPv4(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      timeoutMs: REQUEST_TIMEOUT_MS,
      });
    } catch (err) {
    // Log the real cause (DNS failure, ECONNREFUSED, connect timeout,
    // proxy/allowlist rejection, etc.) server-side; keep the client-facing
    // message generic.
    const cause = describeError(err);
    console.error(`[nominatim] ${url} failed: ${cause}`);
      throw new NominatimApiError("Location search is temporarily unavailable.", 502);
    }
    if (!res.ok) {
      console.error(`[nominatim] ${url} returned ${res.status}`);
      throw new NominatimApiError(`Nominatim API error (${res.status}).`, 502);
    }
    try {
      return await res.json();
    } catch {
      throw new NominatimApiError("Nominatim returned malformed data.", 502);
    }
  });
}

function toSuggestion(place) {
  return {
    label: place.display_name,
    lat: Number(place.lat),
    lng: Number(place.lon),
    type: place.type || place.class || "place",
    osmId: place.osm_type && place.osm_id ? `${place.osm_type}/${place.osm_id}` : null,
  };
}

/**
 * Free-text search — powers the manual-location autocomplete input
 * (province, district, university, mall, hospital, landmark, address).
 */
async function search(query, { limit = 8, viewbox, countrycodes } = {}) {
  const params = new URLSearchParams({
    format: "jsonv2",
    q: query,
    addressdetails: "1",
    limit: String(limit),
  });
  if (viewbox) params.set("viewbox", viewbox);
  if (countrycodes) params.set("countrycodes", countrycodes);

  const data = await request(`/search?${params.toString()}`);
  return (data || []).map(toSuggestion);
}

/** Reverse geocode — used to label a point the user clicked on the map. */
async function reverse(lat, lng) {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(lat),
    lon: String(lng),
    zoom: "18",
    addressdetails: "1",
  });
  const data = await request(`/reverse?${params.toString()}`);
  if (!data || data.error) return null;
  return toSuggestion(data);
}

module.exports = { search, reverse, NominatimApiError };
