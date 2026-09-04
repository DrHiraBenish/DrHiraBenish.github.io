from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
MODELS_DIR = PROJECT_ROOT / "models"
REPORTS_DIR = PROJECT_ROOT / "reports"

OPENAQ_BASE_URL = "https://api.openaq.org/v3"
LOCATION_ID = 8664
SENSOR_ID = 25135
LATITUDE = 31.560078
LONGITUDE = 74.33589

START_DATE = "2019-05-23"
END_DATE = "2025-03-04"

PM25_FILE = DATA_DIR / "lahore_stateair_pm25_daily_2019_2025.csv"
WEATHER_FILE = DATA_DIR / "lahore_weather_nasa_power_2019_2025.csv"
MODEL_DATA_FILE = DATA_DIR / "lahore_pm25_enhanced_model_ready_2019_2025.csv"
MODEL_FILE = MODELS_DIR / "lahore_pm25_enhanced_change_model.joblib"
VALIDATION_FILE = REPORTS_DIR / "enhanced_model_cv_results.csv"


def ensure_output_directories() -> None:
    for folder in (DATA_DIR, MODELS_DIR, REPORTS_DIR):
        folder.mkdir(parents=True, exist_ok=True)

