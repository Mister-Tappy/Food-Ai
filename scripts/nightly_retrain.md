# Nightly Retraining

Per `docs/PROJECT_BIBLE_V2.md` § Learning From User: every recommendation
interaction (selected, ignored, favorited, rated) is logged to the
`training_dataset` table via `POST /feedback`. A nightly job turns that
into a fresh `dataset.csv` and retrains the model.

## Recommended setup (Render Cron Job)

1. Create a Render **Cron Job** service pointing at this repo, `rootDir: scripts`.
2. Schedule: `0 3 * * *` (3 AM daily).
3. Command: `python nightly_retrain.py`

## What `nightly_retrain.py` should do

1. Query `training_dataset` (+ `restaurants`) via `DATABASE_URL`.
2. Join feedback actions into labeled rows shaped like
   `model/generate_sample_dataset.py`'s output (food_type, time, budget,
   distance_km, recommendation_score) — derive `recommendation_score` from
   the action (e.g. selected/favorited/rated-high → high score, ignored →
   low score).
3. Write `model/dataset.csv`.
4. Call `POST {MODEL_URL}/train` (or run `model/train.py` directly if
   co-located).
5. Model service writes `model/status.json`, which `GET /model/status`
   already reads.

This script is intentionally not included yet — it needs a real
`DATABASE_URL` and enough accumulated feedback rows to be worth running.
The manual "Retrain model now" button on `/admin/training` exercises the
same `POST /train` path so the pipeline can be tested today with the
synthetic dataset.
