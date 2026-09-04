import numpy as np
import pandas as pd

from config import MODEL_DATA_FILE, PM25_FILE, WEATHER_FILE, ensure_output_directories


ENHANCED_FEATURES = [
    "pm25_clean",
    "pm25_lag_1",
    "pm25_lag_2",
    "pm25_lag_3",
    "pm25_lag_7",
    "pm25_mean_3d",
    "pm25_mean_7d",
    "pm25_std_7d",
    "pm25_change_1d",
    "pm25_change_3d",
    "temperature_c",
    "relative_humidity_percent",
    "wind_speed_m_s",
    "precipitation_mm",
    "temperature_change_1d",
    "humidity_change_1d",
    "wind_change_1d",
    "precipitation_3d",
    "annual_sin",
    "annual_cos",
]


def interpolate_complete_short_gaps(
    values: pd.Series,
    maximum_gap: int = 3,
) -> tuple[pd.Series, int]:
    missing = values.isna()
    groups = missing.ne(missing.shift()).cumsum()
    gap_sizes = missing.groupby(groups).transform("sum")
    eligible = missing & gap_sizes.le(maximum_gap)

    interpolated = values.interpolate(method="linear", limit_area="inside")
    cleaned = values.copy()
    fill_mask = eligible & interpolated.notna()
    cleaned.loc[fill_mask] = interpolated.loc[fill_mask]
    return cleaned, int(fill_mask.sum())


def build_dataset() -> tuple[pd.DataFrame, dict]:
    pm25 = pd.read_csv(PM25_FILE, parse_dates=["date"])
    weather = pd.read_csv(WEATHER_FILE, parse_dates=["date"])

    if pm25["date"].duplicated().any():
        raise ValueError("PM2.5 data contains duplicate dates")
    if weather["date"].duplicated().any():
        raise ValueError("Weather data contains duplicate dates")

    first_date = min(pm25["date"].min(), weather["date"].min())
    last_date = max(pm25["date"].max(), weather["date"].max())
    calendar = pd.DataFrame({"date": pd.date_range(first_date, last_date, freq="D")})
    frame = calendar.merge(pm25, how="left", on="date").merge(weather, how="left", on="date")

    frame["pm25_ug_m3"] = pd.to_numeric(frame["pm25_ug_m3"], errors="coerce")
    initial_missing = int(frame["pm25_ug_m3"].isna().sum())
    frame["pm25_clean"], filled_values = interpolate_complete_short_gaps(
        frame["pm25_ug_m3"], maximum_gap=3
    )

    pm = frame["pm25_clean"]
    for lag in (1, 2, 3, 7):
        frame[f"pm25_lag_{lag}"] = pm.shift(lag)

    frame["pm25_mean_3d"] = pm.rolling(3, min_periods=3).mean()
    frame["pm25_mean_7d"] = pm.rolling(7, min_periods=7).mean()
    frame["pm25_std_7d"] = pm.rolling(7, min_periods=7).std()
    frame["pm25_change_1d"] = pm.diff(1)
    frame["pm25_change_3d"] = pm.diff(3)
    frame["temperature_change_1d"] = frame["temperature_c"].diff(1)
    frame["humidity_change_1d"] = frame["relative_humidity_percent"].diff(1)
    frame["wind_change_1d"] = frame["wind_speed_m_s"].diff(1)
    frame["precipitation_3d"] = frame["precipitation_mm"].rolling(3, min_periods=3).sum()

    day_of_year = frame["date"].dt.dayofyear
    frame["annual_sin"] = np.sin(2 * np.pi * day_of_year / 365.25)
    frame["annual_cos"] = np.cos(2 * np.pi * day_of_year / 365.25)

    frame["next_day_pm25"] = pm.shift(-1)
    frame["next_day_change"] = frame["next_day_pm25"] - pm

    model_columns = ["date", *ENHANCED_FEATURES, "next_day_pm25", "next_day_change"]
    model_frame = (
        frame[model_columns]
        .dropna(subset=[*ENHANCED_FEATURES, "next_day_change"])
        .sort_values("date")
        .reset_index(drop=True)
    )

    audit = {
        "calendar_days": len(frame),
        "pm25_rows_received": len(pm25),
        "initial_missing_pm25_days": initial_missing,
        "interpolated_values": filled_values,
        "remaining_missing_pm25_days": int(frame["pm25_clean"].isna().sum()),
        "cleaned_pm25_values": int(frame["pm25_clean"].notna().sum()),
        "model_rows": len(model_frame),
    }
    return model_frame, audit


def main() -> None:
    ensure_output_directories()
    model_frame, audit = build_dataset()
    model_frame.to_csv(MODEL_DATA_FILE, index=False)

    for label, value in audit.items():
        print(f"{label.replace('_', ' ').title()}: {value}")
    print(f"Modelling period: {model_frame['date'].min().date()} to {model_frame['date'].max().date()}")
    print(f"Saved to: {MODEL_DATA_FILE}")


if __name__ == "__main__":
    main()

