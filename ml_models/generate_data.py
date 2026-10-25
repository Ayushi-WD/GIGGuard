"""Generate correlated, explicitly simulated profiles and noisy rule labels."""

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

from ml_models.features import FEATURES, SEASONS, SEED, TARGET

DEFAULT_DATA = Path(__file__).resolve().parent / "data" / "synthetic_profiles.csv"


def generate_dataset(n_samples=20000, seed=SEED, missing_rate=0.02):
    if type(n_samples) is not int or n_samples < 10:
        raise ValueError("n_samples must be an integer of at least 10")
    if not 0 <= missing_rate <= 0.2:
        raise ValueError("missing_rate must be between 0 and 0.2")
    rng = np.random.default_rng(seed)
    season = rng.choice(SEASONS, n_samples, p=[0.25, 0.25, 0.30, 0.20])
    rain = np.clip(rng.beta(2, 2, n_samples) * 100, 0, 100)
    heat = rng.beta(2, 2, n_samples) * 100
    flood = np.clip(0.6 * rain + rng.normal(10, 15, n_samples), 0, 100)
    forecast = np.clip(0.5 * rain + 30 * (season == "monsoon")
                       + 15 * (season == "summer") + rng.normal(10, 15, n_samples), 0, 100)
    density = np.clip(rng.lognormal(np.log(9000), 0.65, n_samples), 500, 40000)
    volatility = rng.beta(2, 5, n_samples)
    experience = np.clip(rng.exponential(450, n_samples), 0, 3650).astype(int)
    income = np.round(np.clip(450 + 0.12 * np.minimum(experience, 1500)
                             + 0.008 * density + rng.normal(0, 130, n_samples), 200, 2000), 2)
    claims = np.clip(0.02 + 0.0012 * rain + 0.001 * flood
                     + 0.08 * volatility + rng.normal(0, 0.025, n_samples), 0, 0.5)
    aqi = np.clip(40 + 0.004 * density + 70 * (season == "winter")
                  - 30 * (season == "monsoon") + rng.normal(0, 35, n_samples), 0, 500)
    festival = rng.binomial(1, np.where(season == "post_monsoon", 0.45, 0.12))
    season_score = pd.Series(season).map(
        {"winter": 0.35, "summer": 0.65, "monsoon": 1.0, "post_monsoon": 0.45}
    ).to_numpy()
    # Explicit arbitrary prototype weights, not actuarially estimated coefficients.
    score = (
        12 * rain / 100 + 8 * heat / 100 + 12 * flood / 100
        + 18 * forecast / 100 + 5 * season_score + 5 * (density - 500) / 39500
        + 8 * volatility + 5 * np.exp(-experience / 180)
        + 3 * (income - 200) / 1800 + 12 * claims / 0.5
        + 8 * aqi / 500 + 4 * festival
        + 6 * (rain / 100) * (flood / 100)
        + 4 * (heat / 100) * (aqi / 500)
        + rng.normal(0, 3, n_samples)
    )
    data = pd.DataFrame({
        "historical_rain_risk": rain, "historical_heat_risk": heat,
        "historical_flood_risk": flood, "weather_forecast_risk": forecast,
        "location_density": density, "platform_volatility": volatility,
        "experience_days": experience, "average_daily_income": income,
        "historical_claim_rate": claims, "current_aqi": aqi,
        "festival_season": festival, "season_factor": season,
    }, columns=FEATURES)
    # Labels are based on complete simulated observations, then some observations
    # are hidden to exercise train-only imputation. Target is never an input.
    nullable = [name for name in FEATURES
                if name not in ("experience_days", "average_daily_income", "festival_season")]
    for name in nullable:
        data.loc[rng.random(n_samples) < missing_rate, name] = np.nan
    data[TARGET] = np.round(np.clip(score, 0, 100), 4)
    return data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rows", type=int, default=20000)
    parser.add_argument("--seed", type=int, default=SEED)
    parser.add_argument("--output", type=Path, default=DEFAULT_DATA)
    args = parser.parse_args()
    data = generate_dataset(args.rows, args.seed)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    data.to_csv(args.output, index=False)
    print(f"Saved {len(data)} synthetic profiles to {args.output}")


if __name__ == "__main__":
    main()
