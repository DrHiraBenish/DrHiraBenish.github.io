import os

import pandas as pd
import requests
from dotenv import load_dotenv

from config import (
    END_DATE,
    OPENAQ_BASE_URL,
    PM25_FILE,
    SENSOR_ID,
    START_DATE,
    ensure_output_directories,
)


def extract_record(item: dict) -> dict:
    period = item.get("period", {})
    datetime_from = period.get("datetimeFrom", {})
    timestamp = datetime_from.get("local") or datetime_from.get("utc")
    if not timestamp:
        raise ValueError("OpenAQ result is missing period.datetimeFrom")

    summary = item.get("summary", {})
    flag_info = item.get("flagInfo", {})
    return {
        "date": pd.to_datetime(timestamp).date().isoformat(),
        "pm25_ug_m3": item.get("value"),
        "percent_coverage": summary.get("percentCoverage"),
        "has_flags": flag_info.get("hasFlags", False),
    }


def download_daily_pm25(api_key: str) -> pd.DataFrame:
    url = f"{OPENAQ_BASE_URL}/sensors/{SENSOR_ID}/days"
    headers = {"X-API-Key": api_key}
    page = 1
    page_size = 1000
    records: list[dict] = []

    while True:
        response = requests.get(
            url,
            headers=headers,
            params={
                "date_from": START_DATE,
                "date_to": END_DATE,
                "limit": page_size,
                "page": page,
            },
            timeout=60,
        )
        print(f"Page {page}: status {response.status_code}")
        response.raise_for_status()
        results = response.json().get("results", [])
        records.extend(extract_record(item) for item in results)

        if len(results) < page_size:
            break
        page += 1

    if not records:
        raise RuntimeError("OpenAQ returned no daily PM2.5 records")

    frame = pd.DataFrame(records)
    frame["date"] = pd.to_datetime(frame["date"])
    frame = (
        frame.sort_values("date")
        .drop_duplicates(subset="date", keep="last")
        .reset_index(drop=True)
    )
    return frame


def main() -> None:
    load_dotenv()
    api_key = os.getenv("OPENAQ_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENAQ_API_KEY was not found. Copy .env.example to .env and add your key."
        )

    ensure_output_directories()
    frame = download_daily_pm25(api_key)
    frame.to_csv(PM25_FILE, index=False)

    print(f"Daily records downloaded: {len(frame)}")
    print(f"Missing PM2.5 values: {frame['pm25_ug_m3'].isna().sum()}")
    print(f"First date: {frame['date'].min().date()}")
    print(f"Last date: {frame['date'].max().date()}")
    print(f"Saved to: {PM25_FILE}")


if __name__ == "__main__":
    main()

