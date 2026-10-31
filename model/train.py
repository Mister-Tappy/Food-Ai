"""
Train the recommendation model.
Source spec: docs/PROJECT_BIBLE_V2.md § Machine Learning
  Dataset CSV -> Feature Engineering -> Train -> Validation -> Export model.pkl -> Backend Prediction

Usage:
    python train.py --data dataset.csv --out recommender.joblib
"""
import argparse
import json
from datetime import datetime, timezone

import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib

FEATURES_CATEGORICAL = ["food_type", "time"]
FEATURES_NUMERIC = ["budget", "distance_km"]
TARGET = "recommendation_score"


def build_pipeline():
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), FEATURES_CATEGORICAL),
        ],
        remainder="passthrough",
    )
    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=10,
        random_state=42,
        n_jobs=-1,
    )
    return Pipeline(steps=[("preprocess", preprocessor), ("model", model)])


def main(data_path: str, out_path: str, status_path: str):
    df = pd.read_csv(data_path)
    X = df[FEATURES_CATEGORICAL + FEATURES_NUMERIC]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    preds = pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    print(f"Validation MAE: {mae:.3f}")

    joblib.dump(pipeline, out_path)
    print(f"Model exported to {out_path}")

    status = {
        "trained": True,
        "lastTrainedAt": datetime.now(timezone.utc).isoformat(),
        "validationMae": round(float(mae), 2),
        "datasetRows": len(df),
    }
    with open(status_path, "w") as f:
        json.dump(status, f, indent=2)
    print(f"Status written to {status_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="dataset.csv")
    parser.add_argument("--out", default="recommender.joblib")
    parser.add_argument("--status-out", default="status.json")
    args = parser.parse_args()
    main(args.data, args.out, args.status_out)
