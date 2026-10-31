"""
FastAPI wrapper exposing the model over HTTP so the Node/Express API
can call it via MODEL_URL (see docs/PROJECT_BIBLE_V2.md § Deployment).

Run locally:
    uvicorn serve:app --reload --port 8000
"""
import json
import subprocess
import sys
from pathlib import Path

from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from predict import predict

app = FastAPI(title="Foodie AI - Recommendation Model")

STATUS_PATH = Path(__file__).parent / "status.json"


class PredictRequest(BaseModel):
    food_type: str
    time: str
    budget: int
    distance_km: float
    restaurant_food_type: str | None = None
    restaurant_price_level: int | None = None
    previously_viewed: bool = False


@app.post("/predict")
def get_prediction(req: PredictRequest):
    score = predict(req.food_type, req.time, req.budget, req.distance_km)
    if req.previously_viewed:
        score = min(100, score + 5)
    return {"score": score}


def _run_training():
    subprocess.run(
        [sys.executable, "train.py", "--data", "dataset.csv", "--out", "recommender.joblib"],
        cwd=Path(__file__).parent,
        check=False,
    )


@app.post("/train")
def trigger_train(background_tasks: BackgroundTasks):
    background_tasks.add_task(_run_training)
    return {"started": True, "mode": "background-task"}


@app.get("/status")
def get_status():
    if STATUS_PATH.exists():
        return json.loads(STATUS_PATH.read_text())
    return {"trained": False, "lastTrainedAt": None, "validationMae": None, "datasetRows": 0}


@app.get("/health")
def health():
    return {"status": "ok"}
