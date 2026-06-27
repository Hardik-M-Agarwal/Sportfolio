"""
Sportfolio ML Service
Single Flask app serving all ML models
Port: 5050
"""

import os
import json
from dotenv import load_dotenv
load_dotenv()

import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
from entry_fee.predictor import predict_entry_fee
from registration_forecaster.predictor import predict_registration

app = Flask(__name__)
CORS(app)

# Available Gemini models – choose one via GEMINI_MODEL env var
MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]
DEFAULT_MODEL = MODELS[0]  # gemini-2.5-flash

# configure Gemini
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
model_name = os.environ.get('GEMINI_MODEL', DEFAULT_MODEL)
# Ensure the chosen model is in the list (if not, fallback to default)
if model_name not in MODELS:
    print(f"Warning: {model_name} not in allowed list, falling back to {DEFAULT_MODEL}")
    model_name = DEFAULT_MODEL
gemini_model = genai.GenerativeModel(model_name)

# ── Health check ──────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({ 'status': 'ok', 'service': 'Sportfolio ML', 'model': model_name })

# ── Entry Fee Prediction ──────────────────────────────────────────────
@app.route('/predict/entry-fee', methods=['POST'])
def entry_fee():
    try:
        data = request.get_json()
        required = ['sport', 'city_tier', 'venue_cost', 'max_teams',
                    'team_size', 'format', 'has_sponsor',
                    'prize_percentage', 'tournament_days']
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({ 'error': f"Missing fields: {', '.join(missing)}" }), 400

        prediction = predict_entry_fee(data)
        explanation = get_entry_fee_explanation(prediction)
        prediction['gemini'] = explanation

        return jsonify({ 'success': True, 'data': prediction })

    except FileNotFoundError as e:
        return jsonify({ 'error': str(e), 'hint': 'Run train_model.py first' }), 503
    except Exception as e:
        print(f"Entry fee prediction error: {e}")
        return jsonify({ 'error': str(e) }), 500

# ── Registration Forecast ─────────────────────────────────────────────
@app.route('/predict/registration', methods=['POST'])
def registration():
    try:
        data = request.get_json()
        required = ['sport', 'city_tier', 'current_registrations',
                    'days_since_open', 'total_days_available',
                    'max_teams', 'entry_fee', 'prize_pool',
                    'has_sponsor', 'format']
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({ 'error': f"Missing fields: {', '.join(missing)}" }), 400

        prediction = predict_registration(data)
        explanation = get_registration_explanation(prediction)
        prediction['gemini'] = explanation

        return jsonify({ 'success': True, 'data': prediction })

    except FileNotFoundError as e:
        return jsonify({ 'error': str(e), 'hint': 'Run train_model.py first' }), 503
    except Exception as e:
        print(f"Registration prediction error: {e}")
        return jsonify({ 'error': str(e) }), 500

