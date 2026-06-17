import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OrganiserLayout from '../../layouts/OrganiserLayout';
import CreateTournamentModal from '../../components/tournaments/CreateTournamentModal';
import tournamentService from '../../services/tournamentService';

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

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();

  const fetchTournaments = async () => {
    try {
      const data = await tournamentService.getMyTournaments();
      setTournaments(data.tournaments);
    } catch (error) {
      console.error('Failed to fetch tournaments', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTournaments(); }, []);

  const handleCreated = (newTournament) => {
    setTournaments((prev) => [newTournament, ...prev]);
    setShowCreate(false);
  };

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <OrganiserLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-3xl font-black tracking-tight text-gray-900"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Tournaments
            </h1>
            <p className="text-gray-500 mt-1">Manage all your tournaments in one place.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Tournament
          </button>
        </div>

        {/* Content */}
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
            <p className="text-gray-400 text-sm mb-6">
              Create your first tournament and start managing teams, matches, and finances.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Create your first tournament
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {tournaments.map((t) => (
              <div
                key={t._id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">{sportEmoji[t.sport]}</div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColor[t.status]}`}>
                    {t.status}
                  </span>
                </div>

                {/* Name */}
                <h3
                  className="font-black text-lg text-gray-900 leading-tight mb-1"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  {t.name}
                </h3>
                <p className="text-xs text-gray-400 mb-4 capitalize">{t.sport} · {t.format}</p>

                {/* Details */}
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t.venue.name}, {t.venue.city}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Reg: {new Date(t.registrationStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {new Date(t.registrationEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(t.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} → {new Date(t.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Max {t.maxTeams} teams · ₹{t.entryFee.toLocaleString('en-IN')} entry
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  {/* Code + copy */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">Code:</span>
                    <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded font-mono">
                      {t.tournamentCode}
                    </span>
                    <button
                      onClick={() => handleCopy(t.tournamentCode, t._id)}
                      className="text-gray-400 hover:text-blue-600 transition-colors ml-0.5"
                      title="Copy code"
                    >
                      {copiedId === t._id ? (
                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => navigate(`/organiser/tournaments/${t._id}`)}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    View →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateTournamentModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </OrganiserLayout>
  );
}