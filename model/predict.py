"""
Load the exported model and produce a recommendation score.
Used by server/models/recommendClient.js via the FastAPI service below,
or directly via CLI for testing.
"""
import argparse
import pandas as pd
import joblib

_model = None


def load_model(path="recommender.joblib"):
    global _model
    if _model is None:
        _model = joblib.load(path)
    return _model


def predict(food_type: str, time: str, budget: int, distance_km: float, model_path="recommender.joblib") -> float:
    model = load_model(model_path)
    row = pd.DataFrame([{
        "food_type": food_type,
        "time": time,
        "budget": budget,
        "distance_km": distance_km,
    }])
    score = model.predict(row)[0]
    return round(float(max(0, min(100, score))), 1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--food_type", required=True)
    parser.add_argument("--time", required=True)
    parser.add_argument("--budget", type=int, required=True)
    parser.add_argument("--distance_km", type=float, required=True)
    parser.add_argument("--model", default="recommender.joblib")
    args = parser.parse_args()

    result = predict(args.food_type, args.time, args.budget, args.distance_km, args.model)
    print(f"Recommendation score: {result}")
