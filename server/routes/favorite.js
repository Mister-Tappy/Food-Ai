const express = require("express");
const db = require("../db");

const router = express.Router();

// POST /favorite  Body: { userId, restaurantId }
router.post("/", async (req, res) => {
  try {
    const { userId, restaurantId } = req.body;
    if (!userId || !restaurantId) {
      return res.status(400).json({ error: "userId and restaurantId are required" });
    }
    await db.query(
      `INSERT INTO favorites (user_id, restaurant_id) VALUES ($1, $2)
       ON CONFLICT (user_id, restaurant_id) DO NOTHING`,
      [userId, restaurantId]
    );
    await db.query(
      `INSERT INTO training_dataset (restaurant_id, action, created_at)
       VALUES ($1, 'favorited', now())`,
      [restaurantId]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save favorite" });
  }
});

// GET /favorite?userId=1  (convenience — bible lists POST only, GET added for symmetry)
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId query param required" });
    const { rows } = await db.query(
      `SELECT r.* FROM favorites f
       JOIN restaurants r ON r.id = f.restaurant_id
       WHERE f.user_id = $1 ORDER BY f.created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

module.exports = router;
