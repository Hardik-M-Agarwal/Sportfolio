import { useState, useEffect, useCallback } from 'react';
import SponsorLayout from '../../layouts/SponsorLayout';
import SponsorshipModal from '../../components/sponsorships/SponsorshipModal';
import tournamentService from '../../services/tournamentService';
import sponsorshipService from '../../services/sponsorshipService';

const sportEmoji = {
  cricket: '🏏', football: '⚽', badminton: '🏸',
  kabaddi: '🤼', basketball: '🏀', volleyball: '🏐',
};

const statusColor = {
  upcoming: 'bg-gray-100 text-gray-500',
  registration: 'bg-blue-100 text-blue-600',
  ongoing: 'bg-emerald-100 text-emerald-600',
  completed: 'bg-purple-100 text-purple-600',
};

const tierInfo = {
  platinum: { color: 'bg-purple-100 text-purple-700 border-purple-300', amount: 50000 },
  gold:     { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', amount: 25000 },
  silver:   { color: 'bg-gray-100 text-gray-600 border-gray-300',       amount: 15000 },
  bronze:   { color: 'bg-orange-100 text-orange-700 border-orange-300', amount: 7000 },
};

const sports = ['all', 'cricket', 'football', 'badminton', 'kabaddi', 'basketball', 'volleyball'];

export default function SponsorBrowseTournamentsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [mySponsorships, setMySponsorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ sport: '', search: '' });
  const [selected, setSelected] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

  // map of tournamentId → tiers already sponsored
  const sponsoredMap = {};
  mySponsorships.forEach((s) => {
    const tid = s.tournamentId?._id?.toString();
    if (tid) {
      if (!sponsoredMap[tid]) sponsoredMap[tid] = [];
      sponsoredMap[tid].push(s.tier);
    }
  });

  const handleSponsor = (tournament, tier) => {
    setSelected(tournament);
    setSelectedTier(tier);
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
                            <button
                              onClick={() => !alreadySponsored && handleSponsor(t, tier)}
                              disabled={alreadySponsored}
                              className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all
                                ${alreadySponsored
                                  ? 'bg-emerald-50 text-emerald-600 cursor-not-allowed'
                                  : 'bg-amber-500 text-white hover:bg-amber-600'
                                }`}
                            >
                              {alreadySponsored ? '✓ Sponsored' : 'Sponsor Now'}
                            </button>
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