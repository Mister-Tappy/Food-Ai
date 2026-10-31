// =========================================================
// MODEL CLIENT
// Bridges the API to the trained Random Forest model exported from
// /model (see docs/PROJECT_BIBLE_V2.md § Machine Learning). In
// production, model/serve.py runs as its own Python service — set
// MODEL_URL to that service's base URL. Falls back to a local
// heuristic so the API works before the model service is deployed.
// =========================================================

async function predictScore({ foodType, budget, distanceKm, time, restaurant, previouslyViewed }) {
  if (process.env.MODEL_URL) {
    const resp = await fetch(`${process.env.MODEL_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        food_type: foodType,
        budget,
        distance_km: distanceKm,
        time,
        restaurant_food_type: restaurant.food_type,
        restaurant_price_level: restaurant.price_level,
        previously_viewed: Boolean(previouslyViewed),
      }),
    });
    const data = await resp.json();
    return data.score;
  }

  // ---- Fallback heuristic (mirrors client/src/lib/recommend.ts) ----
  let score = 50;
  if (restaurant.food_type === foodType) score += 30;
  score += Math.max(0, 15 - Math.abs(restaurant.price_level - budget) * 8);
  if (previouslyViewed) score += 5; // mild affinity boost
  return Math.max(0, Math.min(100, Math.round(score)));
}

module.exports = { predictScore };