# ── Gemini — Entry Fee Explanation ───────────────────────────────────
def get_entry_fee_explanation(prediction: dict) -> dict:
    inp        = prediction['input_summary']
    suggested  = prediction['suggested_fee']
    min_fee    = prediction['min_fee']
    max_fee    = prediction['max_fee']
    confidence = prediction['confidence']

    city_labels = {
        1: 'Tier 1 (Mumbai/Delhi/Bangalore)',
        2: 'Tier 2 (Pune/Surat/Nagpur)',
        3: 'Tier 3 (smaller cities)'
    }
    city_label      = city_labels.get(inp['city_tier'], str(inp['city_tier']))
    venue_per_team  = round(inp['venue_cost'] / inp['max_teams'])
    total_revenue   = suggested * inp['max_teams']
    breakeven_teams = max(1, round(inp['venue_cost'] / suggested))

    prompt = f"""
You are a sports tournament financial advisor in India.

An XGBoost ML model predicted the optimal entry fee for a local sports tournament.
Generate a structured JSON explanation for the organiser.

Tournament details:
- Sport: {inp['sport'].title()}
- City: {city_label}
- Venue cost: ₹{int(inp['venue_cost']):,}
- Max teams: {inp['max_teams']}
- Team size: {inp['team_size']} players
- Format: {inp['format']}
- Has sponsor: {'Yes' if inp['has_sponsor'] else 'No'}
- Prize pool percentage: {int(inp['prize_percentage'])}%
- Tournament days: {inp['tournament_days']}

ML Model Output:
- Suggested entry fee: ₹{suggested:,}
- Range: ₹{min_fee:,} — ₹{max_fee:,}
- Confidence: {confidence}
- Venue cost per team: ₹{venue_per_team:,}
- Total revenue if full: ₹{total_revenue:,}
- Break-even teams needed: {breakeven_teams} of {inp['max_teams']}

Return ONLY a valid JSON object with this EXACT structure (no markdown, no backticks):
{{
  "headline": "short punchy title about the suggested fee (max 8 words)",
  "summary": "2 sentences explaining why this fee makes sense. Be specific with numbers.",
  "breakdown": [
    {{"icon": "🏟️", "label": "Venue Recovery", "value": "₹{venue_per_team:,}/team", "insight": "specific one-line insight"}},
    {{"icon": "📍", "label": "City Premium", "value": "relevant value", "insight": "city tier pricing insight"}},
    {{"icon": "🏆", "label": "Format Factor", "value": "relevant value", "insight": "format cost insight"}},
    {{"icon": "💼", "label": "{'Sponsor Benefit' if inp['has_sponsor'] else 'No Sponsor'}", "value": "relevant value", "insight": "sponsor impact insight"}}
  ],
  "market_context": "one paragraph comparing to similar Indian tournaments",
  "risk_flag": null,
  "tip": "one specific actionable financial tip"
}}
Return ONLY the JSON. No markdown. No backticks. No extra text.
"""
    return _call_gemini(prompt, _fallback_entry_fee(prediction))

# ── Gemini — Registration Explanation ────────────────────────────────
def get_registration_explanation(prediction: dict) -> dict:
    inp       = prediction['input_summary']
    pred      = prediction['prediction']
    confidence = prediction['confidence']
    current   = prediction['current_registrations']
    max_teams = prediction['max_teams']
    projected = prediction['projected_registrations']
    days_left = prediction['days_remaining']
    fill_pct  = prediction['fill_percentage']

    pred_labels = {
        'will_fill':      'On Track to Fill ✅',
        'wont_fill':      'At Risk of Falling Short ⚠️',
        'oversubscribed': 'Oversubscribed 🔥',
    }
    pred_label = pred_labels.get(pred, pred)

    city_labels = {1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3'}
    city_label  = city_labels.get(inp['city_tier'], str(inp['city_tier']))

    prompt = f"""
You are a sports tournament registration analyst in India.

An XGBoost ML classifier predicted the registration outcome for a local sports tournament.
Generate a structured JSON insight for the organiser.

Tournament snapshot:
- Sport: {inp['sport'].title()}
- City: {city_label}
- Format: {inp['format']}
- Entry fee: ₹{int(inp['entry_fee']):,}
- Prize pool: ₹{int(inp['prize_pool']):,}
- Has sponsor: {'Yes' if inp['has_sponsor'] else 'No'}
- Days since registration opened: {inp['days_since_open']}
- Days remaining: {days_left}
- Current registrations: {current} / {max_teams} ({fill_pct}% full)

ML Model Output:
- Prediction: {pred} ({pred_label})
- Confidence: {confidence}%
- Projected final registrations: {projected} / {max_teams}

Return ONLY a valid JSON object with this EXACT structure (no markdown, no backticks):
{{
  "headline": "short punchy headline about registration status (max 8 words)",
  "summary": "2 sentences explaining the prediction with specific numbers.",
  "status_color": "{('green' if pred == 'will_fill' else 'red' if pred == 'wont_fill' else 'blue')}",
  "insights": [
    {{"icon": "📈", "label": "Registration Velocity", "value": "X teams/day", "detail": "specific insight about pace"}},
    {{"icon": "🎯", "label": "Projected Fill", "value": "{projected}/{max_teams} teams", "detail": "projection insight"}},
    {{"icon": "⏰", "label": "Time Remaining", "value": "{days_left} days", "detail": "time pressure insight"}},
    {{"icon": "💰", "label": "Fee vs Prize", "value": "ROI insight", "detail": "how entry fee affects registrations"}}
  ],
  "action": "one specific action the organiser should take RIGHT NOW based on the prediction",
  "risk_flag": null
}}
Return ONLY the JSON. No markdown. No backticks. No extra text.
"""
    return _call_gemini(prompt, _fallback_registration(prediction))

# ── Gemini helper ─────────────────────────────────────────────────────
def _call_gemini(prompt: str, fallback: dict) -> dict:
    try:
        response = gemini_model.generate_content(prompt)
        text = response.text.strip()

        if text.startswith('```'):
            text = text.split('```')[1]
            if text.startswith('json'):
                text = text[4:]
        text = text.strip()

        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"Gemini JSON parse error: {e}")
        return fallback
    except Exception as e:
        print(f"Gemini error: {e}")
        return fallback

