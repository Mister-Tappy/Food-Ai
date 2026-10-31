const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /restaurants
router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM restaurants ORDER BY id");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});

// GET /restaurants/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query("SELECT * FROM restaurants WHERE id = $1", [id]);
    if (!rows.length) return res.status(404).json({ error: "Restaurant not found" });

    const menu = await db.query("SELECT * FROM menus WHERE restaurant_id = $1", [id]);
    res.json({ ...rows[0], menu: menu.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch restaurant" });
  }
});

module.exports = router;
