import { useState, useCallback } from 'react';
import mlService from '../../services/mlService';

const predictionConfig = {
  will_fill: {
    color:  'emerald',
    icon:   '✅',
    label:  'On Track to Fill',
    bg:     'bg-emerald-50',
    border: 'border-emerald-200',
    text:   'text-emerald-700',
    badge:  'bg-emerald-100 text-emerald-700',
  },
  wont_fill: {
    color:  'red',
    icon:   '⚠️',
    label:  'At Risk',
    bg:     'bg-red-50',
    border: 'border-red-200',
    text:   'text-red-700',
    badge:  'bg-red-100 text-red-600',
  },
  oversubscribed: {
    color:  'blue',
    icon:   '🔥',
    label:  'Oversubscribed',
    bg:     'bg-blue-50',
    border: 'border-blue-200',
    text:   'text-blue-700',
    badge:  'bg-blue-100 text-blue-700',
  },
};

export default function RegistrationForecast({ tournament, teams, sponsorships }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');

  const getDaysSinceOpen = useCallback(() => {
    if (!tournament?.registrationStartDate) return 1;
    const start = new Date(tournament.registrationStartDate);
    const now   = new Date();
    const diff  = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  }, [tournament]);

  const getTotalDays = useCallback(() => {
    if (!tournament?.registrationStartDate || !tournament?.registrationEndDate) return 7;
    const start = new Date(tournament.registrationStartDate);
    const end   = new Date(tournament.registrationEndDate);
    const diff  = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  }, [tournament]);

  const getTotalPrizePool = useCallback(() => {
    const base = Math.round(
      tournament.entryFee * tournament.maxTeams * (tournament.prizeStructure?.percentage || 60) / 100
    );
    const sponsorContrib = (sponsorships || []).reduce((sum, s) => sum + (s.prizeContribution || 0), 0);
    return base + sponsorContrib;
  }, [tournament, sponsorships]);

  const getCityTier = useCallback(() => {
    const tier1 = ['mumbai', 'delhi', 'bangalore', 'bengaluru', 'chennai', 'hyderabad', 'kolkata'];
    const tier2 = ['pune', 'surat', 'nagpur', 'jaipur', 'lucknow', 'kanpur', 'ahmedabad', 'indore'];
    const city  = tournament?.venue?.city?.toLowerCase() || '';
    if (tier1.some((c) => city.includes(c))) return 1;
    if (tier2.some((c) => city.includes(c))) return 2;
    return 3;
  }, [tournament]);

  const fetchPrediction = useCallback(async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await mlService.predictRegistration({
        sport:                 tournament.sport,
        city_tier:             getCityTier(),
        current_registrations: teams?.filter((t) => !t.isWaitlisted).length || 0,
        days_since_open:       getDaysSinceOpen(),
        total_days_available:  getTotalDays(),
        max_teams:             tournament.maxTeams,
        entry_fee:             tournament.entryFee,
        prize_pool:            getTotalPrizePool(),
        has_sponsor:           (sponsorships || []).length > 0 ? 1 : 0,
        format:                tournament.format,
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get forecast. Make sure ML service is running.');
    } finally {
      setLoading(false);
    }
  }, [tournament, teams, sponsorships, getCityTier, getDaysSinceOpen, getTotalDays, getTotalPrizePool]);

  const registeredTeams = teams?.filter((t) => !t.isWaitlisted).length || 0;
  const config = result ? predictionConfig[result.prediction] : null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white text-lg flex-shrink-0">
          📊
        </div>
        <div>
          <h3 className="text-lg font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
            Registration Forecaster
          </h3>
          <p className="text-xs text-gray-400">XGBoost Classifier · Trained on 50,000 records</p>
        </div>
      </div>

      {/* Current snapshot */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Registered',      value: `${registeredTeams} / ${tournament?.maxTeams}` },
          { label: 'Days Since Open', value: getDaysSinceOpen() },
          { label: 'Days Left',       value: Math.max(0, getTotalDays() - getDaysSinceOpen()) },
        ].map((s) => (
          <div key={s.label} className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
              {s.value}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Fill progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>Registration progress</span>
          <span>{Math.round(registeredTeams / (tournament?.maxTeams || 1) * 100)}% full</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 rounded-full transition-all"
            style={{ width: `${Math.min(registeredTeams / (tournament?.maxTeams || 1) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Predict button */}
      {!loading && (
        <button
          onClick={fetchPrediction}
          className="w-full py-3 text-sm font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors mb-4 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {result ? 'Re-run Forecast' : 'Run Registration Forecast'}
        </button>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-8 gap-3">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Running XGBoost classifier...</p>
          <p className="text-xs text-gray-400">Analyzing registration patterns + Gemini explanation</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      {/* Result */}
      {result && config && !loading && (
        <div className="flex flex-col gap-4">

          {/* Prediction badge */}
          <div className={`${config.bg} ${config.border} border rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{config.icon}</span>
                <span className={`text-lg font-black ${config.text}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                  {config.label}
                </span>
              </div>
              <span className={`text-sm font-black px-3 py-1 rounded-full ${config.badge}`}>
                {result.confidence}% confident
              </span>
            </div>
            {result.gemini && (
              <>
                <h4 className={`text-sm font-black mb-1 ${config.text}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                  {result.gemini.headline}
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">{result.gemini.summary}</p>
              </>
            )}
          </div>

          {/* Class probabilities */}
          {result.class_probabilities && (
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Prediction Probabilities
              </p>
              {Object.entries(result.class_probabilities)
                .sort((a, b) => b[1] - a[1])
                .map(([cls, prob]) => {
                  const cfg = predictionConfig[cls];
                  const barColors = {
                    will_fill:      'bg-emerald-500',
                    wont_fill:      'bg-red-400',
                    oversubscribed: 'bg-blue-500',
                  };
                  return (
                    <div key={cls} className="mb-2.5">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500 font-medium">{cfg?.icon} {cfg?.label || cls}</span>
                        <span className="font-bold text-gray-700">{prob}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColors[cls] || 'bg-gray-400'}`}
                          style={{ width: `${prob}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Gemini insights */}
          {result.gemini?.insights && (
            <div className="flex flex-col gap-2">
              {result.gemini.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-base flex-shrink-0">{insight.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-600">{insight.label}</span>
                      <span className="text-xs font-black text-gray-900 flex-shrink-0" style={{ fontFamily: "'Syne', sans-serif" }}>
                        {insight.value}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{insight.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action */}
          {result.gemini?.action && (
            <div className="bg-gray-900 rounded-xl px-5 py-4">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                💡 Recommended Action
              </p>
              <p className="text-sm text-white leading-relaxed">{result.gemini.action}</p>
            </div>
          )}

          {/* Risk flag */}
          {result.gemini?.risk_flag && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-700">{result.gemini.risk_flag}</p>
            </div>
          )}

          {/* Model metrics */}
          {result.model_metrics?.accuracy && (
            <div className="border border-gray-100 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Model Performance</p>
              <div className="flex gap-6">
                <div>
                  <div className="text-sm font-black text-gray-700" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {(result.model_metrics.accuracy * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">Accuracy</div>
                </div>
                <div>
                  <div className="text-sm font-black text-gray-700" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {(result.model_metrics.f1_score * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">F1 Score</div>
                </div>
                <div>
                  <div className="text-sm font-black text-gray-700" style={{ fontFamily: "'Syne', sans-serif" }}>50K</div>
                  <div className="text-xs text-gray-400">Training records</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}