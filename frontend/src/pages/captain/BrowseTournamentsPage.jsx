import { useState, useEffect, useCallback } from 'react';
import CaptainLayout from '../../layouts/CaptainLayout';
import JoinTournamentModal from '../../components/teams/JoinTournamentModal';
import tournamentService from '../../services/tournamentService';
import teamService from '../../services/teamService';

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

const sports = ['all', 'cricket', 'football', 'badminton', 'kabaddi', 'basketball', 'volleyball'];
const statuses = ['all', 'upcoming', 'registration', 'ongoing', 'completed'];

export default function BrowseTournamentsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ sport: '', status: '', city: '', search: '' });
  const [selected, setSelected] = useState(null);
  const [showJoin, setShowJoin] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v && v !== 'all')
      );
      const [tournamentsData, teamsData] = await Promise.all([
        tournamentService.getPublicTournaments(activeFilters),
        teamService.getMyTeams(),
      ]);
      setTournaments(tournamentsData.tournaments);
      setMyTeams(teamsData.teams);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // set of tournamentIds captain has already registered for
  const registeredTournamentIds = new Set(
    myTeams.map((t) => t.tournamentId?._id?.toString())
  );

  const handleJoin = (tournament) => {
    setSelected(tournament);
    setShowJoin(true);
  };

  const handleJoined = () => {
    setShowJoin(false);
    setSelected(null);
    fetchData();
  };

  return (
    <CaptainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
            Browse Tournaments
          </h1>
          <p className="text-gray-500 mt-1">Find and join tournaments in your city.</p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-48">
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500 transition-all"
                placeholder="Search tournaments..."
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
            </div>
          </div>

          <div className="min-w-36">
            <input
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500 transition-all"
              placeholder="City..."
              value={filters.city}
              onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
            />
          </div>

          <select
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500 transition-all bg-white"
            value={filters.sport}
            onChange={(e) => setFilters((f) => ({ ...f, sport: e.target.value === 'all' ? '' : e.target.value }))}
          >
            {sports.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All Sports' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          <select
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500 transition-all bg-white"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value === 'all' ? '' : e.target.value }))}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tournaments.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-black text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              No tournaments found
            </h2>
            <p className="text-gray-400 text-sm">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {tournaments.map((t) => (
              <TournamentCard
                key={t._id}
                tournament={t}
                alreadyRegistered={registeredTournamentIds.has(t._id?.toString())}
                onJoin={() => handleJoin(t)}
              />
            ))}
          </div>
        )}
      </div>

      {showJoin && selected && (
        <JoinTournamentModal
          tournament={selected}
          onClose={() => { setShowJoin(false); setSelected(null); }}
          onJoined={handleJoined}
        />
      )}
    </CaptainLayout>
  );
}

function TournamentCard({ tournament: t, alreadyRegistered, onJoin }) {
  const prizePool = Math.round(t.entryFee * t.maxTeams * t.prizeStructure?.percentage / 100);
  const isRegistrationOpen = t.status === 'registration';
  const isFull = t.registeredCount >= t.maxTeams;

  const getButtonState = () => {
    if (alreadyRegistered) return { label: '✓ Already Registered', disabled: true, className: 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-not-allowed' };
    if (!isRegistrationOpen) return { label: t.status === 'upcoming' ? 'Registration not open yet' : 'Registration closed', disabled: true, className: 'bg-gray-100 text-gray-400 cursor-not-allowed' };
    if (isFull) return { label: 'Join Waitlist', disabled: false, className: 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100' };
    return { label: 'Join Tournament', disabled: false, className: 'bg-emerald-600 text-white hover:bg-emerald-700 hover:-translate-y-0.5' };
  };

  const btn = getButtonState();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="text-3xl">{sportEmoji[t.sport]}</div>
        <div className="flex items-center gap-2">
          {alreadyRegistered && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-600">
              Registered ✓
            </span>
          )}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColor[t.status]}`}>
            {t.status}
          </span>
        </div>
      </div>

      <h3 className="font-black text-lg text-gray-900 leading-tight mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
        {t.name}
      </h3>
      <p className="text-xs text-gray-400 mb-4 capitalize">{t.sport} · {t.format}</p>

      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {t.venue?.name}, {t.venue?.city}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date(t.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {t.registeredCount} / {t.maxTeams} teams · {t.sportConfig?.teamSize} players each
        </div>
      </div>

      {/* Registration progress */}
      <div className="mb-4">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${Math.min((t.registeredCount / t.maxTeams) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Organiser */}
      <div className="bg-gray-50 rounded-lg px-3 py-2.5 mb-4">
        <p className="text-xs text-gray-400 mb-1">Organised by</p>
        <p className="text-sm font-semibold text-gray-700">{t.organiserId?.name}</p>
        <div className="flex gap-3 mt-1">
          <p className="text-xs text-gray-400">{t.organiserId?.email}</p>
          {t.organiserId?.phone && <p className="text-xs text-gray-400">{t.organiserId?.phone}</p>}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mb-4">
        <div>
          <div className="text-xs text-gray-400">Entry fee</div>
          <div className="text-base font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
            ₹{t.entryFee?.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Prize pool</div>
          <div className="text-base font-black text-blue-600" style={{ fontFamily: "'Syne', sans-serif" }}>
            ₹{prizePool.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <button
        onClick={btn.disabled ? undefined : onJoin}
        disabled={btn.disabled}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${btn.className}`}
      >
        {btn.label}
      </button>
    </div>
  );
}