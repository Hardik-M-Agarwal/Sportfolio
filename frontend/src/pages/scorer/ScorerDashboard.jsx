import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import scoringService from '../../services/scoringService';

const statusColor = {
  scheduled: 'bg-gray-100 text-gray-500',
  ongoing:   'bg-blue-100 text-blue-600',
  completed: 'bg-emerald-100 text-emerald-600',
};

const sportEmoji = {
  cricket: '🏏', football: '⚽', badminton: '🏸',
  kabaddi: '🤼', basketball: '🏀', volleyball: '🏐',
};

export default function ScorerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await scoringService.getMyAssignedMatches();
        setMatches(data.matches);
      } catch (error) {
        console.error('Failed to fetch matches', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="font-black text-xl tracking-tight text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            Sport<span className="text-blue-400">folio</span>
          </div>
          <div className="text-xs text-white/40 mt-0.5">Scorer Portal</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-semibold text-white">{user?.name}</div>
            <div className="text-xs text-white/40">{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-xs font-semibold border border-white/20 text-white/60 rounded-lg hover:bg-white/10 transition-colors"
          >
            Log out
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
            My Matches 🎯
          </h1>
          <p className="text-gray-500 mt-1">Matches assigned to you for scoring.</p>
        </div>

        {loading ? (
          <div className="flex justify-center h-64 items-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="text-xl font-black text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              No matches assigned yet
            </h2>
            <p className="text-gray-400 text-sm">
              The organiser will assign you to matches. Check back soon.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {matches.map((match) => (
              <div key={match._id} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{sportEmoji[match.tournamentId?.sport]}</span>
                      <h3 className="font-black text-lg text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                        {match.team1Id?.teamName} vs {match.team2Id?.teamName}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">
                      {match.tournamentId?.name} · {match.roundName} · Match #{match.matchNumber}
                    </p>
                    {match.matchDate && (
                      <p className="text-xs text-gray-400">
                        {new Date(match.matchDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {match.matchTime && ` · ${match.matchTime}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[match.status]}`}>
                      {match.status}
                    </span>
                    {match.status !== 'completed' && (
                      <button
                        onClick={() => navigate(`/scorer/match/${match._id}`)}
                        className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {match.status === 'ongoing' ? 'Continue Scoring →' : 'Start Scoring →'}
                      </button>
                    )}
                    {match.status === 'completed' && (
                      <button
                        onClick={() => navigate(`/match/${match._id}`)}
                        className="px-4 py-2 text-xs font-semibold border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        View Scorecard
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}