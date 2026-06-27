"""
Sponsor ROI Dataset Generator
Generates 50,000 synthetic tournament sponsor ROI records
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
TIERS = ['platinum', 'gold', 'silver', 'bronze']

TIER_AMOUNTS = {
    'platinum': 50000,
    'gold':     25000,
    'silver':   15000,
    'bronze':    7000,
}

# Sport audience demand multiplier
SPORT_AUDIENCE = {
    'cricket':    1.80,
    'football':   1.50,
    'badminton':  1.00,
    'kabaddi':    1.20,
    'basketball': 1.15,
    'volleyball': 0.95,
}

# City tier audience multiplier
CITY_AUDIENCE = {1: 1.70, 2: 1.20, 3: 0.75}

# Format multiplier — more matches = more exposure
FORMAT_AUDIENCE = {
    'knockout':        1.00,
    'league':          1.35,
    'league+knockout': 1.55,
}

# Sponsorship tier visibility multiplier
TIER_VISIBILITY = {
    'platinum': 1.50,
    'gold':     1.25,
    'silver':   1.00,
    'bronze':   0.75,
}

# Family spectator ratio per sport
FAMILY_RATIO = {
    'cricket':    2.20,
    'football':   1.80,
    'badminton':  1.40,
    'kabaddi':    1.60,
    'basketball': 1.50,
    'volleyball': 1.35,
}

# Word of mouth per match per sport
WOM_PER_MATCH = {
    'cricket':    18,
    'football':   14,
    'badminton':   6,
    'kabaddi':     9,
    'basketball':  8,
    'volleyball':  6,
}

# Venue occupancy rate by sport + city tier
OCCUPANCY = {
    ('cricket',    1): 0.82,
    ('cricket',    2): 0.70,
    ('cricket',    3): 0.55,
    ('football',   1): 0.75,
    ('football',   2): 0.62,
    ('football',   3): 0.48,
    ('badminton',  1): 0.65,
    ('badminton',  2): 0.52,
    ('badminton',  3): 0.40,
    ('kabaddi',    1): 0.70,
    ('kabaddi',    2): 0.58,
    ('kabaddi',    3): 0.45,
    ('basketball', 1): 0.68,
    ('basketball', 2): 0.55,
    ('basketball', 3): 0.42,
    ('volleyball', 1): 0.60,
    ('volleyball', 2): 0.48,
    ('volleyball', 3): 0.38,
}

# Social media reach multiplier by city tier
SOCIAL_MULT = {1: 0.55, 2: 0.38, 3: 0.22}

# Max teams options
MAX_TEAMS_OPTIONS = [4, 6, 8, 10, 12, 14, 16, 20, 24, 32]
MAX_TEAMS_WEIGHTS = [3, 5, 20, 8, 10, 5, 25, 10, 8, 6]

# Venue capacity ranges per city tier
CAPACITY_RANGE = {1: (300, 2000), 2: (150, 1000), 3: (50, 500)}

def calculate_roi(row):
    sport      = row['sport']
    city_tier  = row['city_tier']
    num_teams  = row['num_teams']
    num_matches = row['num_matches']
    venue_cap  = row['venue_capacity']
    team_size  = row['team_size']
    days       = row['tournament_days']
    has_sponsor = row['has_existing_sponsor']
    tier       = row['sponsorship_tier']

    # 1. Players reach
    players_reach = num_teams * team_size

    # 2. Family spectators
    family_reach = round(players_reach * FAMILY_RATIO[sport] * random.uniform(0.85, 1.15))

    # 3. Venue spectators
    occupancy_rate = OCCUPANCY.get((sport, city_tier), 0.55)
    venue_reach = round(venue_cap * occupancy_rate * days * random.uniform(0.80, 1.10))

    # 4. Word of mouth
    wom_reach = round(num_matches * WOM_PER_MATCH[sport] * CITY_AUDIENCE[city_tier] * random.uniform(0.75, 1.25))

    # 5. Social media
    base_social = players_reach + venue_reach
    social_reach = round(base_social * SOCIAL_MULT[city_tier] * random.uniform(0.70, 1.30))

    # 6. Total base reach
    total_base = players_reach + family_reach + venue_reach + wom_reach + social_reach

    # 7. Apply multipliers
    total_reach = round(
        total_base
        * SPORT_AUDIENCE[sport]
        * FORMAT_AUDIENCE[row['format']]
        * TIER_VISIBILITY[tier]
        * (1.12 if has_sponsor else 1.0)
    )

    # 8. Cost per person
    tier_amount = TIER_AMOUNTS[tier]
    cost_per_person = round(tier_amount / max(total_reach, 1), 2)

    return {
        'estimated_reach':   total_reach,
        'cost_per_person':   cost_per_person,
        'players_reach':     players_reach,
        'family_reach':      family_reach,
        'venue_reach':       venue_reach,
        'wom_reach':         wom_reach,
        'social_reach':      social_reach,
    }

def get_num_matches(num_teams, format_type):
    if format_type == 'knockout':
        return num_teams - 1
    elif format_type == 'league':
        return num_teams * (num_teams - 1) // 2
    else:  # league+knockout
        group_matches = num_teams * (num_teams - 1) // 4
        knockout_matches = num_teams // 2 - 1
        return group_matches + knockout_matches

def get_team_size(sport):
    sizes = {
        'cricket': 11, 'football': 11, 'badminton': 2,
        'kabaddi': 7, 'basketball': 5, 'volleyball': 6,
    }
    return sizes[sport]

def generate_record():
    sport      = random.choice(SPORTS)
    city_tier  = random.choices([1, 2, 3], weights=[0.30, 0.45, 0.25])[0]
    format_type = random.choices(FORMATS, weights=[0.40, 0.35, 0.25])[0]
    num_teams  = random.choices(MAX_TEAMS_OPTIONS, weights=MAX_TEAMS_WEIGHTS)[0]
    tier       = random.choices(TIERS, weights=[0.10, 0.25, 0.40, 0.25])[0]

    num_matches = get_num_matches(num_teams, format_type)
    team_size   = get_team_size(sport)

    cap_min, cap_max = CAPACITY_RANGE[city_tier]
    venue_capacity = random.randint(cap_min, cap_max)
    venue_capacity = round(venue_capacity / 50) * 50

    days_map = {'knockout': (1, 2), 'league': (2, 5), 'league+knockout': (3, 6)}
    d_min, d_max = days_map[format_type]
    tournament_days = random.randint(d_min, d_max)

    has_existing_sponsor = random.choices([0, 1], weights=[0.65, 0.35])[0]

    row = {
        'sport':                sport,
        'city_tier':            city_tier,
        'num_teams':            num_teams,
        'num_matches':          num_matches,
        'venue_capacity':       venue_capacity,
        'team_size':            team_size,
        'tournament_days':      tournament_days,
        'has_existing_sponsor': has_existing_sponsor,
        'format':               format_type,
        'sponsorship_tier':     tier,
    }

    outcome = calculate_roi(row)
    row.update(outcome)

    return row

def generate_dataset(n=50000):
    print(f"Generating {n} sponsor ROI records...")

    records = [generate_record() for _ in range(n)]
    df = pd.DataFrame(records)

    print(f"\nDataset shape: {df.shape}")
    print(f"\nEstimated reach stats:")
    print(df['estimated_reach'].describe())
    print(f"\nCost per person stats:")
    print(df['cost_per_person'].describe())
    print(f"\nReach by sponsorship tier:")
    print(df.groupby('sponsorship_tier')['estimated_reach'].mean().round(0))
    print(f"\nReach by sport:")
    print(df.groupby('sport')['estimated_reach'].mean().sort_values(ascending=False).round(0))

    out_path = os.path.join(os.path.dirname(__file__), 'dataset.csv')
    df.to_csv(out_path, index=False)
    print(f"\n✅ Dataset saved to {out_path}")
    return df

if __name__ == '__main__':
    df = generate_dataset(50000)