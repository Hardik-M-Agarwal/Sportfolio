"""
Registration Forecaster Dataset Generator
Generates 50,000 synthetic tournament registration records
Formula used ONLY here — never at prediction time
"""

import numpy as np
import pandas as pd
import random
import os

random.seed(42)
np.random.seed(42)

SPORTS = ['cricket', 'football', 'badminton', 'kabaddi', 'basketball', 'volleyball']
FORMATS = ['knockout', 'league', 'league+knockout']

# Sport demand — how popular each sport is for team registration
SPORT_DEMAND = {
    'cricket':    1.40,
    'football':   1.25,
    'badminton':  1.00,
    'kabaddi':    0.85,
    'basketball': 1.10,
    'volleyball': 0.90,
}

# City demand — more teams available in bigger cities
CITY_DEMAND = {1: 1.35, 2: 1.00, 3: 0.72}

# Format appeal — knockout is easier commitment
FORMAT_APPEAL = {
    'knockout':        1.20,
    'league':          1.00,
    'league+knockout': 0.90,
}

# Entry fee ranges per city tier
ENTRY_FEE_RANGE = {
    1: (500,  5000),
    2: (300,  3000),
    3: (100,  1500),
}

# Prize pool ranges
PRIZE_POOL_RANGE = {
    1: (2000,  50000),
    2: (1000,  25000),
    3: (500,   12000),
}

MAX_TEAMS_OPTIONS = [4, 6, 8, 10, 12, 14, 16, 20, 24, 32]
MAX_TEAMS_WEIGHTS = [3, 5, 20, 8, 10, 5, 25, 10, 8, 6]

def calculate_registration_outcome(row):
    sport              = row['sport']
    city_tier          = row['city_tier']
    current_regs       = row['current_registrations']
    days_since_open    = row['days_since_open']
    total_days         = row['total_days_available']
    max_teams          = row['max_teams']
    entry_fee          = row['entry_fee']
    prize_pool         = row['prize_pool']
    has_sponsor        = row['has_sponsor']
    format_type        = row['format']

    remaining_days = max(0, total_days - days_since_open)

    # registration velocity (teams per day so far)
    velocity = current_regs / max(days_since_open, 1)

    # prize pool ROI for teams — higher prize relative to fee = more interest
    prize_per_team = prize_pool / max_teams
    roi_factor = min(prize_per_team / max(entry_fee, 1), 3.0)  # cap at 3x

    # demand multiplier
    demand = (
        SPORT_DEMAND[sport]
        * CITY_DEMAND[city_tier]
        * FORMAT_APPEAL[format_type]
        * (1.0 + roi_factor * 0.15)
        * (1.12 if has_sponsor else 1.0)
    )

    # registration burst effect — teams rush in last 2 days
    burst_factor = 1.0
    if remaining_days <= 2:
        burst_factor = random.uniform(1.3, 1.8)
    elif remaining_days <= 4:
        burst_factor = random.uniform(1.1, 1.3)

    # word of mouth — non-linear growth after day 3
    wom_factor = 1.0
    if days_since_open >= 3:
        wom_factor = 1.0 + (days_since_open - 3) * 0.05

    # projected additional registrations
    additional = velocity * remaining_days * demand * burst_factor * wom_factor

    # cancellations — 5% of registered teams drop
    cancellations = current_regs * random.uniform(0.02, 0.08)

    projected = current_regs + additional - cancellations
    projected = max(0, projected)

    # add noise
    projected += np.random.normal(0, max_teams * 0.08)
    projected = max(0, projected)

    # fill rate
    fill_rate = projected / max_teams

    # label
    if fill_rate >= 1.15:
        label = 'oversubscribed'
    elif fill_rate >= 0.82:
        label = 'will_fill'
    else:
        label = 'wont_fill'

    return {
        'projected_registrations': round(min(projected, max_teams * 1.5), 1),
        'fill_rate':               round(fill_rate, 3),
        'label':                   label,
    }

def generate_record():
    sport       = random.choice(SPORTS)
    city_tier   = random.choices([1, 2, 3], weights=[0.30, 0.45, 0.25])[0]
    format_type = random.choices(FORMATS, weights=[0.40, 0.35, 0.25])[0]
    max_teams   = random.choices(MAX_TEAMS_OPTIONS, weights=MAX_TEAMS_WEIGHTS)[0]

    # registration window (days)
    total_days = random.randint(5, 21)

    # snapshot taken at random point in registration window
    days_since_open = random.randint(1, total_days)

    # current registrations — realistic partial fill
    base_fill = random.uniform(0.1, 0.9)
    current_regs = max(0, int(max_teams * base_fill * random.uniform(0.7, 1.2)))
    current_regs = min(current_regs, max_teams)

    # entry fee
    fee_min, fee_max = ENTRY_FEE_RANGE[city_tier]
    entry_fee = round(random.randint(fee_min, fee_max) / 50) * 50

    # prize pool
    pp_min, pp_max = PRIZE_POOL_RANGE[city_tier]
    prize_pool = round(random.randint(pp_min, pp_max) / 500) * 500

    has_sponsor = random.choices([0, 1], weights=[0.70, 0.30])[0]

    row = {
        'sport':                 sport,
        'city_tier':             city_tier,
        'current_registrations': current_regs,
        'days_since_open':       days_since_open,
        'total_days_available':  total_days,
        'max_teams':             max_teams,
        'entry_fee':             entry_fee,
        'prize_pool':            prize_pool,
        'has_sponsor':           has_sponsor,
        'format':                format_type,
        'fill_percentage':       round(current_regs / max_teams * 100, 1),
        'days_remaining':        total_days - days_since_open,
    }

    outcome = calculate_registration_outcome(row)
    row.update(outcome)

    return row

def generate_dataset(n=50000):
    print(f"Generating {n} registration records...")

    records = [generate_record() for _ in range(n)]
    df = pd.DataFrame(records)

    print(f"\nDataset shape: {df.shape}")
    print(f"\nLabel distribution:")
    print(df['label'].value_counts())
    print(f"\nLabel percentages:")
    print(df['label'].value_counts(normalize=True).round(3) * 100)
    print(f"\nFill percentage stats:")
    print(df['fill_percentage'].describe())

    out_path = os.path.join(os.path.dirname(__file__), 'dataset.csv')
    df.to_csv(out_path, index=False)
    print(f"\n✅ Dataset saved to {out_path}")
    return df

if __name__ == '__main__':
    df = generate_dataset(50000)