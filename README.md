# Foodie AI / WanNeeKin A RaiDee

Foodie AI answers **“วันนี้กินอะไรดี?”** in two truthful stages:

1. An explainable, device-local recommendation engine selects a suitable meal.
2. The app searches live OpenStreetMap data for real nearby restaurants compatible with that meal.

It is not a generic restaurant directory. Internal meal knowledge is curated application data; every displayed venue name and coordinate comes from OpenStreetMap/Overpass.

## Features

- Optional food type, taste, cuisine, budget, dietary, distance, and facility preferences
- Deterministic meal scoring with a 0–100 computed match and score breakdown
- Thai-focused meal dataset plus Japanese, Korean, Chinese, cafe, dessert, vegetarian, halal, and fast-food choices
- “Try another” diversity handling and like/dislike personalization
- Browser geolocation, debounced address search, map-point selection, and recent locations
- Resilient multi-endpoint Overpass provider with timeout, fallback, retryable-status handling, cooldowns, caching, and concurrent-request deduplication
- Throttled and cached Nominatim geocoding
- Progressive meal-to-restaurant matching: keyword → cuisine → category → nearby compatible venue
- Leaflet map, OpenStreetMap tiles, marker clustering, fit bounds, card/marker selection, light/dark tiles, and external navigation
- Persisted restaurant favorites with snapshots
- Completed-meal history and monthly food diary
- Stickers, daily missions, coins, cosmetic rewards, and themes
- Local group compromise recommendations
- Thai/English food intent parser using the same meal recommendation engine
- Editable personalization profile
- Truthful admin dataset, activity statistics, and optional model status

## Truthful data rules

- Restaurant names, coordinates, and venue attributes originate from live OSM/Overpass responses.
- A failed live search shows an error; it never substitutes mock venues.
- OSM does not confirm menus, reviews, ratings, or typical dish prices. The UI does not claim that it does.
- Meal price ranges are labeled as internal typical estimates and are not restaurant prices.
- Restaurant photos appear only when linked by OSM/Wikimedia or resolved from an official venue website. Otherwise the card says that its category artwork is not a venue photograph.
- A cuisine/category restaurant match does not claim the selected dish is on the current menu.

## Tech stack

- Client: React 18, TypeScript, Vite, React Router, Zustand, Tailwind CSS, Framer Motion
- Map: Leaflet, React Leaflet, Leaflet MarkerCluster, OpenStreetMap tiles
- API: Node.js, Express
- Place data: Overpass API and Nominatim
- Optional persistence/training infrastructure: PostgreSQL and Python/scikit-learn
- Tests: Vitest and Node’s built-in test runner

No Google Maps API key, Places API key, billing account, or paid LLM is required.

## Architecture

```text
Meal preferences + profile + history
                ↓
Deterministic meal scorer (client)
                ↓
Selected internal meal definition
                ↓
Location → Express API → Overpass mirrors
                ↓
Real OSM restaurant records
                ↓
Progressive evidence matching + restaurant scorer
                ↓
Leaflet map + ranked cards + restaurant detail
                ↓
Completed meal → history, diary, sticker, mission progress
```

Important modules:

- `client/src/data/meals.ts` — internal meal knowledge
- `client/src/lib/mealRecommend.ts` — explainable meal scorer
- `client/src/lib/recommend.ts` — real restaurant ranking and match disclosures
- `client/src/lib/preferenceParser.ts` — Thai/English local intent parser
- `client/src/lib/gamification.ts` — missions, stickers, rewards
- `client/src/store/useAppStore.ts` — application state and safe local migrations/defaults
- `server/lib/overpassClient.js` — resilient live restaurant provider
- `server/lib/nominatimClient.js` — throttled geocoder

See [docs/AI_RECOMMENDATION.md](docs/AI_RECOMMENDATION.md) for the scoring and personalization design.

## Quick start

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run install:all
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- Health: http://localhost:4000/health

Separate development commands still work:

```bash
npm run dev --prefix server
npm run dev --prefix client
```

## Environment variables

Create `client/.env` from `client/.env.example`:

```env
VITE_API_URL=http://localhost:4000
```

Server variables are documented in `server/.env.example`:

- `PORT` — defaults to `4000`
- `OVERPASS_URL` or comma-separated `OVERPASS_URLS` — optional self-hosted/provider overrides
- `OVERPASS_USER_AGENT` — identifying contact string for responsible public-provider use
- `NOMINATIM_URL` — optional self-hosted geocoder
- `NOMINATIM_USER_AGENT` — identifying contact string required for responsible public-provider use
- `CORS_ORIGINS` — comma-separated allowed frontend origins
- `DATABASE_URL` — optional PostgreSQL connection for legacy feedback/model tooling
- `MODEL_URL` — optional deployed Python model service

The core recommendation, map, real restaurant search, history, personalization, and rewards work without PostgreSQL or the Python model.

## Build and test

```bash
npm run build
npm test
npm run check
```

Or separately:

```bash
npm run lint --prefix client
npm test --prefix client
npm test --prefix server
```

## Optional Python model

The deterministic scorer is always available. The optional experimental model can be trained only after a real `model/dataset.csv` has been exported:

```bash
cd model
pip install -r requirements.txt
python train.py --data dataset.csv --out recommender.joblib
uvicorn serve:app --reload --port 8000
```

The training endpoint refuses to report a job as started when no dataset exists. Synthetic sample generation is a developer pipeline exercise and is not presented as real user training data.

## Privacy and persistence

The no-login prototype keeps preferences, favorite snapshots, completed meals, diary entries, stickers, missions, coins, rewards, and personalization on the user’s device. Location is sent to the configured backend only to query nearby OpenStreetMap records. No camera, biometric mood detection, paid LLM, or advertising tracker is used.

## Limitations

- Public Overpass and Nominatim services can be busy despite fallback, caching, and throttling. Production traffic should use responsibly operated or self-hosted instances.
- OSM tag completeness varies. Opening hours, cuisine, facilities, address, phone, website, and imagery can be unknown.
- Exact menu availability and restaurant prices require a separate trustworthy menu provider; this app does not invent them.
- Local prototype progress does not sync across devices or browsers.
- The lightweight opening-hours parser intentionally returns “unknown” for unsupported OSM syntax rather than guessing.

## Data sources and attribution

- Restaurant and map data: OpenStreetMap contributors
- Restaurant lookup: Overpass API
- Geocoding: Nominatim
- Venue images when available: OSM-linked files, Wikimedia Commons, or official venue websites with visible source labels
