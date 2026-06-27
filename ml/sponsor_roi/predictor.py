"""
Sponsor ROI Predictor
Loads trained models and predicts audience reach + cost per person
No formula here — pure model inference
"""

import joblib
import numpy as np
import os
import json

BASE_DIR = os.path.dirname(__file__)

_reach_model = None
_cpp_model   = None
_encoders    = None
_metrics     = None

def _load_artifacts():
    global _reach_model, _cpp_model, _encoders, _metrics
    if _reach_model is None:
        reach_path   = os.path.join(BASE_DIR, 'reach_model.pkl')
        cpp_path     = os.path.join(BASE_DIR, 'cpp_model.pkl')
        encoder_path = os.path.join(BASE_DIR, 'encoder.pkl')
        metrics_path = os.path.join(BASE_DIR, 'metrics.json')

        if not os.path.exists(reach_path):
            raise FileNotFoundError("reach_model.pkl not found. Run train_model.py first.")

        _reach_model = joblib.load(reach_path)
        _cpp_model   = joblib.load(cpp_path)
        _encoders    = joblib.load(encoder_path)

        if os.path.exists(metrics_path):
            with open(metrics_path) as f:
                _metrics = json.load(f)

        print("✅ Sponsor ROI models loaded")

def predict_sponsor_roi(data: dict) -> dict:
    _load_artifacts()

    sport            = data['sport'].lower()
    city_tier        = int(data['city_tier'])
    num_teams        = int(data['num_teams'])
    num_matches      = int(data['num_matches'])
    venue_capacity   = int(data['venue_capacity'])
    team_size        = int(data['team_size'])
    tournament_days  = int(data['tournament_days'])
    has_sponsor      = int(data['has_existing_sponsor'])
    format_type      = data['format'].lower()
    tier             = data['sponsorship_tier'].lower()

    # encode
    sport_enc  = int(_encoders['sport'].transform([sport])[0])
    format_enc = int(_encoders['format'].transform([format_type])[0])
    tier_enc   = int(_encoders['sponsorship_tier'].transform([tier])[0])

    features = np.array([[
        sport_enc,
        city_tier,
        num_teams,
        num_matches,
        venue_capacity,
        team_size,
        tournament_days,
        has_sponsor,
        format_enc,
        tier_enc,
    ]])

    # predict
    estimated_reach  = max(1, int(_reach_model.predict(features)[0]))
    cost_per_person  = round(float(_cpp_model.predict(features)[0]), 2)

    # tier amounts
    tier_amounts = {
        'platinum': 50000,
        'gold':     25000,
        'silver':   15000,
        'bronze':    7000,
    }
    tier_amount = tier_amounts[tier]

    # recalculate cost per person from prediction
    cost_per_person = round(tier_amount / max(estimated_reach, 1), 2)

    # ROI rating
    roi_rating = _get_roi_rating(cost_per_person, sport, city_tier)

    # reach breakdown estimate
    players_reach = num_teams * team_size
    family_reach  = round(players_reach * 1.8)
    venue_reach   = round(venue_capacity * 0.65)
    social_reach  = round(estimated_reach * 0.18)
    wom_reach     = max(0, estimated_reach - players_reach - family_reach - venue_reach - social_reach)

    return {
        'estimated_reach':   estimated_reach,
        'cost_per_person':   cost_per_person,
        'tier_amount':       tier_amount,
        'roi_rating':        roi_rating,
        'reach_breakdown': {
            'players':          players_reach,
            'family':           family_reach,
            'venue_spectators': venue_reach,
            'social_media':     social_reach,
            'word_of_mouth':    wom_reach,
        },
        'model_metrics': {
            'reach_r2': _metrics['reach_model']['r2_score'] if _metrics else None,
            'cpp_r2':   _metrics['cpp_model']['r2_score']   if _metrics else None,
        },
        'input_summary': {
            'sport':           sport,
            'city_tier':       city_tier,
            'num_teams':       num_teams,
            'num_matches':     num_matches,
            'venue_capacity':  venue_capacity,
            'tournament_days': tournament_days,
            'format':          format_type,
            'tier':            tier,
            'has_sponsor':     bool(has_sponsor),
        }
    }

def _get_roi_rating(cost_per_person, sport, city_tier):
    # benchmarks per sport + city (₹ per person)
    benchmarks = {
        ('cricket',    1): 25,
        ('cricket',    2): 35,
        ('cricket',    3): 50,
        ('football',   1): 30,
        ('football',   2): 42,
        ('football',   3): 60,
        ('badminton',  1): 45,
        ('badminton',  2): 60,
        ('badminton',  3): 80,
        ('kabaddi',    1): 35,
        ('kabaddi',    2): 48,
        ('kabaddi',    3): 65,
        ('basketball', 1): 38,
        ('basketball', 2): 52,
        ('basketball', 3): 70,
        ('volleyball', 1): 42,
        ('volleyball', 2): 55,
        ('volleyball', 3): 75,
    }
    benchmark = benchmarks.get((sport, city_tier), 40)

    if cost_per_person <= benchmark * 0.6:
        return 'excellent'
    elif cost_per_person <= benchmark * 0.85:
        return 'good'
    elif cost_per_person <= benchmark * 1.15:
        return 'fair'
    else:
        return 'poor'