const test = require("node:test");
const assert = require("node:assert/strict");
const { buildQuery, normalizeElement, queryOverpass } = require("../lib/overpassClient");
const { isOpenNow } = require("../lib/openingHours");
const { TTLCache } = require("../lib/cache");

test("Overpass query uses validated coordinates and food selectors", () => {
  const query = buildQuery({ lat: 13.75, lng: 100.5, radiusMeters: 3000 });
  assert.match(query, /around:3000,13\.75,100\.5/);
  assert.match(query, /amenity=restaurant/);
});

test("normalizes a real OSM element without inventing a menu or rating", () => {
  const result = normalizeElement({ type: "node", id: 42, lat: 13.7, lon: 100.5, tags: { name: "Tagged venue", amenity: "restaurant", cuisine: "thai", takeaway: "yes" } });
  assert.equal(result.osmId, "node/42");
  assert.equal(result.name, "Tagged venue");
  assert.equal(result.foodType, "Thai");
  assert.equal(result.takeaway, true);
  assert.equal("rating" in result, false);
});

test("falls back to the next Overpass endpoint after a retryable response", async () => {
  const calls = [];
  const fetcher = async (url) => {
    calls.push(url);
    if (calls.length === 1) return { status: 503, ok: false, json: async () => ({}) };
    return { status: 200, ok: true, json: async () => ({ elements: [] }) };
  };
  const result = await queryOverpass("[out:json];", { endpoints: ["https://one.test", "https://two.test"], fetcher });
  assert.deepEqual(result, { elements: [] });
  assert.deepEqual(calls, ["https://one.test", "https://two.test"]);
});

test("TTL cache deduplicates concurrent identical loads", async () => {
  const cache = new TTLCache(1000);
  let calls = 0;
  const loader = async () => { calls += 1; return "value"; };
  const values = await Promise.all([cache.getOrLoad("same", loader), cache.getOrLoad("same", loader)]);
  assert.deepEqual(values, ["value", "value"]);
  assert.equal(calls, 1);
});

test("opening-hours parser returns unknown for unsupported syntax", () => {
  assert.equal(isOpenNow("sunrise-sunset"), null);
});
