"""
Entry Fee Dataset Generator
Generates 50,000 synthetic Indian local tournament records
Formula used ONLY here — never at prediction time
"""

import numpy as np
import pandas as pd
import random
import os

random.seed(42)
np.random.seed(42)

# ── Constants ─────────────────────────────────────────────────────────

SPORTS = ['cricket', 'football', 'badminton', 'kabaddi', 'basketball', 'volleyball']

# Additional operational costs per team (umpires, equipment, printing)
# Realistic Indian local tournament costs
OPERATIONAL_COST = {
    'cricket':    300,   # umpires, leather balls
    'football':   200,
    'badminton':  120,
    'kabaddi':    150,
    'basketball': 180,
    'volleyball': 130,
}

# Sport multiplier — realistic market willingness to pay in India
SPORT_MULT = {
    'cricket':    1.20,
    'football':   1.10,
    'badminton':  1.00,
    'kabaddi':    0.85,
    'basketball': 1.05,
    'volleyball': 0.90,
}

# City tier multiplier — realistic Indian market
CITY_MULT = {1: 1.25, 2: 1.00, 3: 0.72}

# City tier floor/ceiling (realistic Indian tournament market)
CITY_FLOOR   = {1: 300,  2: 200,  3: 100}
CITY_CEILING = {1: 5000, 2: 3000, 3: 1500}

# Format multiplier (league = more matches = more cost)
FORMAT_MULT = {
    'knockout':         1.00,
    'league':           1.20,
    'league+knockout':  1.35,
}

FORMATS = list(FORMAT_MULT.keys())

# Team size per sport (realistic)
TEAM_SIZE_RANGE = {
    'cricket':    (11, 15),
    'football':   (7, 11),
    'badminton':  (1, 4),
    'kabaddi':    (7, 12),
    'basketball': (5, 8),
    'volleyball': (6, 8),
}

# Venue cost ranges per city tier (₹) — realistic Indian ground/court costs
VENUE_COST_RANGE = {
    1: (5000,  30000),   # Mumbai, Delhi, Bangalore
    2: (3000,  15000),   # Pune, Surat, Nagpur
    3: (1000,   8000),   # Nashik, Aurangabad, smaller cities
}

# Max teams distribution — 8 and 16 most common in India
MAX_TEAMS_OPTIONS = [4, 6, 8, 10, 12, 14, 16, 20, 24, 32]
MAX_TEAMS_WEIGHTS = [3, 5, 20, 8, 10, 5, 25, 10, 8, 6]

# Prize percentage range — realistic Indian tournament range
PRIZE_PCT_RANGE = (40, 75)

# Tournament days range
DAYS_RANGE = {
    'knockout':        (1, 2),
    'league':          (2, 4),
    'league+knockout': (2, 5),
}

# ── Core fee calculation ──────────────────────────────────────────────

def calculate_optimal_fee(row):
    sport       = row['sport']
    city_tier   = row['city_tier']
    venue_cost  = row['venue_cost']
    max_teams   = row['max_teams']
    format_type = row['format']
    has_sponsor = row['has_sponsor']
    prize_pct   = row['prize_percentage']
    days        = row['tournament_days']

    # base cost per team — venue split
    base_cost = venue_cost / max_teams

    # operational cost per team
    operational = OPERATIONAL_COST[sport]

    # total cost per team to recover
    total_cost_per_team = base_cost + operational

    # prize pool load — organiser needs extra to fund prizes
    # kept conservative — 25% weight
    prize_load = 1.0 + (prize_pct / 100.0) * 0.25

    # sponsor subsidises — reduces required entry fee
    sponsor_discount = 0.85 if has_sponsor else 1.0

    # more days = slightly more cost (logistics, meals)
    days_mult = 1.0 + (days - 1) * 0.07

    # compute fee
    fee = (
        total_cost_per_team
        * CITY_MULT[city_tier]
        * SPORT_MULT[sport]
        * FORMAT_MULT[format_type]
        * prize_load
        * sponsor_discount
        * days_mult
    )

    return fee

# ── Noise application ─────────────────────────────────────────────────

