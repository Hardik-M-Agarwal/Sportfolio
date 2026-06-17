import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CaptainLayout from '../../layouts/CaptainLayout';
import { useAuth } from '../../context/AuthContext';
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

const paymentColor = {
  pending: 'bg-red-100 text-red-600',
  paid: 'bg-emerald-100 text-emerald-600',
  cash: 'bg-amber-100 text-amber-600',
};

export default function CaptainDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await teamService.getMyTeams();
        setTeams(data.teams);
      } catch (error) {
        console.error('Failed to fetch teams', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  const upcoming = teams.filter(t => ['upcoming', 'registration'].includes(t.tournamentId?.status));
  const ongoing = teams.filter(t => t.tournamentId?.status === 'ongoing');
  const completed = teams.filter(t => t.tournamentId?.status === 'completed');

  return (
    <CaptainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
              Welcome, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 mt-1">Here are your tournaments and teams.</p>
          </div>
          <button
            onClick={() => navigate('/captain/tournaments')}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-all hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Browse Tournaments
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : teams.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">🧢</div>
            <h2 className="text-xl font-black text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              No tournaments yet
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Browse tournaments in your city and register your team.
            </p>
            <button
              onClick={() => navigate('/captain/tournaments')}
              className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Browse Tournaments
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { label: 'Total Tournaments', value: teams.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Ongoing', value: ongoing.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Completed', value: completed.length, color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-xl p-5`}>
                  <div className={`text-3xl font-black tracking-tight ${s.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Ongoing */}
            {ongoing.length > 0 && (
              <div>
                <h2 className="text-lg font-black text-gray-900 mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
                  🔥 Ongoing
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {ongoing.map((t) => <TeamCard key={t._id} team={t} />)}
                </div>
              </div>
            )}

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-lg font-black text-gray-900 mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
                  📅 Upcoming
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {upcoming.map((t) => <TeamCard key={t._id} team={t} />)}
                </div>
              </div>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <div>
                <h2 className="text-lg font-black text-gray-900 mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
                  ✅ Completed
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {completed.map((t) => <TeamCard key={t._id} team={t} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </CaptainLayout>
  );
}

function TeamCard({ team }) {
  const t = team.tournamentId;
  if (!t) return null;

  const prizePool = Math.round(t.entryFee * t.maxTeams * t.prizeStructure?.percentage / 100);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="text-3xl">{sportEmoji[t.sport]}</div>
        <div className="flex gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColor[t.status]}`}>
            {t.status}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${paymentColor[team.paymentStatus]}`}>
            {team.paymentStatus}
          </span>
        </div>
      </div>

      <h3 className="font-black text-lg text-gray-900 mb-0.5" style={{ fontFamily: "'Syne', sans-serif" }}>
        {t.name}
      </h3>
      <p className="text-xs text-gray-400 mb-1 capitalize">{t.sport} · {t.format}</p>
      <p className="text-sm font-semibold text-gray-700 mb-4">
        🧢 {team.teamName}
        {team.isWaitlisted && <span className="ml-2 text-xs text-amber-500 font-medium">(Waitlisted)</span>}
      </p>

      <div className="flex flex-col gap-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {t.venue?.name}, {t.venue?.city}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date(t.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* Prize pool */}
      <div className="bg-blue-50 rounded-lg px-3 py-2 flex justify-between items-center mb-4">
        <span className="text-xs text-blue-500">Prize pool</span>
        <span className="text-sm font-black text-blue-600" style={{ fontFamily: "'Syne', sans-serif" }}>
          ₹{prizePool.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Players */}
      <div>
        <p className="text-xs text-gray-400 font-medium mb-2">Players ({team.players?.length})</p>
        <div className="flex flex-col gap-1">
          {team.players?.slice(0, 3).map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs flex-shrink-0">
                {i + 1}
              </div>
              {p.name}
              {p.phone && <span className="text-gray-300">· {p.phone}</span>}
            </div>
          ))}
          {team.players?.length > 3 && (
            <p className="text-xs text-gray-400 mt-1">+{team.players.length - 3} more players</p>
          )}
        </div>
      </div>
    </div>
  );
}