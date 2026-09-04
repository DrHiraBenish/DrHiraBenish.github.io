"""Export compact historical model replays for the portfolio dashboard."""

from __future__ import annotations

import argparse
import json
from datetime import timedelta
from pathlib import Path

import joblib
import pandas as pd

from config import MODEL_DATA_FILE, MODEL_FILE


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate date-indexed predictions for the static dashboard."
    )
    parser.add_argument("--data", type=Path, default=MODEL_DATA_FILE)
    parser.add_argument("--model", type=Path, default=MODEL_FILE)
    parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args()


def rounded(value: float) -> float:
    return round(float(value), 2)


def main() -> None:
    args = parse_args()
    bundle = joblib.load(args.model)
    frame = pd.read_csv(args.data, parse_dates=["date"]).sort_values("date")
    features = list(bundle["features"])

    missing_columns = sorted(set(features) - set(frame.columns))
    if missing_columns:
        raise ValueError(f"Missing model features: {', '.join(missing_columns)}")

    predicted_changes = bundle["model"].predict(frame[features])
    records: dict[str, dict[str, float | str]] = {}

    for (_, row), predicted_change in zip(frame.iterrows(), predicted_changes):
        current_pm25 = float(row["pm25_clean"])
        predicted_pm25 = max(0.0, current_pm25 + float(predicted_change))
        actual_pm25 = float(row["target_pm25_next_day"])
        observation_date = row["date"].date()

        records[observation_date.isoformat()] = {
            "forecastDate": (observation_date + timedelta(days=1)).isoformat(),
            "current": rounded(current_pm25),
            "predicted": rounded(predicted_pm25),
            "change": rounded(predicted_change),
            "actual": rounded(actual_pm25),
            "error": rounded(abs(predicted_pm25 - actual_pm25)),
        }

    output = {
        "model": {
            "name": type(bundle["model"]).__name__,
            "predictionType": bundle["prediction_type"],
            "trainingRows": int(bundle["training_rows"]),
            "trainingStart": bundle["training_start"],
            "trainingEnd": bundle["training_end"],
            "crossValidatedMae": float(bundle["cross_validated_mae"]),
            "baselineMae": float(bundle["baseline_mae"]),
        },
        "records": records,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(output, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Dashboard records exported: {len(records)}")
    print(f"First observation date: {next(iter(records))}")
    print(f"Last observation date: {next(reversed(records))}")
    print(f"Saved to: {args.output}")


if __name__ == "__main__":
    main()