def apply_noise(fee, city_tier, row):
    """Apply 4 types of realistic noise"""

    # 1. Market noise — same inputs, different organisers charge differently
    market_noise = np.random.normal(0, fee * 0.08)
    fee += market_noise

    # 2. Outliers — some organisers overprice or underprice
    r = random.random()
    if r < 0.03:
        fee *= random.uniform(0.50, 0.70)   # underpriced
    elif r < 0.06:
        fee *= random.uniform(1.35, 1.70)   # overpriced

    # 3. Rounding behavior — Indian organisers prefer round numbers
    rounding_choice = random.choices(
        [500, 250, 100, 50, 1],
        weights=[0.35, 0.20, 0.28, 0.12, 0.05]
    )[0]
    fee = round(fee / rounding_choice) * rounding_choice

    # 4. Floor and ceiling per city tier
    fee = max(fee, CITY_FLOOR[city_tier])
    fee = min(fee, CITY_CEILING[city_tier])

    # ensure positive
    fee = max(fee, 100)

    return int(fee)

# ── Generate single record ────────────────────────────────────────────

def generate_record():
    sport       = random.choice(SPORTS)
    city_tier   = random.choices([1, 2, 3], weights=[0.30, 0.45, 0.25])[0]
    format_type = random.choices(FORMATS, weights=[0.40, 0.35, 0.25])[0]

    # venue cost — lognormal distribution (most venues are cheaper)
    venue_min, venue_max = VENUE_COST_RANGE[city_tier]
    venue_cost = int(np.random.lognormal(
        mean=np.log((venue_min + venue_max) / 2.5),
        sigma=0.40
    ))
    venue_cost = max(venue_min, min(venue_max, venue_cost))
    venue_cost = round(venue_cost / 500) * 500

    max_teams = random.choices(MAX_TEAMS_OPTIONS, weights=MAX_TEAMS_WEIGHTS)[0]

    ts_min, ts_max = TEAM_SIZE_RANGE[sport]
    team_size = random.randint(ts_min, ts_max)

    # in India most local tournaments don't have sponsors
    has_sponsor = random.choices([0, 1], weights=[0.70, 0.30])[0]

    prize_pct = random.randint(*PRIZE_PCT_RANGE)
    prize_pct = round(prize_pct / 5) * 5  # round to nearest 5%

    days_min, days_max = DAYS_RANGE[format_type]
    tournament_days = random.randint(days_min, days_max)

    row = {
        'sport':            sport,
        'city_tier':        city_tier,
        'venue_cost':       venue_cost,
        'max_teams':        max_teams,
        'team_size':        team_size,
        'format':           format_type,
        'has_sponsor':      has_sponsor,
        'prize_percentage': prize_pct,
        'tournament_days':  tournament_days,
    }

    raw_fee = calculate_optimal_fee(row)
    row['optimal_entry_fee'] = apply_noise(raw_fee, city_tier, row)

    return row

# ── Generate full dataset ─────────────────────────────────────────────

def generate_dataset(n=50000):
    print(f"Generating {n} tournament records...")

    records = [generate_record() for _ in range(n)]
    df = pd.DataFrame(records)

    print(f"\nDataset shape: {df.shape}")
    print(f"\nEntry fee stats:")
    print(df['optimal_entry_fee'].describe())
    print(f"\nFee by city tier:")
    print(df.groupby('city_tier')['optimal_entry_fee'].describe()[['mean', 'min', 'max']])
    print(f"\nFee by sport:")
    print(df.groupby('sport')['optimal_entry_fee'].mean().sort_values(ascending=False))
    print(f"\nSport distribution:\n{df['sport'].value_counts()}")
    print(f"\nCity tier distribution:\n{df['city_tier'].value_counts()}")
    print(f"\nFormat distribution:\n{df['format'].value_counts()}")

    out_path = os.path.join(os.path.dirname(__file__), 'dataset.csv')
    df.to_csv(out_path, index=False)
    print(f"\n✅ Dataset saved to {out_path}")
    return df

if __name__ == '__main__':
    df = generate_dataset(50000)