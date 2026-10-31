const express = require("express");
const fs = require("fs");
const path = require("path");
const db = require("../db");

const router = express.Router();

// GET /model/status
// If MODEL_URL is set, proxies to the Python service's own status
// endpoint. Otherwise reads model/status.json, written by train.py
// after each run (see model/train.py's --status-out flag).
router.get("/", async (req, res) => {
  try {
    if (process.env.MODEL_URL) {
      const resp = await fetch(`${process.env.MODEL_URL}/status`);
      if (resp.ok) return res.json(await resp.json());
    }

    const statusPath = path.join(__dirname, "..", "..", "model", "status.json");
    let fileStatus = { trained: false, lastTrainedAt: null, validationMae: null };
    if (fs.existsSync(statusPath)) {
      fileStatus = JSON.parse(fs.readFileSync(statusPath, "utf-8"));
    }

    let datasetRows = fileStatus.datasetRows ?? 0;
    if (db.configured) {
      const { rows } = await db.query("SELECT COUNT(*)::int AS count FROM training_dataset");
      datasetRows = rows[0]?.count ?? datasetRows;
    }
    res.json({ ...fileStatus, datasetRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch model status" });
  }
});

module.exports = router;
