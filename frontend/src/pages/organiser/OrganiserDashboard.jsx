import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import OrganiserLayout from '../../layouts/OrganiserLayout';
import { useAuth } from '../../context/AuthContext';
import tournamentService from '../../services/tournamentService';
import api from '../../services/api';

const sportEmoji = {
  cricket: '🏏', football: '⚽', badminton: '🏸',
  kabaddi: '🤼', basketball: '🏀', volleyball: '🏐',
};

const statusConfig = {
  upcoming: { color: 'bg-gray-100 text-gray-500', label: 'Upcoming' },
  registration: { color: 'bg-blue-100 text-blue-600', label: 'Registration' },
  ongoing: { color: 'bg-emerald-100 text-emerald-600', label: 'Ongoing' },
  completed: { color: 'bg-purple-100 text-purple-600', label: 'Completed' },
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function OrganiserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tournaments, setTournaments] = useState([]);
  const [sponsorships, setSponsorships] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [tData, sData] = await Promise.all([
        tournamentService.getMyTournaments(),
        api.get('/outreach/my-sponsorships-summary'),
      ]);
      setTournaments(tData.tournaments || []);
      setSponsorships(sData.data.sponsorships || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── computed stats ───────────────────────────────────────────────
  const active = tournaments.filter((t) => ['registration', 'ongoing'].includes(t.status));
  const ongoing = tournaments.filter((t) => t.status === 'ongoing');
  const completed = tournaments.filter((t) => t.status === 'completed');

  const totalSponsorRevenue = sponsorships.reduce((sum, s) => sum + s.amount, 0);

  // entry revenue across all tournaments (paid teams × entry fee)
  const totalEntryRevenue = tournaments.reduce((sum, t) => {
    const paid = (t.paidTeams || 0) * t.entryFee;
    return sum + paid;
  }, 0);

  const totalRevenue = totalEntryRevenue + totalSponsorRevenue;

  // recent sponsorships (last 5)
  const recentSponsorships = [...sponsorships]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <OrganiserLayout>
      <div className="p-8 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 mt-1">Here's what's happening with your tournaments.</p>
          </div>
          <button
            onClick={() => navigate('/organiser/tournaments')}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Tournament
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tournaments.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">🏆</div>
            <h2 className="text-xl font-black text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              No tournaments yet
            </h2>
            <p className="text-gray-400 text-sm mb-6">Create your first tournament to get started.</p>
            <button
              onClick={() => navigate('/organiser/tournaments')}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Create Tournament →
            </button>
          </div>
        ) : (
          <>
            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Tournaments', value: tournaments.length, color: 'text-blue-600', bg: 'bg-blue-50', icon: '🏆' },
                { label: 'Active Now', value: active.length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '🔥' },
                { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: 'text-purple-600', bg: 'bg-purple-50', icon: '💰' },
                { label: 'Sponsors', value: sponsorships.length, color: 'text-amber-600', bg: 'bg-amber-50', icon: '💼' },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-xl p-5`}>
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className={`text-2xl font-black tracking-tight ${s.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                    {s.value}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ── Left: Tournament List ── */}
              <div className="lg:col-span-2 flex flex-col gap-6">

                {/* Ongoing */}
                {ongoing.length > 0 && (
                  <div>
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
                      🔥 Ongoing
                    </h2>
                    <div className="flex flex-col gap-3">
                      {ongoing.map((t) => (
                        <TournamentCard key={t._id} tournament={t} onClick={() => navigate(`/organiser/tournaments/${t._id}`)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Registration open */}
                {tournaments.filter((t) => t.status === 'registration').length > 0 && (
                  <div>
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
                      📋 Registration Open
                    </h2>
                    <div className="flex flex-col gap-3">
                      {tournaments.filter((t) => t.status === 'registration').map((t) => (
                        <TournamentCard key={t._id} tournament={t} onClick={() => navigate(`/organiser/tournaments/${t._id}`)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming */}
                {tournaments.filter((t) => t.status === 'upcoming').length > 0 && (
                  <div>
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
                      📅 Upcoming
                    </h2>
                    <div className="flex flex-col gap-3">
                      {tournaments.filter((t) => t.status === 'upcoming').map((t) => (
                        <TournamentCard key={t._id} tournament={t} onClick={() => navigate(`/organiser/tournaments/${t._id}`)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed */}
                {completed.length > 0 && (
                  <div>
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
                      ✅ Completed
                    </h2>
                    <div className="flex flex-col gap-3">
                      {completed.map((t) => (
                        <TournamentCard key={t._id} tournament={t} onClick={() => navigate(`/organiser/tournaments/${t._id}`)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Right: Revenue + Sponsors ── */}
              <div className="flex flex-col gap-5">

                {/* Revenue breakdown */}
                <div className="bg-gray-900 rounded-2xl p-6">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-4">Revenue Overview</p>
                  <div className="flex flex-col gap-3">
                    {[
                      { label: 'Entry Fees', value: totalEntryRevenue, color: 'text-emerald-400' },
                      { label: 'Sponsorships', value: totalSponsorRevenue, color: 'text-blue-400' },
                    ].map((r) => (
                      <div key={r.label} className="flex justify-between items-center py-2.5 border-b border-white/10">
                        <span className="text-xs text-white/50">{r.label}</span>
                        <span className={`text-sm font-black ${r.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                          ₹{r.value.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-white/50">Total</span>
                      <span className="text-xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                        ₹{totalRevenue.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tournament status breakdown */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">By Status</p>
                  <div className="flex flex-col gap-2">
                    {[
                      { label: 'Upcoming', count: tournaments.filter((t) => t.status === 'upcoming').length, color: 'bg-gray-400' },
                      { label: 'Registration', count: tournaments.filter((t) => t.status === 'registration').length, color: 'bg-blue-500' },
                      { label: 'Ongoing', count: ongoing.length, color: 'bg-emerald-500' },
                      { label: 'Completed', count: completed.length, color: 'bg-purple-500' },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.color}`} />
                        <span className="text-xs text-gray-500 flex-1">{s.label}</span>
                        <span className="text-xs font-bold text-gray-700">{s.count}</span>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${s.color}`}
                            style={{ width: `${tournaments.length > 0 ? (s.count / tournaments.length) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent sponsors */}
                {recentSponsorships.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Recent Sponsors</p>
                      <button
                        onClick={() => navigate('/organiser/sponsorships')}
                        className="text-xs text-blue-600 font-semibold hover:underline"
                      >
                        View all →
                      </button>
                    </div>
                    <div className="flex flex-col gap-3">
                      {recentSponsorships.map((s) => (
                        <div key={s._id} className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-700 truncate">{s.businessName}</p>
                            <p className="text-xs text-gray-400 truncate">{s.tournamentId?.name}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                              ₹{s.amount.toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-gray-400 capitalize">{s.tier}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick links */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">Quick Links</p>
                  <div className="flex flex-col gap-2">
                    {[
                      { label: 'View all tournaments', path: '/organiser/tournaments', icon: '🏆' },
                      { label: 'Sponsorship outreach', path: '/organiser/sponsorships', icon: '💼' },
                      { label: 'Entry Fee Predictor', path: '/organiser/entry-fee-predictor', icon: '🤖' },
                    ].map((link) => (
                      <button
                        key={link.label}
                        onClick={() => navigate(link.path)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left w-full"
                      >
                        <span className="text-base">{link.icon}</span>
                        <span className="text-xs font-medium text-gray-600">{link.label}</span>
                        <svg className="w-3 h-3 text-gray-300 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </OrganiserLayout>
  );
}

function TournamentCard({ tournament: t, onClick }) {
  const basePrizePool = Math.round(
    t.entryFee * t.maxTeams * (t.prizeStructure?.percentage || 60) / 100
  );

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-2xl flex-shrink-0">{sportEmoji[t.sport]}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-base text-gray-900 truncate" style={{ fontFamily: "'Syne', sans-serif" }}>
                {t.name}
              </h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${statusConfig[t.status]?.color}`}>
                {statusConfig[t.status]?.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 capitalize mt-0.5">
              {t.sport} · {t.format} · {t.venue?.city}
            </p>
          </div>
        </div>
        <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-400">Teams</p>
          <p className="text-sm font-black text-gray-700" style={{ fontFamily: "'Syne', sans-serif" }}>
            {t.registeredCount ?? '—'} / {t.maxTeams}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Entry Fee</p>
          <p className="text-sm font-black text-gray-700" style={{ fontFamily: "'Syne', sans-serif" }}>
            ₹{t.entryFee.toLocaleString('en-IN')}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Prize Pool</p>
          <p className="text-sm font-black text-blue-600" style={{ fontFamily: "'Syne', sans-serif" }}>
            ₹{basePrizePool.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {formatDate(t.startDate)} → {formatDate(t.endDate)}
      </div>
    </div>
  );
}