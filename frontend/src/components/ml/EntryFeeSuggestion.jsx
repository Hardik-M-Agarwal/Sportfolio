import { useState } from 'react';
import mlService from '../../services/mlService';

export default function EntryFeeSuggestion({ formData, onUseFee }) {
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');
  const [expanded, setExpanded] = useState(null);

  const canPredict =
    formData.sport &&
    formData.cityTier &&
    formData.venueCost &&
    formData.maxTeams;

  const handlePredict = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await mlService.predictEntryFee({
        sport:            formData.sport,
        city_tier:        formData.cityTier,
        venue_cost:       formData.venueCost,
        max_teams:        formData.maxTeams,
        team_size:        formData.teamSize || 11,
        format:           formData.format || 'knockout',
        has_sponsor:      formData.hasSponsorship || false,
        prize_percentage: formData.prizePercentage || 60,
        tournament_days:  formData.tournamentDays || 1,
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get prediction. Make sure the ML service is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseFee = () => {
    if (result) onUseFee(result.suggested_fee);
  };

  const confidenceColor = {
    high:   'text-emerald-600 bg-emerald-50',
    medium: 'text-amber-600 bg-amber-50',
    low:    'text-red-500 bg-red-50',
  };

  return (
    <div className="border border-blue-200 bg-blue-50/40 rounded-2xl p-5 mt-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm flex-shrink-0">
          🤖
        </div>
        <div>
          <h3 className="text-sm font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
            AI Entry Fee Suggestion
          </h3>
          <p className="text-xs text-gray-400">XGBoost + Gemini powered recommendation</p>
        </div>
      </div>

      {/* Predict button */}
      {!result && !loading && (
        <button
          onClick={handlePredict}
          disabled={!canPredict}
          className="w-full py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {canPredict ? '✨ Get AI Suggestion' : 'Fill sport, city, venue cost & max teams first'}
        </button>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-6 gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Analyzing tournament parameters...</p>
          <p className="text-xs text-gray-400">Running XGBoost model + Gemini explanation</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
          <button onClick={handlePredict} className="block mt-2 text-xs font-semibold text-red-700 underline">
            Try again
          </button>
        </div>
      )}

      {/* Result */}
      {result && result.gemini && (
        <div className="flex flex-col gap-4">

          {/* Fee + confidence */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-3xl font-black text-blue-600 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                ₹{result.suggested_fee.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                Range: ₹{result.min_fee.toLocaleString('en-IN')} — ₹{result.max_fee.toLocaleString('en-IN')}
              </div>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full capitalize ${confidenceColor[result.confidence]}`}>
              {result.confidence} confidence
            </span>
          </div>

          {/* Gemini headline + summary */}
          <div className="bg-white border border-blue-100 rounded-xl p-4">
            <h4 className="text-sm font-black text-gray-900 mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
              {result.gemini.headline}
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">{result.gemini.summary}</p>
          </div>

          {/* Breakdown */}
          {result.gemini.breakdown && (
            <div className="flex flex-col gap-2">
              {result.gemini.breakdown.map((item, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-100 rounded-xl px-4 py-3 cursor-pointer hover:border-blue-200 transition-colors"
                  onClick={() => setExpanded(expanded === i ? null : i)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.icon}</span>
                      <span className="text-xs font-semibold text-gray-700">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-blue-600" style={{ fontFamily: "'Syne', sans-serif" }}>
                        {item.value}
                      </span>
                      <svg
                        className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expanded === i ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {expanded === i && (
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed border-t border-gray-50 pt-2">
                      {item.insight}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Market context */}
          {result.gemini.market_context && (
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">📊 Market Context</p>
              <p className="text-xs text-gray-500 leading-relaxed">{result.gemini.market_context}</p>
            </div>
          )}

          {/* Risk flag */}
          {result.gemini.risk_flag && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-700 leading-relaxed">{result.gemini.risk_flag}</p>
            </div>
          )}

          {/* Tip */}
          {result.gemini.tip && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-emerald-600 mb-1">💡 Tip</p>
              <p className="text-xs text-emerald-700 leading-relaxed">{result.gemini.tip}</p>
            </div>
          )}

          {/* Model metrics */}
          {result.model_metrics?.r2_score && (
            <div className="border border-gray-100 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Model Performance</p>
              <div className="flex gap-4">
                <div>
                  <div className="text-sm font-black text-gray-700" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {(result.model_metrics.r2_score * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">R² Score</div>
                </div>
                <div>
                  <div className="text-sm font-black text-gray-700" style={{ fontFamily: "'Syne', sans-serif" }}>
                    ₹{Math.round(result.model_metrics.rmse).toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-gray-400">RMSE</div>
                </div>
                <div>
                  <div className="text-sm font-black text-gray-700" style={{ fontFamily: "'Syne', sans-serif" }}>
                    ₹{Math.round(result.model_metrics.mae).toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-gray-400">MAE</div>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleUseFee}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
            >
              ✓ Use ₹{result.suggested_fee.toLocaleString('en-IN')}
            </button>
            <button
              onClick={() => { setResult(null); setError(''); }}
              className="px-4 py-2.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}