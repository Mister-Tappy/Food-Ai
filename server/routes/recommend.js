const express = require("express");
const db = require("../db");
const { predictScore } = require("../models/recommendClient");

const router = express.Router();

// Workflow per docs/PROJECT_BIBLE_V2.md:
// User -> API -> AI Model -> Ranking -> Top 10 -> Weighted Random -> UI
function weightedShuffle(list) {
  const pool = [...list];
  const result = [];
  while (pool.length) {
    const totalWeight = pool.reduce((sum, r) => sum + r.score + 1, 0);
    let roll = Math.random() * totalWeight;
    let pickIndex = 0;
    for (let i = 0; i < pool.length; i++) {
      roll -= pool[i].score + 1;
      if (roll <= 0) {
        pickIndex = i;
        break;
      }
    }
    result.push(pool.splice(pickIndex, 1)[0]);
  }
  return result;
}

// POST /recommend
// Body: { foodType, budget, distanceKm, time, userId? }
router.post("/", async (req, res) => {
  try {
    const { foodType, budget, distanceKm, time, userId } = req.body;
    if (!foodType || !budget || !distanceKm || !time) {
      return res.status(400).json({ error: "foodType, budget, distanceKm, time are required" });
    }

    const { rows: restaurants } = await db.query("SELECT * FROM restaurants");

    // Pull recent history so the model can weigh "previous user history" / "favorite categories"
    let history = [];
    if (userId) {
      const h = await db.query(
        "SELECT restaurant_id FROM user_history WHERE user_id = $1 ORDER BY viewed_at DESC LIMIT 20",
        [userId]
      );
      history = h.rows.map((r) => r.restaurant_id);
    }

    const scored = await Promise.all(
      restaurants.map(async (r) => ({
        ...r,
        score: await predictScore({
          foodType,
          budget,
          distanceKm,
          time,
          restaurant: r,
          previouslyViewed: history.includes(r.id),
        }),
      }))
    );

    const top10 = scored.sort((a, b) => b.score - a.score).slice(0, 10);
    const ranked = weightedShuffle(top10);

    res.json(ranked);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Recommendation failed" });
  }
});

module.exports = router;
