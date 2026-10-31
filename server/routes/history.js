const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /history?userId=1
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId query param required" });

    const { rows } = await db.query(
      `SELECT restaurant_id AS "restaurantId", viewed_at AS "viewedAt"
       FROM user_history
       WHERE user_id = $1
       ORDER BY viewed_at DESC LIMIT 50`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

module.exports = router;
