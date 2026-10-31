const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// POST /train
// Triggers a retraining run. If MODEL_URL is set, delegates to the
// deployed Python model service. Otherwise attempts to spawn
// model/train.py locally (useful in dev / single-host deployments).
// This kicks the job off asynchronously and returns immediately —
// poll GET /model/status for progress, per docs/PROJECT_BIBLE_V2.md.
router.post("/", async (req, res) => {
  try {
    if (process.env.MODEL_URL) {
      const resp = await fetch(`${process.env.MODEL_URL}/train`, { method: "POST" });
      if (!resp.ok) throw new Error(`Model service returned ${resp.status}`);
      return res.json({ started: true, mode: "remote" });
    }

    const modelDir = path.join(__dirname, "..", "..", "model");
    const dataPath = path.join(modelDir, "dataset.csv");
    if (!fs.existsSync(dataPath)) {
      return res.status(409).json({ started: false, error: "No exported training dataset is available." });
    }
    const pythonCommand = process.platform === "win32" ? "python" : "python3";
    const proc = spawn(pythonCommand, ["train.py", "--data", "dataset.csv", "--out", "recommender.joblib"], {
      cwd: modelDir,
      detached: true,
      stdio: "ignore",
    });
    proc.unref();

    res.json({ started: true, mode: "local-subprocess" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ started: false, error: "Failed to start training job" });
  }
});

module.exports = router;
