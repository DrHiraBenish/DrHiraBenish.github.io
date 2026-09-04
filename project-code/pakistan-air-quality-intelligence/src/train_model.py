import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import TimeSeriesSplit

from build_features import ENHANCED_FEATURES
from config import (
    LOCATION_ID,
    MODEL_DATA_FILE,
    MODEL_FILE,
    SENSOR_ID,
    VALIDATION_FILE,
    ensure_output_directories,
)


MODEL_PARAMETERS = {
    "loss": "absolute_error",
    "learning_rate": 0.05,
    "max_iter": 300,
    "max_leaf_nodes": 15,
    "min_samples_leaf": 20,
    "l2_regularization": 1.0,
    "random_state": 42,
}


def new_model() -> HistGradientBoostingRegressor:
    return HistGradientBoostingRegressor(**MODEL_PARAMETERS)


def validate_model(frame: pd.DataFrame) -> pd.DataFrame:
    X = frame[ENHANCED_FEATURES]
    y_change = frame["next_day_change"]
    splitter = TimeSeriesSplit(n_splits=5)
    rows: list[dict] = []

    for fold, (train_index, test_index) in enumerate(splitter.split(X), start=1):
        model = new_model()
        model.fit(X.iloc[train_index], y_change.iloc[train_index])
        predicted_change = model.predict(X.iloc[test_index])
        actual_change = y_change.iloc[test_index]

        model_mae = mean_absolute_error(actual_change, predicted_change)
        baseline_mae = mean_absolute_error(actual_change, np.zeros(len(test_index)))
        improvement = (baseline_mae - model_mae) / baseline_mae * 100
        rows.append(
            {
                "fold": fold,
                "enhanced_mae": model_mae,
                "baseline_mae": baseline_mae,
                "improvement_percent": improvement,
            }
        )

    return pd.DataFrame(rows)


def main() -> None:
    ensure_output_directories()
    frame = pd.read_csv(MODEL_DATA_FILE, parse_dates=["date"]).sort_values("date")
    if frame.empty:
        raise ValueError("The model-ready dataset is empty")

    validation = validate_model(frame)
    validation.to_csv(VALIDATION_FILE, index=False, float_format="%.4f")

    final_model = new_model()
    final_model.fit(frame[ENHANCED_FEATURES], frame["next_day_change"])
    bundle = {
        "model": final_model,
        "features": ENHANCED_FEATURES,
        "prediction_type": "next_day_pm25_change",
        "location_id": LOCATION_ID,
        "sensor_id": SENSOR_ID,
        "training_rows": len(frame),
        "training_start": str(frame["date"].min().date()),
        "training_end": str(frame["date"].max().date()),
        "cross_validated_mae": round(validation["enhanced_mae"].mean(), 2),
        "baseline_mae": round(validation["baseline_mae"].mean(), 2),
    }
    joblib.dump(bundle, MODEL_FILE)

    print(validation.round(2).to_string(index=False))
    print(f"Average model MAE: {validation['enhanced_mae'].mean():.2f}")
    print(f"Average baseline MAE: {validation['baseline_mae'].mean():.2f}")
    print(f"Model saved to: {MODEL_FILE}")
    print(f"Validation report: {VALIDATION_FILE}")


if __name__ == "__main__":
    main()

