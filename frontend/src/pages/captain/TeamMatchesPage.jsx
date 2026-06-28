import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CaptainLayout from '../../layouts/CaptainLayout';
import matchService from '../../services/matchService';
import teamService from '../../services/teamService';
import reportService from '../../services/reportService';

const sportEmoji = {
  cricket: '🏏', football: '⚽', badminton: '🏸',
  kabaddi: '🤼', basketball: '🏀', volleyball: '🏐',
};

const statusColor = {
  scheduled: 'bg-gray-100 text-gray-500',
  ongoing: 'bg-blue-100 text-blue-600',
  completed: 'bg-emerald-100 text-emerald-600',
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

const formatTime = (time) => {
  if (!time) return null;
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
};

export default function TeamMatchesPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [matchData, teamData] = await Promise.all([
        matchService.getMatchesByTeam(teamId),
        teamService.getTeam(teamId),
      ]);
      setMatches(matchData.matches);
      setTeam(teamData.team);
    } catch (error) {
      console.error('Failed to fetch matches', error);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDownloadReport = async () => {
    if (!team?.tournamentId?._id) return;
    setDownloading(true);
    try {
      await reportService.downloadTeamPerformance(
        team.tournamentId._id,
        team.tournamentId.name || 'tournament',
        teamId
      );
    } catch (err) {
      alert('Failed to generate report.');
    } finally {
      setDownloading(false);
    }
  };

  // group by round
  const rounds = matches.reduce((acc, match) => {
    const key = match.roundName || `Round ${match.round}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {});

  const sport = team?.tournamentId?.sport;
  const won = matches.filter((m) => m.result?.winnerId?._id === teamId || m.result?.winnerId === teamId).length;
  const lost = matches.filter((m) => m.status === 'completed' && m.result?.winnerId && m.result?.winnerId?._id !== teamId && m.result?.winnerId !== teamId).length;
  const isCompleted = team?.tournamentId?.status === 'completed';

  return (
    <CaptainLayout>
      <div className="p-8 max-w-4xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate('/captain/my-teams')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to My Teams
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="text-4xl">{sportEmoji[sport]}</div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {team?.teamName}
                  </h1>
                  <p className="text-sm text-gray-400 mt-0.5 capitalize">
                    {team?.tournamentId?.name} · {sport} · {team?.tournamentId?.venue?.city}
                  </p>
                </div>
              </div>

              {/* Download report button — only for completed tournaments */}
              {isCompleted && (
                <button
                  onClick={handleDownloadReport}
                  disabled={downloading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                >
                  {downloading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      👥 Download Team Report
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Stats */}
            {matches.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Total Matches', value: matches.length, color: 'text-gray-900', bg: 'bg-gray-50' },
                  { label: 'Won', value: won, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Lost', value: lost, color: 'text-red-500', bg: 'bg-red-50' },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-5 text-center`}>
                    <div className={`text-3xl font-black ${s.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
                    <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Matches */}
            {matches.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
                <div className="text-5xl mb-4">🗓️</div>
                <h2 className="text-xl font-black text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                  No matches yet
                </h2>
                <p className="text-gray-400 text-sm">
                  The organiser hasn't generated the schedule yet. Check back soon.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {Object.entries(rounds).map(([roundName, roundMatches]) => (
                  <div key={roundName}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                        {roundName}
                      </div>
                      <div className="flex-1 h-px bg-gray-100" />
                      <div className="text-xs text-gray-300">
                        {roundMatches.length} match{roundMatches.length > 1 ? 'es' : ''}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {roundMatches.map((match) => {
                        const isTeam1 = match.team1Id?._id === teamId || match.team1Id?._id?.toString() === teamId;
                        const myTeam = isTeam1 ? match.team1Id : match.team2Id;
                        const opponent = isTeam1 ? match.team2Id : match.team1Id;
                        const myScore = isTeam1 ? match.result?.team1Score : match.result?.team2Score;
                        const oppScore = isTeam1 ? match.result?.team2Score : match.result?.team1Score;
                        const winnerId = match.result?.winnerId?._id || match.result?.winnerId;
                        const didWin = winnerId?.toString() === teamId;
                        const didLose = match.status === 'completed' && winnerId && winnerId?.toString() !== teamId;
                        const matchDone = match.status === 'completed';

                        return (
                          <div
                            key={match._id}
                            className={`bg-white border rounded-xl p-5 transition-all
                              ${didWin ? 'border-emerald-200 bg-emerald-50/30' :
                                didLose ? 'border-red-100 bg-red-50/20' :
                                  'border-gray-200'}`}
                          >
                            <div className="flex items-start justify-between flex-wrap gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                  <span className="text-xs font-bold text-gray-300 font-mono">#{match.matchNumber}</span>
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[match.status]}`}>
                                    {match.status}
                                  </span>
                                  {matchDone && (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                                      ${didWin ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                                      {didWin ? '🏆 Won' : '❌ Lost'}
                                    </span>
                                  )}
                                  {match.group && (
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-500">
                                      Group {match.group}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-400 mb-0.5">Your team</p>
                                    <p className={`text-base font-black ${didWin ? 'text-emerald-600' : 'text-gray-900'}`}
                                      style={{ fontFamily: "'Syne', sans-serif" }}>
                                      {myTeam?.teamName}
                                    </p>
                                    {matchDone && myScore && (
                                      <p className="text-sm font-bold text-gray-600 mt-0.5">{myScore}</p>
                                    )}
                                  </div>

                                  <div className="text-gray-300 text-sm font-bold flex-shrink-0">vs</div>

                                  <div className="flex-1 text-right">
                                    <p className="text-xs text-gray-400 mb-0.5">Opponent</p>
                                    <p className={`text-base font-black ${didLose ? 'text-emerald-600' : 'text-gray-900'}`}
                                      style={{ fontFamily: "'Syne', sans-serif" }}>
                                      {opponent?.teamName}
                                    </p>
                                    {matchDone && oppScore && (
                                      <p className="text-sm font-bold text-gray-600 mt-0.5">{oppScore}</p>
                                    )}
                                  </div>
                                </div>

                                {matchDone && match.result?.notes && (
                                  <p className="text-xs text-gray-400 mt-2">{match.result.notes}</p>
                                )}

                                {(match.matchDate || match.venue) && (
                                  <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">
                                    {match.matchDate && (
                                      <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {formatDate(match.matchDate)}
                                        {match.matchTime && ` · ${formatTime(match.matchTime)}`}
                                      </span>
                                    )}
                                    {match.venue && (
                                      <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        </svg>
                                        {match.venue}{match.ground && ` · ${match.ground}`}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={() => navigate(`/match/${match._id}`)}
                                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
                              >
                                📊 Scorecard
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </CaptainLayout>
  );
}