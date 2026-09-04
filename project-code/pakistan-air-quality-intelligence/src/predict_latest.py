from datetime import timedelta

import joblib
import pandas as pd

from config import MODEL_DATA_FILE, MODEL_FILE


def main() -> None:
    bundle = joblib.load(MODEL_FILE)
    frame = pd.read_csv(MODEL_DATA_FILE, parse_dates=["date"]).sort_values("date")
    latest = frame.iloc[-1]
    features = bundle["features"]

    predicted_change = float(
        bundle["model"].predict(latest[features].to_frame().T)[0]
    )
    current_pm25 = float(latest["pm25_clean"])
    predicted_pm25 = max(0.0, current_pm25 + predicted_change)
    prediction_date = latest["date"].date() + timedelta(days=1)

    print(f"Current date: {latest['date'].date()}")
    print(f"Prediction date: {prediction_date}")
    print(f"Current PM2.5: {current_pm25:.2f} µg/m³")
    print(f"Predicted change: {predicted_change:.2f} µg/m³")
    print(f"Predicted next-day PM2.5: {predicted_pm25:.2f} µg/m³")


if __name__ == "__main__":
    main()
