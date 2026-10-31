const express = require("express");
const db = require("../db");

const router = express.Router();

const VALID_ACTIONS = ["selected", "ignored", "favorited", "rated"];

// POST /feedback
// Body: { userId?, restaurantId, action, rating?, timestamp }
// Per docs/PROJECT_BIBLE_V2.md § Learning From User:
// every recommendation stores selected/ignored/favorite/rating/timestamp,
// feeding nightly retraining via the training_dataset table.
router.post("/", async (req, res) => {
  try {
    const { userId, restaurantId, action, rating, timestamp } = req.body;
    if (!restaurantId || !VALID_ACTIONS.includes(action)) {
      return res.status(400).json({ error: "restaurantId and a valid action are required" });
    }

    await db.query(
      `INSERT INTO training_dataset (user_id, restaurant_id, action, rating, created_at)
       VALUES ($1, $2, $3, $4, COALESCE($5, now()))`,
      [userId ?? null, restaurantId, action, rating ?? null, timestamp ?? null]
    );

    if (action === "selected" && userId) {
      await db.query(
        "INSERT INTO user_history (user_id, restaurant_id) VALUES ($1, $2)",
        [userId, restaurantId]
      );
    }

    if (action === "rated" && rating) {
      await db.query(
        `INSERT INTO ratings (user_id, restaurant_id, rating, created_at)
         VALUES ($1, $2, $3, now())`,
        [userId ?? null, restaurantId, rating]
      );
    }

    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to record feedback" });
  }
});

module.exports = router;
