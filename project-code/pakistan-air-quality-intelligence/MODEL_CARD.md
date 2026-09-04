# Model card

## Model details

- **Task:** next-day PM2.5 regression for Lahore
- **Prediction target:** next-day PM2.5 change in µg/m³
- **Estimator:** `HistGradientBoostingRegressor`
- **Training rows:** 1,636
- **Training period:** 2019-05-30 to 2025-02-17
- **Validation:** five expanding chronological folds
- **Average model MAE:** 32.16 µg/m³
- **Persistence baseline MAE:** 34.48 µg/m³

## Intended use

The model is intended for educational analysis, reproducible experimentation and investigation of short-horizon air-quality forecasting. It can support research questions and prototype dashboards.

## Not intended for

- Clinical or personal-health decisions
- Official air-quality alerts
- Neighbourhood-level exposure estimates
- National forecasts for Pakistan
- Unsupervised real-time operation

## Data and preprocessing

The target comes from OpenAQ / StateAir Lahore location 8664, sensor 25135. Weather variables come from NASA POWER for the station coordinates. The daily calendar is explicitly reindexed. Only complete PM2.5 gaps of three days or fewer are linearly interpolated; longer gaps remain missing and are excluded from modelling.

## Evaluation

Random splitting is not used. Each validation fold trains on earlier dates and tests on later dates. The baseline predicts no next-day change, equivalent to tomorrow's PM2.5 equalling today's value.

| Fold | Model MAE | Baseline MAE | Improvement |
|---:|---:|---:|---:|
| 1 | 25.15 | 26.63 | 5.54% |
| 2 | 32.03 | 33.81 | 5.26% |
| 3 | 37.57 | 41.71 | 9.92% |
| 4 | 33.00 | 34.28 | 3.74% |
| 5 | 33.04 | 35.99 | 8.22% |

## Limitations

The model uses one monitoring station and contains periods of missing PM2.5 data. It lacks direct emissions, traffic, fire, crop-burning, dust-event, wind-direction and boundary-layer measurements. MAE measures typical absolute error but does not protect against rare severe errors. An example forecast for 18 February 2025 had an absolute error of 69.46 µg/m³, illustrating the difficulty of sudden spikes.

## Recommended improvements

Add multiple monitors, satellite aerosol data, richer meteorology, event indicators and a scheduled ingestion pipeline. Evaluate prediction intervals, spike-sensitive objectives and rolling retraining before considering operational use.

