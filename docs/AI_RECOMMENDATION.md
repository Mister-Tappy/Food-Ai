# How the AI recommendation works

Foodie AI uses explainable weighted scoring. It does not call a paid LLM and does not label random numbers as confidence.

```text
Input
  ↓
Candidate meals
  ↓
Dietary/exclusion filtering
  ↓
Feature scoring
  ↓
Weighted score
  ↓
Recency and diversity adjustment
  ↓
Deterministic ranking
  ↓
Meal recommendation
  ↓
Real OSM restaurant discovery and evidence matching
  ↓
Feedback/history
  ↓
Future personalization
```

## Input

The meal scorer accepts optional category, tastes, cuisine, maximum typical meal budget, dietary restrictions, and exclusions. Long-term profile preferences, liked/disliked meals, and completed-meal history provide personalization signals.

## Candidate meals and filtering

Candidates come from `client/src/data/meals.ts`. They are internal food concepts—not restaurants. Explicit dietary restrictions and text exclusions are hard filters where meal metadata is known.

## Feature scoring

`client/src/lib/mealRecommend.ts` computes five visible components:

- Preference: selected category and cuisine
- Taste: overlap with selected taste descriptors
- Budget: whether the internal typical meal range can fit the selected maximum
- Affinity: liked meals and profile preferences
- Novelty: recency and diversity adjustment

The sum is clamped to 0–100. The result includes grounded reasons and a score breakdown. “Try another” excludes the current meal whenever another allowed candidate exists.

## Real restaurant matching

After the meal decision, the API requests real nearby food venues from Overpass. `client/src/lib/recommend.ts` progressively evaluates available evidence:

1. Meal keyword in OSM venue name or cuisine tags
2. Compatible cuisine tag
3. Compatible venue/category tag
4. Nearby venue with insufficient cuisine tags

Every card discloses the evidence level. Even a strong tag match does not claim that OSM confirms the current menu.

Restaurant scoring can use distance, parseable opening state, explicit facility tags, favorites, viewed history, and meal evidence. Estimated OSM price buckets are not displayed and do not affect the score.

## Personalization feedback loop

Completed meals, likes, dislikes, favorites, and profile preferences persist on the current device. Future meal ranking uses these signals for affinity and variety. A trained model can later augment this scorer, but the deterministic engine remains independently functional and auditable.
