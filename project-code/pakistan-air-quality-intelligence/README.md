# Pakistan Air Quality Intelligence

A reproducible machine-learning project for **next-day PM2.5 regression in Lahore, Pakistan**. The workflow combines daily air-quality observations from OpenAQ / StateAir Lahore with NASA POWER weather data, engineers time-aware features, and evaluates every model against a persistence baseline using chronological cross-validation.

[View the interactive case study](https://drhirabenish.github.io/projects/pakistan-air-quality-intelligence/)

## Project question

Given Lahore's recent PM2.5 behaviour and current weather, what change in PM2.5 concentration should be expected the next day?

The final model predicts the **next-day change** and adds that change to the current concentration. This formulation performed more consistently than predicting the raw next-day value directly.

## Verified result

| Metric | Result |
|---|---:|
| Model | HistGradientBoostingRegressor |
| Validation | 5-fold expanding chronological split |
| Average model MAE | 32.16 µg/m³ |
| Average persistence MAE | 34.48 µg/m³ |
| Average improvement | 6.54% |
| Folds beating persistence | 5 of 5 |
| Model-ready rows | 1,636 |
| Modelling period | 2019-05-30 to 2025-02-17 |

The score is evidence of a modest, repeatable improvement—not a guarantee for every day. Abrupt pollution spikes remain difficult.

## Data

- **Air quality:** OpenAQ v3, StateAir Lahore, location `8664`, PM2.5 sensor `25135`
- **Station coordinates:** 31.560078, 74.33589
- **Weather:** NASA POWER daily point API (`T2M`, `RH2M`, `WS10M`, `PRECTOTCORR`)
- **Calendar inspected:** 2019-05-23 to 2025-03-04, 2,113 days

The audit found 351 missing PM2.5 days after calendar alignment. Only complete gaps of three days or fewer were interpolated: 46 values were filled and 305 remained missing. Long gaps are excluded rather than silently invented.

Raw and processed CSV files are generated locally and excluded from Git because the source APIs remain the authoritative data providers.

## Features

- Current PM2.5 and lags at 1, 2, 3 and 7 days
- Three- and seven-day rolling means and seven-day variability
- Temperature, relative humidity, wind speed and precipitation
- One- and three-day pollution momentum
- Daily changes in temperature, humidity and wind
- Three-day precipitation total
- Sine and cosine representation of annual seasonality

## Repository structure

```text
.
├── data/
│   └── README.md
├── models/
│   └── README.md
├── reports/
│   ├── enhanced_model_cv_results.csv
│   └── project_metrics.json
├── src/
│   ├── build_features.py
│   ├── download_pm25.py
│   ├── download_weather.py
│   ├── predict_latest.py
│   └── train_model.py
├── .env.example
├── .gitignore
├── environment.yml
├── MODEL_CARD.md
└── requirements.txt
```

## Reproduce the workflow

Create and activate the Conda environment:

```bash
conda env create -f environment.yml
conda activate pakistan-air-quality
```

Copy `.env.example` to `.env`, add your OpenAQ API key, and never commit `.env`:

```text
OPENAQ_API_KEY=replace_with_your_key
```

Run the pipeline from the repository root:

```bash
python src/download_pm25.py
python src/download_weather.py
python src/build_features.py
python src/train_model.py
python src/predict_latest.py
```

The training script regenerates the cross-validation report and saves the fitted model bundle in `models/`.

## Responsible interpretation

This is a research and portfolio project, not a live public-health warning system. It uses one monitoring location, does not directly model traffic, industrial activity, dust or crop-burning events, and has no probabilistic prediction interval. See [MODEL_CARD.md](MODEL_CARD.md) for intended use, limitations and next steps.

## Author

**Dr. Hira Benish**  
Mathematician · Researcher · Educator

