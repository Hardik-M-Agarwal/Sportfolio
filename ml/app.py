"""
Sportfolio ML Service
Single Flask app serving all 3 ML models
Port: 5050
"""

import os
import json
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
from entry_fee.predictor import predict_entry_fee

app = Flask(__name__)
CORS(app)

# configure Gemini
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
gemini_model = genai.GenerativeModel('gemini-1.5-flash')

# ── Health check ──────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({ 'status': 'ok', 'service': 'Sportfolio ML' })

# ── Entry Fee Prediction ──────────────────────────────────────────────
@app.route('/predict/entry-fee', methods=['POST'])
def entry_fee():
    try:
        data = request.get_json()

        # validate required fields
        required = ['sport', 'city_tier', 'venue_cost', 'max_teams',
                    'team_size', 'format', 'has_sponsor',
                    'prize_percentage', 'tournament_days']
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({
                'error': f"Missing fields: {', '.join(missing)}"
            }), 400

        # get ML prediction
        prediction = predict_entry_fee(data)

        # get Gemini explanation
        explanation = get_gemini_explanation(prediction)
        prediction['gemini'] = explanation

        return jsonify({ 'success': True, 'data': prediction })

    except FileNotFoundError as e:
        return jsonify({ 'error': str(e), 'hint': 'Run train_model.py first' }), 503
    except ValueError as e:
        return jsonify({ 'error': f'Invalid input: {str(e)}' }), 400
    except Exception as e:
        print(f"Entry fee prediction error: {e}")
        return jsonify({ 'error': str(e) }), 500

# ── Gemini Explanation ────────────────────────────────────────────────
def get_gemini_explanation(prediction: dict) -> dict:
    inp = prediction['input_summary']
    suggested = prediction['suggested_fee']
    min_fee   = prediction['min_fee']
    max_fee   = prediction['max_fee']
    confidence = prediction['confidence']

    city_labels = {1: 'Tier 1 (Mumbai/Delhi/Bangalore)', 2: 'Tier 2 (Pune/Surat/Nagpur)', 3: 'Tier 3 (smaller cities)'}
    city_label  = city_labels.get(inp['city_tier'], str(inp['city_tier']))

    venue_per_team  = round(inp['venue_cost'] / inp['max_teams'])
    total_revenue   = suggested * inp['max_teams']
    breakeven_teams = max(1, round(inp['venue_cost'] / suggested))

    prompt = f"""
You are a sports tournament financial advisor in India with deep knowledge of local tournament economics.

An XGBoost ML model predicted the optimal entry fee for a local sports tournament.
Generate a structured JSON explanation that will be shown to the tournament organiser.

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

Return ONLY a valid JSON object with this EXACT structure (no markdown, no backticks, no extra text):
{{
  "headline": "short punchy title about the suggested fee (max 8 words)",
  "summary": "2 sentences explaining why this fee makes sense for this specific tournament. Be specific with numbers.",
  "breakdown": [
    {{
      "icon": "🏟️",
      "label": "Venue Recovery",
      "value": "₹{venue_per_team:,}/team",
      "insight": "specific one-line insight about venue cost impact"
    }},
    {{
      "icon": "📍",
      "label": "City Premium",
      "value": "relevant value or percentage",
      "insight": "specific insight about city tier pricing"
    }},
    {{
      "icon": "🏆",
      "label": "Format Factor",
      "value": "relevant value",
      "insight": "insight about how the format affects costs"
    }},
    {{
      "icon": "💼",
      "label": "{'Sponsor Benefit' if inp['has_sponsor'] else 'No Sponsor'}",
      "value": "relevant value or percentage",
      "insight": "insight about sponsor impact on entry fee"
    }}
  ],
  "market_context": "one paragraph comparing this fee to similar tournaments in India. Use realistic market knowledge.",
  "risk_flag": null,
  "tip": "one specific actionable financial tip for this organiser based on their numbers"
}}

Rules:
- risk_flag should be a warning string ONLY if the fee seems problematic (too high for the market, or below cost recovery). Otherwise null.
- All rupee values must use Indian number formatting (₹2,500 not $2500)
- Be specific — use actual numbers from the tournament details
- Keep insights concise and practical
- Return ONLY the JSON object, nothing else
"""

    try:
        response = gemini_model.generate_content(prompt)
        text = response.text.strip()

        # clean up response
        if text.startswith('```'):
            text = text.split('```')[1]
            if text.startswith('json'):
                text = text[4:]
        text = text.strip()

        parsed = json.loads(text)
        return parsed

    except json.JSONDecodeError as e:
        print(f"Gemini JSON parse error: {e}")
        print(f"Raw response: {response.text[:500]}")
        return _fallback_explanation(prediction)
    except Exception as e:
        print(f"Gemini error: {e}")
        return _fallback_explanation(prediction)

def _fallback_explanation(prediction: dict) -> dict:
    """Fallback if Gemini fails"""
    inp = prediction['input_summary']
    suggested = prediction['suggested_fee']
    venue_per_team = round(inp['venue_cost'] / inp['max_teams'])

    return {
        'headline': f"₹{suggested:,} is your recommended entry fee",
        'summary': f"Based on your venue cost of ₹{int(inp['venue_cost']):,} across {inp['max_teams']} teams, ₹{suggested:,} per team ensures cost recovery. With a full tournament, you'll collect ₹{suggested * inp['max_teams']:,} in entry fees.",
        'breakdown': [
            {
                'icon': '🏟️',
                'label': 'Venue Recovery',
                'value': f'₹{venue_per_team:,}/team',
                'insight': f'Your ₹{int(inp["venue_cost"]):,} venue cost splits to ₹{venue_per_team:,} per team'
            },
            {
                'icon': '📍',
                'label': 'City Tier',
                'value': f'Tier {inp["city_tier"]}',
                'insight': f'Tier {inp["city_tier"]} city pricing has been factored in'
            },
            {
                'icon': '💼',
                'label': 'Sponsor Impact',
                'value': '−15%' if inp['has_sponsor'] else 'None',
                'insight': 'Sponsor subsidy reduces required entry fee' if inp['has_sponsor'] else 'No sponsor — full cost recovered from entry fees'
            },
            {
                'icon': '🏆',
                'label': 'Prize Pool',
                'value': f'{int(inp["prize_percentage"])}%',
                'insight': f'₹{round(suggested * inp["max_teams"] * inp["prize_percentage"] / 100):,} goes to prize pool'
            },
        ],
        'market_context': f'Similar {inp["sport"]} tournaments in Tier {inp["city_tier"]} cities typically charge between ₹{prediction["min_fee"]:,} and ₹{prediction["max_fee"]:,}.',
        'risk_flag': None,
        'tip': f'You need {round(inp["venue_cost"] / suggested)} teams to break even. With {inp["max_teams"]} teams registered, you\'ll have a healthy surplus.'
    }

if __name__ == '__main__':
    print("🚀 Starting Sportfolio ML Service on port 5050")
    app.run(port=5050, debug=False)