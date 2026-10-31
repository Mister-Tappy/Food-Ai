// =========================================================
// PLACES ROUTES — real OpenStreetMap data (Overpass + Nominatim)
// GET  /places/nearby    Real restaurants around a point (Overpass)
// GET  /places/search    Address/landmark autocomplete (Nominatim)
// GET  /places/reverse   Reverse geocode a map click (Nominatim)
//
// No Google Maps API, no Places API, no API keys, no billing —
// everything here is free and keyless. Never returns mock/fake
// restaurants: an empty `results` array means Overpass genuinely has
// nothing tagged nearby.
// =========================================================
const express = require("express");
const { nearbyRestaurants, OverpassApiError } = require("../lib/overpassClient");
const { search: nominatimSearch, reverse: nominatimReverse, NominatimApiError } = require("../lib/nominatimClient");
const { generateRestaurantSummary } = require("../lib/restaurantSummary");
const { resolveOpenPhoto } = require("../lib/openPhotoClient");
const { TTLCache } = require("../lib/cache");

const router = express.Router();

// Requirement (Performance): cache Overpass 2 min, Nominatim 1 hour.
const nearbyCache = new TTLCache(2 * 60 * 1000);
const searchCache = new TTLCache(60 * 60 * 1000);
const reverseCache = new TTLCache(60 * 60 * 1000);
const photoCache = new TTLCache(24 * 60 * 60 * 1000);

function handleError(err, res) {
  if (err instanceof OverpassApiError || err instanceof NominatimApiError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Unexpected server error." });
}

// Round coordinates for cache-key stability without meaningfully changing the search area.
function roundCoord(n) {
  return Math.round(n * 1000) / 1000; // ~100m precision
}

// GET /places/nearby?lat=&lng=&radius=5000
router.get("/nearby", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radiusMeters = Math.min(Math.max(Number(req.query.radius) || 5000, 100), 20000);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ error: "lat and lng query params are required numbers." });
    }

    const cacheKey = `${roundCoord(lat)},${roundCoord(lng)}:${radiusMeters}`;
    const results = await nearbyCache.getOrLoad(cacheKey, () =>
      nearbyRestaurants({ lat, lng, radiusMeters })
    );

    // AI summary is cheap to derive and depends on the caller's own
    // distance/origin, so it's computed fresh per request rather than cached.
    const withSummaries = results.map((r) => ({ ...r, aiSummary: generateRestaurantSummary(r) }));

    res.json({ origin: { lat, lng }, radiusMeters, results: withSummaries, source: "openstreetmap" });
  } catch (err) {
    handleError(err, res);
  }
});

// GET /places/search?q=<text>
router.get("/search", async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q.length < 2 || q.length > 200) return res.status(400).json({ error: "q must contain 2–200 characters." });

    const cacheKey = q.toLowerCase();
    const results = await searchCache.getOrLoad(cacheKey, () => nominatimSearch(q));
    res.json({ query: q, results, source: "nominatim" });
  } catch (err) {
    handleError(err, res);
  }
});

// GET /places/reverse?lat=&lng=
router.get("/reverse", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ error: "lat and lng query params are required numbers." });
    }

    const cacheKey = `${roundCoord(lat)},${roundCoord(lng)}`;
    const result = await reverseCache.getOrLoad(cacheKey, () => nominatimReverse(lat, lng));
    res.json({ result, source: "nominatim" });
  } catch (err) {
    handleError(err, res);
  }
});

// GET /places/photo?website=&wikidataId=
// Resolves a real venue image from its exact Wikidata record or official site.
router.get("/photo", async (req, res) => {
  const website = typeof req.query.website === "string" ? req.query.website.trim() : "";
  const wikidataId =
    typeof req.query.wikidataId === "string" ? req.query.wikidataId.trim() : "";

  if (!website && !wikidataId) {
    return res.status(400).json({ error: "website or wikidataId is required." });
  }
  if (website.length > 2048 || (wikidataId && !/^Q\d+$/.test(wikidataId))) {
    return res.status(400).json({ error: "Invalid photo lookup parameters." });
  }

  const cacheKey = `${wikidataId}:${website}`;
  const photo = await photoCache.getOrLoad(cacheKey, () =>
    resolveOpenPhoto({ website, wikidataId })
  );
  return res.json({ photo });
});

module.exports = router;
