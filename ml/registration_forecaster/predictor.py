"""
Registration Forecaster Predictor
Loads trained classifier and makes predictions
No formula here — pure model inference
"""

import joblib
import numpy as np
import os
import json

BASE_DIR = os.path.dirname(__file__)

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

        print("✅ Registration forecaster model loaded")

def predict_registration(data: dict) -> dict:
    """
    Input:
        sport, city_tier, current_registrations, days_since_open,
        total_days_available, max_teams, entry_fee, prize_pool,
        has_sponsor, format

    Output:
        prediction, confidence, projected_registrations,
        fill_rate, days_remaining, model_metrics
    """
    _load_artifacts()

    sport            = data['sport'].lower()
    city_tier        = int(data['city_tier'])
    current_regs     = int(data['current_registrations'])
    days_since_open  = int(data['days_since_open'])
    total_days       = int(data['total_days_available'])
    max_teams        = int(data['max_teams'])
    entry_fee        = float(data['entry_fee'])
    prize_pool       = float(data['prize_pool'])
    has_sponsor      = int(data['has_sponsor'])
    format_type      = data['format'].lower()

    days_remaining  = max(0, total_days - days_since_open)
    fill_percentage = round(current_regs / max_teams * 100, 1)

    # encode categoricals
    sport_enc  = int(_encoders['sport'].transform([sport])[0])
    format_enc = int(_encoders['format'].transform([format_type])[0])

    features = np.array([[
        sport_enc,
        city_tier,
        current_regs,
        days_since_open,
        total_days,
        days_remaining,
        max_teams,
        entry_fee,
        prize_pool,
        has_sponsor,
        format_enc,
        fill_percentage,
    ]])

    # predict class + probabilities
    pred_class = int(_model.predict(features)[0])
    pred_proba = _model.predict_proba(features)[0]

    label_encoder = _encoders['label']
    prediction    = label_encoder.inverse_transform([pred_class])[0]
    confidence    = round(float(max(pred_proba)) * 100, 1)

    # all class probabilities
    class_probs = {
        label_encoder.inverse_transform([i])[0]: round(float(p) * 100, 1)
        for i, p in enumerate(pred_proba)
    }

    # simple projection based on current velocity
    velocity = current_regs / max(days_since_open, 1)
    projected = min(
        round(current_regs + velocity * days_remaining),
        int(max_teams * 1.5)
    )

    # days to full (if will_fill)
    days_to_full = None
    if prediction == 'will_fill' and velocity > 0:
        remaining_spots = max_teams - current_regs
        days_to_full    = round(remaining_spots / velocity)

    return {
        'prediction':              prediction,
        'confidence':              confidence,
        'class_probabilities':     class_probs,
        'projected_registrations': projected,
        'fill_rate':               round(current_regs / max_teams, 3),
        'fill_percentage':         fill_percentage,
        'days_remaining':          days_remaining,
        'days_to_full':            days_to_full,
        'current_registrations':   current_regs,
        'max_teams':               max_teams,
        'model_metrics': {
            'accuracy': _metrics.get('accuracy') if _metrics else None,
            'f1_score': _metrics.get('f1_score') if _metrics else None,
        },
        'input_summary': {
            'sport':             sport,
            'city_tier':         city_tier,
            'days_since_open':   days_since_open,
            'days_remaining':    days_remaining,
            'entry_fee':         entry_fee,
            'prize_pool':        prize_pool,
            'has_sponsor':       bool(has_sponsor),
            'format':            format_type,
        }
    }