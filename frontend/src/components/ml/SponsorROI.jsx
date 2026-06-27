import { useState, useCallback } from 'react';
import mlService from '../../services/mlService';

const TIERS = [
  { value: 'platinum', label: 'Platinum', amount: '₹50,000', color: 'border-purple-400 bg-purple-50 text-purple-600', badge: 'bg-purple-100 text-purple-700' },
  { value: 'gold',     label: 'Gold',     amount: '₹25,000', color: 'border-yellow-400 bg-yellow-50 text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' },
  { value: 'silver',   label: 'Silver',   amount: '₹15,000', color: 'border-gray-300 bg-gray-50 text-gray-600',       badge: 'bg-gray-100 text-gray-700' },
  { value: 'bronze',   label: 'Bronze',   amount: '₹7,000',  color: 'border-orange-300 bg-orange-50 text-orange-600', badge: 'bg-orange-100 text-orange-700' },
];

const ROI_RATING = {
  excellent: { label: '🟢 Excellent ROI', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  good:      { label: '🔵 Good ROI',      color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200' },
  fair:      { label: '🟡 Fair ROI',      color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
  poor:      { label: '🔴 Poor ROI',      color: 'text-red-500',     bg: 'bg-red-50 border-red-200' },
};

export default function SponsorROI({ tournament, teams, matches, sponsorships }) {
  const [selectedTier, setSelectedTier] = useState('gold');
  const [loading, setLoading]           = useState(false);
  const [result, setResult]             = useState(null);
  const [error, setError]               = useState('');

  const getCityTier = useCallback(() => {
    const tier1 = ['mumbai', 'delhi', 'bangalore', 'bengaluru', 'chennai', 'hyderabad', 'kolkata'];
    const tier2 = ['pune', 'surat', 'nagpur', 'jaipur', 'lucknow', 'kanpur', 'ahmedabad', 'indore'];
    const city  = tournament?.venue?.city?.toLowerCase() || '';
    if (tier1.some((c) => city.includes(c))) return 1;
    if (tier2.some((c) => city.includes(c))) return 2;
    return 3;
  }, [tournament]);

  const getTournamentDays = useCallback(() => {
    if (!tournament?.startDate || !tournament?.endDate) return 1;
    const start = new Date(tournament.startDate);
    const end   = new Date(tournament.endDate);
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
  }, [tournament]);

  const fetchROI = useCallback(async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const registeredTeams = teams?.filter((t) => !t.isWaitlisted) || [];
      const response = await mlService.predictSponsorROI({
        sport:                tournament.sport,
        city_tier:            getCityTier(),
        num_teams:            registeredTeams.length || tournament.maxTeams,
        num_matches:          matches?.length || 0,
        venue_capacity:       tournament.venue?.capacity || 300,
        team_size:            tournament.sportConfig?.teamSize || 11,
        tournament_days:      getTournamentDays(),
        has_existing_sponsor: (sponsorships || []).length > 0 ? 1 : 0,
        format:               tournament.format,
        sponsorship_tier:     selectedTier,
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get ROI estimate. Make sure ML service is running.');
    } finally {
      setLoading(false);
    }
  }, [tournament, teams, matches, sponsorships, selectedTier, getCityTier, getTournamentDays]);

  const ratingConfig       = result ? ROI_RATING[result.roi_rating] || ROI_RATING.fair : null;
  const selectedTierConfig = TIERS.find((t) => t.value === selectedTier);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white text-lg flex-shrink-0">
          💼
        </div>
        <div>
          <h3 className="text-lg font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
            Sponsor ROI Estimator
          </h3>
          <p className="text-xs text-gray-400">XGBoost Regressor · Predicts audience reach per sponsorship tier</p>
        </div>
      </div>

      {/* Tournament snapshot */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Teams',    value: teams?.filter((t) => !t.isWaitlisted).length || tournament?.maxTeams },
          { label: 'Matches',  value: matches?.length || 0 },
          { label: 'Capacity', value: tournament?.venue?.capacity ? tournament.venue.capacity.toLocaleString('en-IN') : 'N/A' },
        ].map((s) => (
          <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tier selector */}
      <div className="mb-5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
          Select Sponsorship Tier to Estimate
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TIERS.map((tier) => (
            <button
              key={tier.value}
              onClick={() => { setSelectedTier(tier.value); setResult(null); setError(''); }}
              className={`py-3 px-4 rounded-xl border-2 text-left transition-all
                ${selectedTier === tier.value ? tier.color : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
            >
              <div className="text-sm font-black capitalize" style={{ fontFamily: "'Syne', sans-serif" }}>
                {tier.label}
              </div>
              <div className="text-xs mt-0.5 opacity-70">{tier.amount}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Predict button */}
      {!loading && (
        <button
          onClick={fetchROI}
          className="w-full py-3 text-sm font-semibold text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-colors mb-4 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {result ? `Re-run for ${selectedTierConfig?.label}` : `Estimate ${selectedTierConfig?.label} ROI`}
        </button>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-8 gap-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Running XGBoost regressor...</p>
          <p className="text-xs text-gray-400">Estimating audience reach + Gemini ROI report</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      {/* Result */}
      {result && ratingConfig && !loading && (
        <div className="flex flex-col gap-4">

          {/* Main result card */}
          <div className={`border rounded-2xl p-5 ${ratingConfig.bg}`}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <div className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {result.estimated_reach.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">estimated people reached</div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-black ${ratingConfig.color}`}>{ratingConfig.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">₹{result.cost_per_person} per person</div>
              </div>
            </div>
            {result.gemini && (
              <>
                <h4 className="text-sm font-black text-gray-900 mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {result.gemini.headline}
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">{result.gemini.summary}</p>
              </>
            )}
          </div>

          {/* Reach breakdown */}
          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Reach Breakdown</p>
            {[
              { icon: '👥', label: 'Players + Teams',    value: result.reach_breakdown.players },
              { icon: '👨‍👩‍👧', label: 'Family Spectators', value: result.reach_breakdown.family },
              { icon: '🏟️', label: 'Venue Spectators',   value: result.reach_breakdown.venue_spectators },
              { icon: '📱', label: 'Social Media',       value: result.reach_breakdown.social_media },
              { icon: '🗣️', label: 'Word of Mouth',      value: result.reach_breakdown.word_of_mouth },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 mb-2">
                <span className="text-base w-6 flex-shrink-0">{item.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500 font-medium">{item.label}</span>
                    <span className="font-bold text-gray-700">{item.value.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${Math.min((item.value / result.estimated_reach) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Gemini key metrics */}
          {result.gemini?.key_metrics && (
            <div className="flex flex-col gap-2">
              {result.gemini.key_metrics.map((metric, i) => (
                <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-base flex-shrink-0">{metric.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-600">{metric.label}</span>
                      <span className="text-xs font-black text-gray-900 flex-shrink-0" style={{ fontFamily: "'Syne', sans-serif" }}>
                        {metric.value}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{metric.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pitch line */}
          {result.gemini?.pitch_line && (
            <div className="bg-gray-900 rounded-xl px-5 py-4">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                💬 Pitch Line (copy this)
              </p>
              <p className="text-sm text-white leading-relaxed italic">
                "{result.gemini.pitch_line}"
              </p>
            </div>
          )}

          {/* Comparison */}
          {result.gemini?.comparison && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-blue-600 mb-1">📊 vs Digital Advertising</p>
              <p className="text-xs text-gray-600 leading-relaxed">{result.gemini.comparison}</p>
            </div>
          )}

          {/* Risk flag */}
          {result.gemini?.risk_flag && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-700">{result.gemini.risk_flag}</p>
            </div>
          )}

          {/* Model metrics */}
          {result.model_metrics?.reach_r2 && (
            <div className="border border-gray-100 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Model Performance</p>
              <div className="flex gap-6">
                <div>
                  <div className="text-sm font-black text-gray-700" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {(result.model_metrics.reach_r2 * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">Reach R²</div>
                </div>
                <div>
                  <div className="text-sm font-black text-gray-700" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {(result.model_metrics.cpp_r2 * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">CPP R²</div>
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