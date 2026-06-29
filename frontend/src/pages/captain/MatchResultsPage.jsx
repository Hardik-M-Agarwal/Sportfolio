import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CaptainLayout from '../../layouts/CaptainLayout';
import teamService from '../../services/teamService';
import matchService from '../../services/matchService';

const sportEmoji = {
  cricket: '🏏', football: '⚽', badminton: '🏸',
  kabaddi: '🤼', basketball: '🏀', volleyball: '🏐',
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

const formatTime = (time) => {
  if (!time) return null;
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
};

export default function MatchResultsPage() {
  const navigate = useNavigate();

  const [teams, setTeams]               = useState([]);
  const [matchesByTeam, setMatchesByTeam] = useState({});
  const [loading, setLoading]           = useState(true);
  const [activeTeam, setActiveTeam]     = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const teamsData = await teamService.getMyTeams();
      const myTeams   = teamsData.teams || [];
      setTeams(myTeams);

      // fetch matches for all teams in parallel
      const matchResults = await Promise.all(
        myTeams.map(async (t) => {
          try {
            const data = await matchService.getMatchesByTeam(t._id);
            return { teamId: t._id, matches: data.matches || [] };
          } catch {
            return { teamId: t._id, matches: [] };
          }
        })
      );

      const map = {};
      matchResults.forEach(({ teamId, matches }) => {
        map[teamId] = matches;
      });
      setMatchesByTeam(map);
    } catch (err) {
      console.error('Failed to fetch match results', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // compute per-team stats
  const teamStats = teams.map((team) => {
    const matches   = matchesByTeam[team._id] || [];
    const completed = matches.filter((m) => m.status === 'completed');
    const won       = completed.filter((m) => {
      const wid = m.result?.winnerId?._id?.toString() || m.result?.winnerId?.toString();
      return wid === team._id.toString();
    }).length;
    const lost = completed.filter((m) => {
      const wid = m.result?.winnerId?._id?.toString() || m.result?.winnerId?.toString();
      return wid && wid !== team._id.toString();
    }).length;
    return { team, matches, completed: completed.length, won, lost, drawn: completed.length - won - lost };
  });

  const totalMatches  = teamStats.reduce((s, t) => s + t.matches.length, 0);
  const totalWon      = teamStats.reduce((s, t) => s + t.won, 0);
  const totalLost     = teamStats.reduce((s, t) => s + t.lost, 0);
  const totalCompleted = teamStats.reduce((s, t) => s + t.completed, 0);

  const displayedTeams = activeTeam === 'all'
    ? teamStats
    : teamStats.filter((ts) => ts.team._id.toString() === activeTeam);

  return (
    <CaptainLayout>
      <div className="p-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
            Match Results
          </h1>
          <p className="text-gray-500 mt-1">All your match results across every tournament.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : totalMatches === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">🏆</div>
            <h2 className="text-xl font-black text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              No matches yet
            </h2>
            <p className="text-gray-400 text-sm mb-6">Register a team and wait for the organiser to schedule matches.</p>
            <button
              onClick={() => navigate('/captain/tournaments')}
              className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Browse Tournaments
            </button>
          </div>
        ) : (
          <>
            {/* Overall stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Matches',    value: totalMatches,   color: 'text-gray-900',    bg: 'bg-gray-50',    icon: '⚽' },
                { label: 'Completed',        value: totalCompleted, color: 'text-blue-600',    bg: 'bg-blue-50',    icon: '✅' },
                { label: 'Won',              value: totalWon,       color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '🏆' },
                { label: 'Lost',             value: totalLost,      color: 'text-red-500',     bg: 'bg-red-50',     icon: '❌' },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-xl p-5`}>
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className={`text-3xl font-black ${s.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Team filter tabs */}
            {teams.length > 1 && (
              <div className="flex gap-2 flex-wrap mb-6">
                <button
                  onClick={() => setActiveTeam('all')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors
                    ${activeTeam === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  All Teams ({teams.length})
                </button>
                {teams.map((t) => (
                  <button
                    key={t._id}
                    onClick={() => setActiveTeam(t._id.toString())}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors
                      ${activeTeam === t._id.toString() ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {sportEmoji[t.tournamentId?.sport]} {t.teamName}
                  </button>
                ))}
              </div>
            )}

            {/* Per team results */}
            <div className="flex flex-col gap-8">
              {displayedTeams.map(({ team, matches, won, lost, drawn }) => {
                const tournament = team.tournamentId;
                if (!tournament) return null;

                const teamId    = team._id.toString();
                const completed = matches.filter((m) => m.status === 'completed');
                const scheduled = matches.filter((m) => m.status === 'scheduled');
                const ongoing   = matches.filter((m) => m.status === 'ongoing');

                // group by round
                const rounds = matches.reduce((acc, m) => {
                  const key = m.roundName || `Round ${m.round}`;
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(m);
                  return acc;
                }, {});

                return (
                  <div key={team._id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">

                    {/* Team header */}
                    <div className="bg-gray-900 px-6 py-5">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{sportEmoji[tournament.sport]}</span>
                          <div>
                            <h2 className="font-black text-lg text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                              {team.teamName}
                            </h2>
                            <p className="text-xs text-white/50 capitalize mt-0.5">
                              {tournament.name} · {tournament.sport} · {tournament.format}
                            </p>
                          </div>
                        </div>

                        {/* W/L/D mini stats */}
                        <div className="flex items-center gap-4">
                          {[
                            { label: 'W', value: won,   color: 'text-emerald-400' },
                            { label: 'L', value: lost,  color: 'text-red-400' },
                            { label: 'D', value: drawn, color: 'text-amber-400' },
                          ].map((s) => (
                            <div key={s.label} className="text-center">
                              <div className={`text-2xl font-black ${s.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
                              <div className="text-xs text-white/40">{s.label}</div>
                            </div>
                          ))}
                          <button
                            onClick={() => navigate(`/captain/teams/${team._id}/matches`)}
                            className="ml-2 px-3 py-1.5 bg-white/10 text-white text-xs font-semibold rounded-lg hover:bg-white/20 transition-colors"
                          >
                            Full View →
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Matches */}
                    <div className="divide-y divide-gray-100">
                      {matches.length === 0 ? (
                        <div className="px-6 py-8 text-center">
                          <p className="text-gray-400 text-sm">No matches scheduled yet.</p>
                        </div>
                      ) : (
                        Object.entries(rounds).map(([roundName, roundMatches]) => (
                          <div key={roundName}>
                            {/* Round label */}
                            <div className="px-6 py-2 bg-gray-50 flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{roundName}</span>
                              <div className="flex-1 h-px bg-gray-200" />
                            </div>

                            {roundMatches.map((match) => {
                              const isTeam1  = match.team1Id?._id?.toString() === teamId;
                              const myTeamObj = isTeam1 ? match.team1Id : match.team2Id;
                              const opponent  = isTeam1 ? match.team2Id : match.team1Id;
                              const myScore   = isTeam1 ? match.result?.team1Score : match.result?.team2Score;
                              const oppScore  = isTeam1 ? match.result?.team2Score : match.result?.team1Score;
                              const winnerId  = match.result?.winnerId?._id?.toString() || match.result?.winnerId?.toString();
                              const didWin    = winnerId === teamId;
                              const didLose   = match.status === 'completed' && winnerId && winnerId !== teamId;
                              const isDraw    = match.status === 'completed' && !winnerId;
                              const isCompleted = match.status === 'completed';

                              return (
                                <div
                                  key={match._id}
                                  className={`px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors
                                    ${didWin ? 'border-l-4 border-emerald-500' : didLose ? 'border-l-4 border-red-400' : isDraw ? 'border-l-4 border-amber-400' : 'border-l-4 border-transparent'}`}
                                >
                                  {/* Result badge */}
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0
                                    ${didWin  ? 'bg-emerald-100 text-emerald-600' :
                                      didLose ? 'bg-red-100 text-red-500' :
                                      isDraw  ? 'bg-amber-100 text-amber-600' :
                                      match.status === 'ongoing' ? 'bg-blue-100 text-blue-600' :
                                      'bg-gray-100 text-gray-400'}`}
                                    style={{ fontFamily: "'Syne', sans-serif" }}
                                  >
                                    {didWin ? 'W' : didLose ? 'L' : isDraw ? 'D' : match.status === 'ongoing' ? '▶' : '—'}
                                  </div>

                                  {/* Match info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                                        vs {opponent?.teamName || 'TBD'}
                                      </span>
                                      {match.group && (
                                        <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full font-semibold">
                                          Group {match.group}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                      {match.matchDate && (
                                        <span className="text-xs text-gray-400">
                                          {formatDate(match.matchDate)}{match.matchTime ? ` · ${formatTime(match.matchTime)}` : ''}
                                        </span>
                                      )}
                                      {match.venue && (
                                        <span className="text-xs text-gray-400">{match.venue}</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Score */}
                                  {isCompleted && (myScore || oppScore) ? (
                                    <div className="text-right flex-shrink-0">
                                      <div className={`text-lg font-black ${didWin ? 'text-emerald-600' : didLose ? 'text-red-500' : 'text-gray-700'}`}
                                        style={{ fontFamily: "'Syne', sans-serif" }}>
                                        {myScore || '—'}
                                      </div>
                                      <div className="text-xs text-gray-400">{oppScore || '—'}</div>
                                    </div>
                                  ) : isCompleted ? (
                                    <div className="text-right flex-shrink-0">
                                      <div className={`text-sm font-black ${didWin ? 'text-emerald-600' : didLose ? 'text-red-500' : 'text-amber-600'}`}
                                        style={{ fontFamily: "'Syne', sans-serif" }}>
                                        {didWin ? 'Won' : didLose ? 'Lost' : 'Draw'}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0
                                      ${match.status === 'ongoing' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                      {match.status === 'ongoing' ? '🔴 Live' : 'Scheduled'}
                                    </span>
                                  )}

                                  {/* Scorecard */}
                                  <button
                                    onClick={() => navigate(`/match/${match._id}`)}
                                    className="p-1.5 text-gray-300 hover:text-gray-600 transition-colors flex-shrink-0"
                                    title="View scorecard"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer summary */}
                    {matches.length > 0 && (
                      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex gap-4 text-xs text-gray-400">
                          <span>{completed.filter((m) => {
                            const wid = m.result?.winnerId?._id?.toString() || m.result?.winnerId?.toString();
                            return wid === teamId;
                          }).length} won</span>
                          <span>{completed.filter((m) => {
                            const wid = m.result?.winnerId?._id?.toString() || m.result?.winnerId?.toString();
                            return wid && wid !== teamId;
                          }).length} lost</span>
                          {scheduled.length > 0 && <span>{scheduled.length} upcoming</span>}
                          {ongoing.length > 0 && <span className="text-blue-500">{ongoing.length} live</span>}
                        </div>
                        <span className="text-xs text-gray-400">{matches.length} total matches</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </CaptainLayout>
  );
}