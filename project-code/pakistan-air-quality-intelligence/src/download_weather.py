import pandas as pd
import requests

from config import (
    END_DATE,
    LATITUDE,
    LONGITUDE,
    START_DATE,
    WEATHER_FILE,
    ensure_output_directories,
)


POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
POWER_PARAMETERS = {
    "T2M": "temperature_c",
    "RH2M": "relative_humidity_percent",
    "WS10M": "wind_speed_m_s",
    "PRECTOTCORR": "precipitation_mm",
}


def download_weather() -> pd.DataFrame:
    response = requests.get(
        POWER_URL,
        params={
            "parameters": ",".join(POWER_PARAMETERS),
            "community": "RE",
            "longitude": LONGITUDE,
            "latitude": LATITUDE,
            "start": START_DATE.replace("-", ""),
            "end": END_DATE.replace("-", ""),
            "format": "JSON",
        },
        timeout=90,
    )
    print(f"Status code: {response.status_code}")
    response.raise_for_status()

    parameter_data = response.json()["properties"]["parameter"]
    frame = pd.DataFrame(
        {
            output_name: pd.Series(parameter_data[power_name], dtype="float64")
            for power_name, output_name in POWER_PARAMETERS.items()
        }
    )
    frame.index.name = "date"
    frame = frame.reset_index()
    frame["date"] = pd.to_datetime(frame["date"], format="%Y%m%d")
    frame = frame.replace(-999, pd.NA).sort_values("date").reset_index(drop=True)
    return frame


def main() -> None:
    ensure_output_directories()
    frame = download_weather()
    frame.to_csv(WEATHER_FILE, index=False)

    weather_columns = list(POWER_PARAMETERS.values())
    print(f"Weather records downloaded: {len(frame)}")
    print(f"Missing weather values: {int(frame[weather_columns].isna().sum().sum())}")
    print(f"Saved to: {WEATHER_FILE}")


if __name__ == "__main__":
    main()

