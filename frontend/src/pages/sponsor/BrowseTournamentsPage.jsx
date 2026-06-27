import { useState, useEffect, useCallback } from 'react';
import SponsorLayout from '../../layouts/SponsorLayout';
import SponsorshipModal from '../../components/sponsorships/SponsorshipModal';
import tournamentService from '../../services/tournamentService';
import sponsorshipService from '../../services/sponsorshipService';
import api from '../../services/api';

const sportEmoji = {
  cricket: '🏏', football: '⚽', badminton: '🏸',
  kabaddi: '🤼', basketball: '🏀', volleyball: '🏐',
};

const statusColor = {
  upcoming:     'bg-gray-100 text-gray-500',
  registration: 'bg-blue-100 text-blue-600',
  ongoing:      'bg-emerald-100 text-emerald-600',
  completed:    'bg-purple-100 text-purple-600',
};

const tierInfo = {
  platinum: { color: 'bg-purple-100 text-purple-700 border-purple-300', amount: 50000 },
  gold:     { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', amount: 25000 },
  silver:   { color: 'bg-gray-100 text-gray-600 border-gray-300',       amount: 15000 },
  bronze:   { color: 'bg-orange-100 text-orange-700 border-orange-300', amount: 7000 },
};

const ROI_RATING_COLOR = {
  excellent: 'text-emerald-600 bg-emerald-50',
  good:      'text-blue-600 bg-blue-50',
  fair:      'text-amber-600 bg-amber-50',
  poor:      'text-red-500 bg-red-50',
};

const ROI_RATING_LABEL = {
  excellent: '🟢 Excellent ROI',
  good:      '🔵 Good ROI',
  fair:      '🟡 Fair ROI',
  poor:      '🔴 Poor ROI',
};

const sports = ['all', 'cricket', 'football', 'badminton', 'kabaddi', 'basketball', 'volleyball'];

// ── ROI Preview Modal ─────────────────────────────────────────────────
function ROIModal({ tournament, tier, onClose, onProceed }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');

  const getCityTier = () => {
    const tier1 = ['mumbai', 'delhi', 'bangalore', 'bengaluru', 'chennai', 'hyderabad', 'kolkata'];
    const tier2 = ['pune', 'surat', 'nagpur', 'jaipur', 'lucknow', 'kanpur', 'ahmedabad', 'indore'];
    const city  = tournament?.venue?.city?.toLowerCase() || '';
    if (tier1.some((c) => city.includes(c))) return 1;
    if (tier2.some((c) => city.includes(c))) return 2;
    return 3;
  };

  const getTournamentDays = () => {
    if (!tournament?.startDate || !tournament?.endDate) return 1;
    const start = new Date(tournament.startDate);
    const end   = new Date(tournament.endDate);
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
  };

  const getNumMatches = () => {
    const n = tournament.maxTeams || 8;
    if (tournament.format === 'knockout') return n - 1;
    if (tournament.format === 'league') return n * (n - 1) / 2;
    return Math.floor(n * (n - 1) / 4) + Math.floor(n / 2) - 1;
  };

  useEffect(() => {
    const fetchROI = async () => {
      try {
        const response = await api.post('/ml/sponsor-roi', {
          sport:                tournament.sport,
          city_tier:            getCityTier(),
          num_teams:            tournament.registeredCount || tournament.maxTeams,
          num_matches:          getNumMatches(),
          venue_capacity:       tournament.venue?.capacity || 300,
          team_size:            tournament.sportConfig?.teamSize || 11,
          tournament_days:      getTournamentDays(),
          has_existing_sponsor: 0,
          format:               tournament.format,
          sponsorship_tier:     tier,
        });
        setResult(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load ROI estimate. ML service may not be running.');
      } finally {
        setLoading(false);
      }
    };
    fetchROI();
  }, []);

  const ratingColor = result ? ROI_RATING_COLOR[result.roi_rating] || ROI_RATING_COLOR.fair : '';
  const ratingLabel = result ? ROI_RATING_LABEL[result.roi_rating] || result.roi_rating : '';
  const amount      = tierInfo[tier]?.amount || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-900 capitalize" style={{ fontFamily: "'Syne', sans-serif" }}>
                {tier} Sponsorship ROI
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{tournament.name} · ₹{amount.toLocaleString('en-IN')}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center py-10 gap-3">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Estimating your ROI...</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4">
              {error}
              <p className="text-xs mt-1 text-red-400">You can still proceed with sponsorship below.</p>
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <div className="flex flex-col gap-4">

              {/* Main metric */}
              <div className={`rounded-2xl p-5 ${ratingColor}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                      {result.estimated_reach.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-gray-500">estimated people reached</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${ratingColor.split(' ')[0]}`}>{ratingLabel}</div>
                    <div className="text-xs text-gray-500 mt-0.5">₹{result.cost_per_person}/person</div>
                  </div>
                </div>
                {result.gemini?.headline && (
                  <p className="text-xs font-semibold text-gray-700 mt-2">{result.gemini.headline}</p>
                )}
              </div>

              {/* Reach breakdown */}
              <div className="border border-gray-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Where Your Brand Reaches</p>
                {[
                  { icon: '👥', label: 'Players + Teams',    value: result.reach_breakdown.players },
                  { icon: '👨‍👩‍👧', label: 'Family Spectators', value: result.reach_breakdown.family },
                  { icon: '🏟️', label: 'Venue Audience',     value: result.reach_breakdown.venue_spectators },
                  { icon: '📱', label: 'Social Media',       value: result.reach_breakdown.social_media },
                  { icon: '🗣️', label: 'Word of Mouth',      value: result.reach_breakdown.word_of_mouth },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{item.icon}</span>
                      <span className="text-xs text-gray-500">{item.label}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-700">{item.value.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              {/* Pitch line */}
              {result.gemini?.pitch_line && (
                <div className="bg-gray-900 rounded-xl px-4 py-3">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Your ROI in one line</p>
                  <p className="text-xs text-white italic">"{result.gemini.pitch_line}"</p>
                </div>
              )}

              {/* vs digital */}
              {result.gemini?.comparison && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <p className="text-xs text-blue-600 font-semibold mb-1">📊 vs Digital Advertising</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{result.gemini.comparison}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-5">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onProceed}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-colors"
            >
              Proceed to Sponsor →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function SponsorBrowseTournamentsPage() {
  const [tournaments, setTournaments]     = useState([]);
  const [mySponsorships, setMySponsorships] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filters, setFilters]             = useState({ sport: '', search: '' });
  const [selected, setSelected]           = useState(null);
  const [selectedTier, setSelectedTier]   = useState(null);
  const [showROI, setShowROI]             = useState(false);
  const [showModal, setShowModal]         = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v && v !== 'all')
      );
      const [tData, sData] = await Promise.all([
        tournamentService.getPublicTournaments(activeFilters),
        sponsorshipService.getMySponsorships(),
      ]);
      setTournaments(tData.tournaments);
      setMySponsorships(sData.sponsorships);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sponsoredMap = {};
  mySponsorships.forEach((s) => {
    const tid = s.tournamentId?._id?.toString();
    if (tid) {
      if (!sponsoredMap[tid]) sponsoredMap[tid] = [];
      sponsoredMap[tid].push(s.tier);
    }
  });

  const handleEstimateROI = (tournament, tier) => {
    setSelected(tournament);
    setSelectedTier(tier);
    setShowROI(true);
  };

  const handleProceedToSponsor = () => {
    setShowROI(false);
    setShowModal(true);
  };

  const handleSponsored = () => {
    setShowModal(false);
    setSelected(null);
    setSelectedTier(null);
    fetchData();
  };

  return (
    <SponsorLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
            Browse Tournaments
          </h1>
          <p className="text-gray-500 mt-1">Find tournaments to sponsor and grow your brand.</p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-48">
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-500 transition-all"
                placeholder="Search tournaments..."
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
            </div>
          </div>
          <select
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-500 transition-all bg-white"
            value={filters.sport}
            onChange={(e) => setFilters((f) => ({ ...f, sport: e.target.value === 'all' ? '' : e.target.value }))}
          >
            {sports.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All Sports' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tournaments.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-400 text-sm">No tournaments found.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {tournaments.map((t) => {
              const sponsoredTiers = sponsoredMap[t._id?.toString()] || [];
              return (
                <div key={t._id} className="bg-white border border-gray-200 rounded-xl p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{sportEmoji[t.sport]}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-xl text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                            {t.name}
                          </h3>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColor[t.status]}`}>
                            {t.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 capitalize mt-0.5">
                          {t.sport} · {t.format} · {t.venue?.name}, {t.venue?.city}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Teams registered</div>
                      <div className="text-lg font-black text-gray-700" style={{ fontFamily: "'Syne', sans-serif" }}>
                        {t.registeredCount} / {t.maxTeams}
                      </div>
                    </div>
                  </div>

                  {/* Organiser info */}
                  <div className="bg-gray-50 rounded-lg px-4 py-3 mb-5">
                    <p className="text-xs text-gray-400 mb-1">Organised by</p>
                    <p className="text-sm font-semibold text-gray-700">{t.organiserId?.name}</p>
                    <div className="flex gap-4 mt-0.5">
                      <p className="text-xs text-gray-400">{t.organiserId?.email}</p>
                      {t.organiserId?.phone && <p className="text-xs text-gray-400">{t.organiserId?.phone}</p>}
                    </div>
                  </div>

                  {/* Sponsorship tiers */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Available Sponsorship Tiers</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {t.sponsorshipTiers?.map((tier) => {
                        const info = tierInfo[tier];
                        const alreadySponsored = sponsoredTiers.includes(tier);
                        return (
                          <div
                            key={tier}
                            className={`border rounded-xl p-3 ${alreadySponsored ? 'opacity-60' : ''}`}
                          >
                            <div className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border inline-block mb-2 ${info.color}`}>
                              {tier}
                            </div>
                            <div className="text-base font-black text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                              ₹{info.amount.toLocaleString('en-IN')}
                            </div>

                            {alreadySponsored ? (
                              <button
                                disabled
                                className="w-full py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-600 cursor-not-allowed"
                              >
                                ✓ Sponsored
                              </button>
                            ) : (
                              <div className="flex flex-col gap-1.5">
                                <button
                                  onClick={() => handleEstimateROI(t, tier)}
                                  className="w-full py-1.5 rounded-lg text-xs font-semibold border border-amber-300 text-amber-600 hover:bg-amber-50 transition-colors"
                                >
                                  📊 View ROI
                                </button>
                                <button
                                  onClick={() => { setSelected(t); setSelectedTier(tier); setShowModal(true); }}
                                  className="w-full py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                                >
                                  Sponsor Now
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ROI Modal */}
      {showROI && selected && selectedTier && (
        <ROIModal
          tournament={selected}
          tier={selectedTier}
          onClose={() => { setShowROI(false); setSelected(null); setSelectedTier(null); }}
          onProceed={handleProceedToSponsor}
        />
      )}

      {/* Sponsorship Payment Modal */}
      {showModal && selected && selectedTier && (
        <SponsorshipModal
          tournament={selected}
          tier={selectedTier}
          onClose={() => { setShowModal(false); setSelected(null); setSelectedTier(null); }}
          onSponsored={handleSponsored}
        />
      )}
    </SponsorLayout>
  );
}