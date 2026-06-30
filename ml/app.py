"""
Sportfolio ML Service
Single Flask app serving all ML models
Local port: 5050 (Render assigns PORT dynamically via run.py)
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
from sponsor_roi.predictor import predict_sponsor_roi

app = Flask(__name__)

# Restrict CORS to the Node.js backend only (set BACKEND_URL on Render,
# e.g. https://sportfolio-backend.onrender.com).
# Falls back to allow-all for local development.
_backend_origin = os.environ.get('BACKEND_URL')
if _backend_origin:
    CORS(app, origins=[_backend_origin])
else:
    CORS(app)

# ── Gemini setup with model fallback array ────────────────────────────
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))

GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]

def get_gemini_model():
    for model_name in GEMINI_MODELS:
        try:
            model = genai.GenerativeModel(model_name)
            model.generate_content("hi")
            print(f"✅ Using Gemini model: {model_name}")
            return model
        except Exception as e:
            print(f"⚠️  {model_name} not available: {e}")
    print("❌ No Gemini model available — will use fallback responses")
    return None

gemini_model = get_gemini_model()

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'service': 'Sportfolio ML',
        'status': 'running',
        'endpoints': [
            '/health',
            '/predict/entry-fee',
            '/predict/registration',
            '/predict/sponsor-roi',
        ],
    })

# ── Health check ──────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({ 'status': 'ok', 'service': 'Sportfolio ML' })

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

        prediction  = predict_entry_fee(data)
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

        prediction  = predict_registration(data)
        explanation = get_registration_explanation(prediction)
        prediction['gemini'] = explanation

        return jsonify({ 'success': True, 'data': prediction })

    except FileNotFoundError as e:
        return jsonify({ 'error': str(e), 'hint': 'Run train_model.py first' }), 503
    except Exception as e:
        print(f"Registration prediction error: {e}")
        return jsonify({ 'error': str(e) }), 500

# ── Sponsor ROI ───────────────────────────────────────────────────────
@app.route('/predict/sponsor-roi', methods=['POST'])
def sponsor_roi():
    try:
        data = request.get_json()
        required = ['sport', 'city_tier', 'num_teams', 'num_matches',
                    'venue_capacity', 'team_size', 'tournament_days',
                    'has_existing_sponsor', 'format', 'sponsorship_tier']
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({ 'error': f"Missing fields: {', '.join(missing)}" }), 400

        prediction  = predict_sponsor_roi(data)
        explanation = get_roi_explanation(prediction)
        prediction['gemini'] = explanation

        return jsonify({ 'success': True, 'data': prediction })

    except FileNotFoundError as e:
        return jsonify({ 'error': str(e), 'hint': 'Run train_model.py first' }), 503
    except Exception as e:
        print(f"Sponsor ROI prediction error: {e}")
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

Return ONLY a valid JSON object (no markdown, no backticks):
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
    inp        = prediction['input_summary']
    pred       = prediction['prediction']
    confidence = prediction['confidence']
    current    = prediction['current_registrations']
    max_teams  = prediction['max_teams']
    projected  = prediction['projected_registrations']
    days_left  = prediction['days_remaining']
    fill_pct   = prediction['fill_percentage']

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

Return ONLY a valid JSON object (no markdown, no backticks):
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

# ── Gemini — Sponsor ROI Explanation ─────────────────────────────────
def get_roi_explanation(prediction: dict) -> dict:
    inp     = prediction['input_summary']
    reach   = prediction['estimated_reach']
    cpp     = prediction['cost_per_person']
    rating  = prediction['roi_rating']
    tier    = inp['tier']
    amount  = prediction['tier_amount']
    breakdown = prediction['reach_breakdown']

    city_labels = {1: 'Tier 1 (Mumbai/Delhi)', 2: 'Tier 2 (Pune/Surat)', 3: 'Tier 3'}
    city_label  = city_labels.get(inp['city_tier'], str(inp['city_tier']))

    rating_labels = {
        'excellent': '🟢 Excellent ROI',
        'good':      '🔵 Good ROI',
        'fair':      '🟡 Fair ROI',
        'poor':      '🔴 Poor ROI',
    }
    rating_label = rating_labels.get(rating, rating)

    prompt = f"""
