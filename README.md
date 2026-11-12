# Foodie AI / WanNeeKin A RaiDee

Foodie AI answers **“วันนี้กินอะไรดี?”** in two truthful stages:

1. An explainable, device-local recommendation engine selects a suitable meal.
2. The browser searches live OpenStreetMap data for real nearby restaurants compatible with that meal.

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
- Place data: Overpass API and Nominatim
- Tests: Vitest and Node’s built-in test runner

No backend, database, Google Maps API key, billing account, or paid LLM is required.

## Architecture

```text
Meal preferences + profile + history
                ↓
Deterministic meal scorer (client)
                ↓
Selected internal meal definition
                ↓
Location → browser → Overpass mirrors
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
- `client/src/lib/osmPlaces.ts` — direct, throttled OSM/Nominatim provider

See [docs/AI_RECOMMENDATION.md](docs/AI_RECOMMENDATION.md) for the scoring and personalization design.

## Quick start

Requirements: Node.js 18+ and npm. The app is a static site; no server process is needed.

```bash
npm install
npm run install:all
npm run dev
```

- Frontend: http://localhost:5173
GitHub Pages is configured in [deploy-pages.yml](.github/workflows/deploy-pages.yml). Push to `main`, then select **GitHub Actions** as the Pages source in repository Settings → Pages. Routes use `#` URLs, so direct links and refreshes work on GitHub Pages without server-side rewrites.

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

## Privacy and persistence

The no-login prototype keeps preferences, favorite snapshots, completed meals, diary entries, stickers, missions, coins, rewards, and personalization on the user’s device. Location is sent directly from the browser to public OpenStreetMap services only to query nearby records. No camera, biometric mood detection, paid LLM, advertising tracker, or backend is used.

## Limitations

- Public Overpass and Nominatim services can be busy despite fallback, caching, and throttling. When all Overpass mirrors are unavailable, the static app falls back to Nominatim’s bounded real-venue search; browser access still depends on provider availability and CORS policy.
- OSM tag completeness varies. Opening hours, cuisine, facilities, address, phone, website, and imagery can be unknown.
- Exact menu availability and restaurant prices require a separate trustworthy menu provider; this app does not invent them.
- Local prototype progress does not sync across devices or browsers.
- The lightweight opening-hours parser intentionally returns “unknown” for unsupported OSM syntax rather than guessing.

## Data sources and attribution

- Restaurant and map data: OpenStreetMap contributors
- Restaurant lookup: Overpass API
- Geocoding: Nominatim
- Venue images when available: OSM-linked files or Wikimedia Commons/Wikidata with visible source labels
