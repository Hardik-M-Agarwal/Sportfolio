"""
Entry Fee Predictor
Loads trained model and makes predictions
No formula here — pure model inference
"""

import joblib
import numpy as np
import os
import json

BASE_DIR = os.path.dirname(__file__)

# load model and encoders once at startup
_model    = None
_encoders = None
_metrics  = None

def _load_artifacts():
    global _model, _encoders, _metrics
    if _model is None:
        model_path   = os.path.join(BASE_DIR, 'model.pkl')
        encoder_path = os.path.join(BASE_DIR, 'encoder.pkl')
        metrics_path = os.path.join(BASE_DIR, 'metrics.json')

        if not os.path.exists(model_path):
            raise FileNotFoundError(
                "model.pkl not found. Run train_model.py first."
            )

        _model    = joblib.load(model_path)
        _encoders = joblib.load(encoder_path)

        if os.path.exists(metrics_path):
            with open(metrics_path) as f:
                _metrics = json.load(f)

        print("✅ Entry fee model loaded")

def predict_entry_fee(data: dict) -> dict:
    """
    Input:
        sport, city_tier, venue_cost, max_teams, team_size,
        format, has_sponsor, prize_percentage, tournament_days

    Output:
        suggested_fee, min_fee, max_fee, confidence,
        feature_importance, model_metrics
    """
    _load_artifacts()

    sport       = data['sport'].lower()
    city_tier   = int(data['city_tier'])
    venue_cost  = float(data['venue_cost'])
    max_teams   = int(data['max_teams'])
    team_size   = int(data['team_size'])
    format_type = data['format'].lower()
    has_sponsor = int(data['has_sponsor'])
    prize_pct   = float(data['prize_percentage'])
    days        = int(data['tournament_days'])

    # encode categoricals
    sport_enc  = int(_encoders['sport'].transform([sport])[0])
    format_enc = int(_encoders['format'].transform([format_type])[0])

    features = np.array([[
        sport_enc,
        city_tier,
        venue_cost,
        max_teams,
        team_size,
        format_enc,
        has_sponsor,
        prize_pct,
        days,
    ]])

    # predict
    raw_prediction = float(_model.predict(features)[0])

    # round to nearest 50 (realistic organiser behavior)
    suggested_fee = int(round(raw_prediction / 50) * 50)
    suggested_fee = max(suggested_fee, 100)

    # confidence range based on model RMSE
    rmse = _metrics['rmse'] if _metrics else raw_prediction * 0.10
    min_fee = int(round(max(100, raw_prediction - rmse) / 50) * 50)
    max_fee = int(round((raw_prediction + rmse) / 50) * 50)

    # confidence level based on how "typical" the input is
    confidence = _calculate_confidence(
        venue_cost, max_teams, city_tier, raw_prediction
    )

    # feature contributions for Gemini context
    feature_importance = _metrics.get('feature_importance', {}) if _metrics else {}

    return {
        'suggested_fee':      suggested_fee,
        'min_fee':            min_fee,
        'max_fee':            max_fee,
        'raw_prediction':     round(raw_prediction, 2),
        'confidence':         confidence,
        'feature_importance': feature_importance,
        'model_metrics': {
            'r2_score': _metrics.get('r2_score') if _metrics else None,
            'rmse':     _metrics.get('rmse') if _metrics else None,
            'mae':      _metrics.get('mae') if _metrics else None,
        },
        'input_summary': {
            'sport':            sport,
            'city_tier':        city_tier,
            'venue_cost':       venue_cost,
            'max_teams':        max_teams,
            'team_size':        team_size,
            'format':           format_type,
            'has_sponsor':      bool(has_sponsor),
            'prize_percentage': prize_pct,
            'tournament_days':  days,
        }
    }

def _calculate_confidence(venue_cost, max_teams, city_tier, prediction):
    """Confidence based on how typical the input is"""
    typical_ranges = {
        1: (8000, 55000),
        2: (4000, 28000),
        3: (1500, 12000),
    }
    v_min, v_max = typical_ranges[city_tier]

    if v_min <= venue_cost <= v_max and 4 <= max_teams <= 32:
        return 'high'
    elif (v_min * 0.5) <= venue_cost <= (v_max * 1.5):
        return 'medium'
    else:
        return 'low'