You are a sports sponsorship ROI analyst in India.
An XGBoost ML model predicted the audience reach for a local sports tournament sponsorship.
Generate a structured JSON report the organiser can share with potential sponsors.

Tournament profile:
- Sport: {inp['sport'].title()}
- City: {city_label}
- Format: {inp['format']}
- Teams: {inp['num_teams']}
- Matches: {inp['num_matches']}
- Venue capacity: {inp['venue_capacity']} spectators
- Tournament days: {inp['tournament_days']}
- Existing sponsor: {'Yes' if inp['has_sponsor'] else 'No'}

Sponsorship details:
- Tier: {tier.title()}
- Investment: ₹{amount:,}

ML Model Output:
- Estimated reach: {reach:,} people
- Cost per person: ₹{cpp}
- ROI Rating: {rating_label}

Reach breakdown:
- Players + teams: {breakdown['players']:,}
- Family spectators: {breakdown['family']:,}
- Venue spectators: {breakdown['venue_spectators']:,}
- Social media: {breakdown['social_media']:,}
- Word of mouth: {breakdown['word_of_mouth']:,}

Return ONLY a valid JSON object (no markdown, no backticks):
{{
  "headline": "punchy ROI headline to show sponsor (max 10 words)",
  "summary": "2 sentences pitch-ready summary the organiser can send to the sponsor",
  "roi_verdict": "{rating_label}",
  "key_metrics": [
    {{"icon": "👥", "label": "Total Reach", "value": "{reach:,} people", "detail": "insight about what this reach means"}},
    {{"icon": "💰", "label": "Cost Per Person", "value": "₹{cpp}", "detail": "how this compares to digital advertising"}},
    {{"icon": "🏟️", "label": "Venue Exposure", "value": "{breakdown['venue_spectators']:,} spectators", "detail": "live audience insight"}},
    {{"icon": "📱", "label": "Social Reach", "value": "{breakdown['social_media']:,} people", "detail": "online amplification insight"}}
  ],
  "pitch_line": "one powerful sentence the organiser can use when pitching to sponsor",
  "comparison": "how this deal compares to digital advertising or similar sponsorships in India",
  "risk_flag": null
}}
Return ONLY the JSON. No markdown. No backticks. No extra text.
"""
    return _call_gemini(prompt, _fallback_roi(prediction))

# ── Gemini helper ─────────────────────────────────────────────────────
def _call_gemini(prompt: str, fallback: dict) -> dict:
    if gemini_model is None:
        return fallback
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
            {'icon': '🏟️', 'label': 'Venue Recovery', 'value': f'₹{venue_per_team:,}/team', 'insight': f'₹{int(inp["venue_cost"]):,} splits to ₹{venue_per_team:,} per team'},
            {'icon': '📍', 'label': 'City Tier',       'value': f'Tier {inp["city_tier"]}',  'insight': f'Tier {inp["city_tier"]} pricing factored in'},
            {'icon': '💼', 'label': 'Sponsor',          'value': '−15%' if inp['has_sponsor'] else 'None', 'insight': 'Sponsor reduces required fee' if inp['has_sponsor'] else 'No sponsor'},
            {'icon': '🏆', 'label': 'Prize Pool',       'value': f'{int(inp["prize_percentage"])}%', 'insight': f'₹{round(suggested * inp["max_teams"] * inp["prize_percentage"] / 100):,} goes to prize pool'},
        ],
        'market_context': f'Similar {inp["sport"]} tournaments in Tier {inp["city_tier"]} cities charge ₹{prediction["min_fee"]:,}–₹{prediction["max_fee"]:,}.',
        'risk_flag': None,
        'tip': f'You need {round(inp["venue_cost"] / suggested)} teams to break even out of {inp["max_teams"]} slots.',
    }

def _fallback_registration(prediction: dict) -> dict:
    pred    = prediction['prediction']
    current = prediction['current_registrations']
    max_t   = prediction['max_teams']
    days    = prediction['days_remaining']
    actions = {
        'will_fill':      'Keep momentum — send a WhatsApp update to spread the word.',
        'wont_fill':      f'Act now — broadcast immediately. Consider reducing entry fee to attract the remaining {max_t - current} teams.',
        'oversubscribed': 'Start a waitlist and consider expanding slots if venue allows.',
    }
    return {
        'headline': f"{'On track' if pred == 'will_fill' else 'At risk' if pred == 'wont_fill' else 'Oversubscribed'} — {current}/{max_t} teams",
        'summary':  f"Currently at {current} of {max_t} teams with {days} days remaining.",
        'status_color': 'green' if pred == 'will_fill' else 'red' if pred == 'wont_fill' else 'blue',
        'insights': [
            {'icon': '📈', 'label': 'Current Fill',   'value': f'{prediction["fill_percentage"]}%',               'detail': f'{current} of {max_t} slots filled'},
            {'icon': '🎯', 'label': 'Projected',      'value': f'{prediction["projected_registrations"]}/{max_t}', 'detail': 'Expected final registrations'},
            {'icon': '⏰', 'label': 'Time Remaining', 'value': f'{days} days',                                     'detail': 'Days until registration closes'},
            {'icon': '💰', 'label': 'Entry Fee',      'value': f'₹{int(prediction["input_summary"]["entry_fee"]):,}', 'detail': 'Higher fees slow registrations'},
        ],
        'action':    actions.get(pred, 'Monitor registrations daily.'),
        'risk_flag': None,
    }

def _fallback_roi(prediction: dict) -> dict:
    reach   = prediction['estimated_reach']
    cpp     = prediction['cost_per_person']
    rating  = prediction['roi_rating']
    tier    = prediction['input_summary']['tier']
    amount  = prediction['tier_amount']
    breakdown = prediction['reach_breakdown']

    rating_labels = {'excellent': '🟢 Excellent', 'good': '🔵 Good', 'fair': '🟡 Fair', 'poor': '🔴 Poor'}

    return {
        'headline': f"Reach {reach:,} people for ₹{amount:,}",
        'summary':  f"Your {tier.title()} sponsorship is estimated to reach {reach:,} people at ₹{cpp} per person.",
        'roi_verdict': rating_labels.get(rating, rating),
        'key_metrics': [
            {'icon': '👥', 'label': 'Total Reach',     'value': f'{reach:,} people',                      'detail': 'Estimated unique audience'},
            {'icon': '💰', 'label': 'Cost Per Person', 'value': f'₹{cpp}',                                'detail': 'Investment per person reached'},
            {'icon': '🏟️', 'label': 'Venue Exposure',  'value': f'{breakdown["venue_spectators"]:,}',     'detail': 'Live audience at venue'},
            {'icon': '📱', 'label': 'Social Reach',    'value': f'{breakdown["social_media"]:,} people',  'detail': 'Online amplification'},
        ],
        'pitch_line': f"For ₹{amount:,}, your brand reaches {reach:,} sports enthusiasts at just ₹{cpp} per person.",
        'comparison': f'Facebook ads in India cost ₹5-15 per person. At ₹{cpp}/person, this sponsorship offers {"better" if cpp < 15 else "comparable"} value with offline brand presence.',
        'risk_flag': None,
    }

# NOTE: this block only runs if app.py is executed directly.
# In both local dev and on Render, run.py is the actual entry point
# (it reads PORT from the environment and starts the server),
# so this fallback is kept simple and is not used in normal operation.
if __name__ == '__main__':
    local_port = int(os.environ.get('PORT', 5050))
    print(f"🚀 Starting Sportfolio ML Service on port {local_port}")
    app.run(host='0.0.0.0', port=local_port, debug=False)