def _fallback_entry_fee(prediction: dict) -> dict:
    inp            = prediction['input_summary']
    suggested      = prediction['suggested_fee']
    venue_per_team = round(inp['venue_cost'] / inp['max_teams'])
    return {
        'headline': f"₹{suggested:,} is your recommended entry fee",
        'summary':  f"Based on your venue cost of ₹{int(inp['venue_cost']):,} across {inp['max_teams']} teams, ₹{suggested:,} per team ensures cost recovery.",
        'breakdown': [
            {'icon': '🏟️', 'label': 'Venue Recovery', 'value': f'₹{venue_per_team:,}/team', 'insight': f'₹{int(inp["venue_cost"]):,} venue splits to ₹{venue_per_team:,} per team'},
            {'icon': '📍', 'label': 'City Tier',       'value': f'Tier {inp["city_tier"]}',  'insight': f'Tier {inp["city_tier"]} city pricing factored in'},
            {'icon': '💼', 'label': 'Sponsor',          'value': '−15%' if inp['has_sponsor'] else 'None', 'insight': 'Sponsor reduces required fee' if inp['has_sponsor'] else 'No sponsor — full cost from entry fees'},
            {'icon': '🏆', 'label': 'Prize Pool',       'value': f'{int(inp["prize_percentage"])}%', 'insight': f'₹{round(suggested * inp["max_teams"] * inp["prize_percentage"] / 100):,} goes to prize pool'},
        ],
        'market_context': f'Similar {inp["sport"]} tournaments in Tier {inp["city_tier"]} cities charge ₹{prediction["min_fee"]:,}–₹{prediction["max_fee"]:,}.',
        'risk_flag': None,
        'tip': f'You need {round(inp["venue_cost"] / suggested)} teams to break even out of {inp["max_teams"]} total slots.',
    }

def _fallback_registration(prediction: dict) -> dict:
    pred    = prediction['prediction']
    current = prediction['current_registrations']
    max_t   = prediction['max_teams']
    days    = prediction['days_remaining']

    actions = {
        'will_fill':      'Keep momentum — send a WhatsApp update to registered captains to spread the word.',
        'wont_fill':      f'Act now — broadcast to your network immediately. Consider reducing entry fee by 10-15% to attract the remaining {max_t - current} teams.',
        'oversubscribed': 'Start a waitlist immediately and consider expanding max teams if venue allows.',
    }
    return {
        'headline': f"{'On track' if pred == 'will_fill' else 'At risk' if pred == 'wont_fill' else 'Oversubscribed'} — {current}/{max_t} teams registered",
        'summary':  f"Currently at {current} of {max_t} teams with {days} days remaining.",
        'status_color': 'green' if pred == 'will_fill' else 'red' if pred == 'wont_fill' else 'blue',
        'insights': [
            {'icon': '📈', 'label': 'Current Fill',     'value': f'{prediction["fill_percentage"]}%',              'detail': f'{current} of {max_t} slots filled'},
            {'icon': '🎯', 'label': 'Projected',        'value': f'{prediction["projected_registrations"]}/{max_t}', 'detail': 'Expected final registrations'},
            {'icon': '⏰', 'label': 'Time Remaining',   'value': f'{days} days',                                    'detail': 'Days until registration closes'},
            {'icon': '💰', 'label': 'Entry Fee Impact', 'value': f'₹{int(prediction["input_summary"]["entry_fee"]):,}', 'detail': 'Higher fees slow registrations'},
        ],
        'action':    actions.get(pred, 'Monitor registrations daily.'),
        'risk_flag': None,
    }

if __name__ == '__main__':
    print(f"🚀 Starting Sportfolio ML Service on port 5050 using Gemini model: {model_name}")
    app.run(port=5050, debug=False)