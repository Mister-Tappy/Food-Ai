// =========================================================
// SERVER ENTRYPOINT — V2
// Deploy target: Render (see docs/PROJECT_BIBLE_V2.md § Deployment)
// =========================================================
const express = require("express");
const cors = require("cors");

const restaurantsRouter = require("./routes/restaurants");
const placesRouter = require("./routes/places");
const recommendRouter = require("./routes/recommend");
const favoriteRouter = require("./routes/favorite");
const historyRouter = require("./routes/history");
const feedbackRouter = require("./routes/feedback");
const trainRouter = require("./routes/train");
const modelStatusRouter = require("./routes/modelStatus");

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  },
}));
app.use(express.json({ limit: "100kb" }));

// Routes — mirrors docs/PROJECT_BIBLE_V2.md § API
app.use("/restaurants", restaurantsRouter); // GET /restaurants, GET /restaurants/:id
app.use("/places", placesRouter);           // GET /places/nearby, /places/search, /places/reverse (live OpenStreetMap data — free, no API key)
app.use("/recommend", recommendRouter);     // POST /recommend
app.use("/favorite", favoriteRouter);       // POST /favorite
app.use("/history", historyRouter);         // GET /history
app.use("/feedback", feedbackRouter);       // POST /feedback
app.use("/train", trainRouter);             // POST /train
app.use("/model/status", modelStatusRouter);// GET /model/status

app.get("/health", (req, res) => res.json({ status: "ok", services: { places: "openstreetmap", geocoding: "nominatim" } }));

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
