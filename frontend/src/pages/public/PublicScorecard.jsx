import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import scoringService from '../../services/scoringService';

const sportEmoji = {
  cricket: '🏏', football: '⚽', badminton: '🏸',
  kabaddi: '🤼', basketball: '🏀', volleyball: '🏐',
};

// ── Sport specific scoreboards ────────────────────────────────────────
function CricketScoreboard({ state, match }) {
  const t1 = state?.team1;
  const t2 = state?.team2;
  const isBattingT1 = state?.currentBatting === 'team1';

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { team: t1, isBatting: isBattingT1 },
          { team: t2, isBatting: !isBattingT1 },
        ].map(({ team, isBatting }, i) => (
          <div key={i} className={`rounded-2xl p-5 ${isBatting ? 'bg-blue-600' : 'bg-white/10'}`}>
            <p className="text-xs text-white/60 mb-1">{team?.name}</p>
            <p className="text-4xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              {team?.runs ?? 0}/{team?.wickets ?? 0}
            </p>
            <p className="text-xs text-white/50 mt-1">{team?.overs ?? '0.0'} overs</p>
            {isBatting && (
              <span className="text-xs font-bold text-white/80 bg-white/20 px-2 py-0.5 rounded-full mt-2 inline-block">
                Batting ▶
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Ball history */}
      {state?.ballHistory?.length > 0 && (
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-xs text-white/30 mb-2">This over</p>
          <div className="flex gap-1.5 flex-wrap">
            {state.ballHistory.slice(-6).map((ball, i) => (
              <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                ${ball.isWicket ? 'bg-red-500 text-white' :
                  ball.runs === 4 ? 'bg-blue-500 text-white' :
                  ball.runs === 6 ? 'bg-purple-500 text-white' :
                  'bg-white/20 text-white'}`}>
                {ball.isWicket ? 'W' : ball.runs === 0 ? '•' : ball.runs}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FootballScoreboard({ state }) {
  return (
    <div className="flex items-center justify-between px-4">
      <div className="text-center flex-1">
        <p className="text-xs text-white/60 mb-2">{state?.team1?.name}</p>
        <p className="text-6xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
          {state?.team1?.goals ?? 0}
        </p>
      </div>
      <div className="text-center px-6">
        <p className="text-white/40 text-sm">{state?.half === 2 ? '2nd Half' : '1st Half'}</p>
        {state?.minute > 0 && <p className="text-white/30 text-xs mt-1">{state.minute}'</p>}
      </div>
      <div className="text-center flex-1">
        <p className="text-xs text-white/60 mb-2">{state?.team2?.name}</p>
        <p className="text-6xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
          {state?.team2?.goals ?? 0}
        </p>
      </div>
    </div>
  );
}

function SetScoreboard({ state, pointsPerSet }) {
  const t1 = state?.team1;
  const t2 = state?.team2;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-4">
        <div className="text-center flex-1">
          <p className="text-xs text-white/60 mb-1">{t1?.name}</p>
          <p className="text-5xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            {t1?.currentSetPoints ?? 0}
          </p>
          <p className="text-xs text-white/40 mt-1">Sets: {t1?.sets ?? 0}</p>
        </div>
        <div className="text-center px-4">
          <p className="text-white/30 text-sm">Set {state?.currentSet || 1}</p>
          <p className="text-white/20 text-xs">First to {pointsPerSet}</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-xs text-white/60 mb-1">{t2?.name}</p>
          <p className="text-5xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            {t2?.currentSetPoints ?? 0}
          </p>
          <p className="text-xs text-white/40 mt-1">Sets: {t2?.sets ?? 0}</p>
        </div>
      </div>

      {state?.sets?.length > 0 && (
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-xs text-white/30 mb-2">Set History</p>
          {state.sets.map((s, i) => (
            <div key={i} className="flex justify-between text-xs text-white/50 py-1">
              <span>Set {i + 1}</span>
              <span className="font-bold">{s.team1} — {s.team2}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GenericScoreboard({ state }) {
  return (
    <div className="flex items-center justify-between px-4">
      <div className="text-center flex-1">
        <p className="text-xs text-white/60 mb-2">{state?.team1?.name}</p>
        <p className="text-6xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
          {state?.team1?.score ?? 0}
        </p>
      </div>
      <div className="text-white/30 text-2xl font-bold">—</div>
      <div className="text-center flex-1">
        <p className="text-xs text-white/60 mb-2">{state?.team2?.name}</p>
        <p className="text-6xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
          {state?.team2?.score ?? 0}
        </p>
      </div>
    </div>
  );
}

function BasketballScoreboard({ state }) {
  const t1 = state?.team1;
  const t2 = state?.team2;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-4">
        <div className="text-center flex-1">
          <p className="text-xs text-white/60 mb-1">{t1?.name}</p>
          <p className="text-5xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{t1?.score ?? 0}</p>
        </div>
        <div className="text-center px-4">
          <p className="text-white/30 text-sm">Q{state?.currentQuarter || 1}</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-xs text-white/60 mb-1">{t2?.name}</p>
          <p className="text-5xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{t2?.score ?? 0}</p>
        </div>
      </div>
      <div className="bg-white/5 rounded-xl p-3 flex justify-around">
        {[0, 1, 2, 3].map((q) => (
          <div key={q} className="text-center">
            <p className="text-xs text-white/30">Q{q + 1}</p>
            <p className="text-xs text-white/60 font-bold">
              {t1?.quarters?.[q] ?? 0}—{t2?.quarters?.[q] ?? 0}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Player Stats Table ────────────────────────────────────────────────
function PlayerStatsTable({ playerStats, sport, match }) {
  if (!playerStats?.length) return null;

  const getColumns = () => {
    switch (sport) {
      case 'cricket':
        return [
          { key: 'runs', label: 'R' },
          { key: 'balls', label: 'B' },
          { key: 'fours', label: '4s' },
          { key: 'sixes', label: '6s' },
          { key: 'wickets', label: 'Wkts' },
          { key: 'catches', label: 'Ct' },
        ];
      case 'football':
        return [
          { key: 'goals', label: 'G' },
          { key: 'assists', label: 'A' },
          { key: 'yellowCards', label: '🟡' },
          { key: 'redCards', label: '🔴' },
        ];
      case 'basketball':
        return [
          { key: 'points', label: 'PTS' },
          { key: 'assists', label: 'AST' },
        ];
      default:
        return [{ key: 'pointsWon', label: 'Pts' }];
    }
  };

  const columns = getColumns();

  const team1Stats = playerStats.filter(
    (s) => s.teamId?.toString() === match?.team1Id?._id?.toString()
  );
  const team2Stats = playerStats.filter(
    (s) => s.teamId?.toString() === match?.team2Id?._id?.toString()
  );

  const renderTable = (stats, teamName) => {
    if (!stats.length) return null;
    return (
      <div className="mb-4">
        <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">{teamName}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-1.5 text-white/40 font-medium">Player</th>
                {columns.map((c) => (
                  <th key={c.key} className="text-center py-1.5 text-white/40 font-medium px-2">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s._id} className="border-b border-white/5">
                  <td className="py-2 text-white/70">{s.playerName}</td>
                  {columns.map((c) => (
                    <td key={c.key} className="text-center py-2 text-white/60 px-2">
                      {s.stats?.[c.key] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/5 rounded-2xl p-5">
      <h3 className="text-sm font-black text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
        Player Stats
      </h3>
      {renderTable(team1Stats, match?.team1Id?.teamName)}
      {renderTable(team2Stats, match?.team2Id?.teamName)}
    </div>
  );
}

// ── Main Public Scorecard ─────────────────────────────────────────────
export default function PublicScorecard() {
  const { matchId } = useParams();
  const { joinMatch, leaveMatch, onScoreUpdate } = useSocket();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchScorecard = useCallback(async () => {
    try {
      const result = await scoringService.getScorecard(matchId);
      setData(result);
    } catch (err) {
      console.error('Failed to fetch scorecard', err);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchScorecard();
    joinMatch(matchId);

    const cleanup = onScoreUpdate((update) => {
      setData((prev) => ({
        ...prev,
        scorecard: update.scorecard,
        events: [update.event, ...(prev?.events || [])].slice(0, 50),
      }));
    });

    return () => {
      leaveMatch(matchId);
      cleanup();
    };
  }, [matchId, fetchScorecard, joinMatch, leaveMatch, onScoreUpdate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { match, scorecard, events, playerStats } = data || {};
  const sport = match?.tournamentId?.sport;
  const state = scorecard?.scoreState;
  const isLive = scorecard?.status === 'live';

  const renderScoreboard = () => {
    switch (sport) {
      case 'cricket':    return <CricketScoreboard state={state} match={match} />;
      case 'football':   return <FootballScoreboard state={state} />;
      case 'badminton':  return <SetScoreboard state={state} pointsPerSet={21} />;
      case 'volleyball': return <SetScoreboard state={state} pointsPerSet={25} />;
      case 'basketball': return <BasketballScoreboard state={state} />;
      case 'kabaddi':    return <GenericScoreboard state={state} />;
      default:           return <GenericScoreboard state={state} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-950 border-b border-white/10 px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="font-black text-lg text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              Sport<span className="text-blue-400">folio</span>
            </div>
            <p className="text-xs text-white/30 mt-0.5">{match?.tournamentId?.name}</p>
          </div>
          {isLive && (
            <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400 font-bold">LIVE</span>
            </div>
          )}
          {!isLive && scorecard?.status === 'completed' && (
            <span className="text-xs text-white/40 bg-white/10 px-3 py-1.5 rounded-full">Final</span>
          )}
          {!scorecard && (
            <span className="text-xs text-white/40 bg-white/10 px-3 py-1.5 rounded-full">Not started</span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 flex flex-col gap-5">
        {/* Match info */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-2xl">{sportEmoji[sport]}</span>
            <h1 className="text-xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              {match?.team1Id?.teamName} vs {match?.team2Id?.teamName}
            </h1>
          </div>
          <p className="text-xs text-white/40">{match?.roundName} · Match #{match?.matchNumber}</p>
          {match?.venue && <p className="text-xs text-white/30 mt-0.5">{match.venue}{match.ground && ` · ${match.ground}`}</p>}
        </div>

        {/* Scoreboard */}
        {scorecard && state ? (
          <div className="bg-gray-800 rounded-2xl p-5">
            {renderScoreboard()}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-2xl p-8 text-center">
            <p className="text-white/40 text-sm">Match hasn't started yet</p>
          </div>
        )}

        {/* Player stats */}
        {playerStats?.length > 0 && (
          <PlayerStatsTable playerStats={playerStats} sport={sport} match={match} />
        )}

        {/* Event feed */}
        {events?.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-5">
            <h3 className="text-sm font-black text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
              Live Feed
            </h3>
            <div className="flex flex-col gap-2">
              {events.slice(0, 20).map((event) => (
                <div key={event._id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <span className="text-xs text-white/20 flex-shrink-0 w-12">
                    {new Date(event.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-xs text-white/60 capitalize flex-1">
                    {event.eventType.replace(/_/g, ' ')}
                  </span>
                  {event.playerName && (
                    <span className="text-xs text-blue-400">{event.playerName}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}