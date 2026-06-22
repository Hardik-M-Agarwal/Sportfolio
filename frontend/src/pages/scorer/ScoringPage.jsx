import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import scoringService from '../../services/scoringService';
import CricketScorer from '../../components/scoring/CricketScorer';
import FootballScorer from '../../components/scoring/FootballScorer';
import BadmintonScorer from '../../components/scoring/BadmintonScorer';
import KabaddiScorer from '../../components/scoring/KabaddiScorer';
import BasketballScorer from '../../components/scoring/BasketballScorer';
import VolleyballScorer from '../../components/scoring/VolleyballScorer';

const sportEmoji = {
  cricket: '🏏', football: '⚽', badminton: '🏸',
  kabaddi: '🤼', basketball: '🏀', volleyball: '🏐',
};

export default function ScoringPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { joinMatch, leaveMatch } = useSocket();

  const [scorecard, setScorecard] = useState(null);
  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const fetchScorecard = useCallback(async () => {
    try {
      const data = await scoringService.getScorecard(matchId);
      setMatch(data.match);
      setScorecard(data.scorecard);
      setEvents(data.events);
    } catch (err) {
      console.error('Failed to fetch scorecard', err);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchScorecard();
    joinMatch(matchId);
    return () => leaveMatch(matchId);
  }, [matchId, fetchScorecard, joinMatch, leaveMatch]);

  const handleStartMatch = async () => {
    setStarting(true);
    setError('');
    try {
      const data = await scoringService.startMatch(matchId);
      setScorecard(data.scorecard);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start match');
    } finally {
      setStarting(false);
    }
  };

  const handleAddEvent = async (eventData) => {
    try {
      const data = await scoringService.addEvent(matchId, eventData);
      setScorecard(data.scorecard);
      setEvents((prev) => [data.event, ...prev]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record event');
    }
  };

  const sport = match?.tournamentId?.sport;

  const renderScorer = () => {
    if (!scorecard || scorecard.status === 'not_started') return null;
    const props = {
      scoreState: scorecard.scoreState,
      match,
      onAddEvent: handleAddEvent,
    };
    switch (sport) {
      case 'cricket':    return <CricketScorer {...props} />;
      case 'football':   return <FootballScorer {...props} />;
      case 'badminton':  return <BadmintonScorer {...props} />;
      case 'kabaddi':    return <KabaddiScorer {...props} />;
      case 'basketball': return <BasketballScorer {...props} />;
      case 'volleyball': return <VolleyballScorer {...props} />;
      default:           return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/scorer/dashboard')}
          className="text-white/40 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <div className="flex items-center gap-2 justify-center">
            <span>{sportEmoji[sport]}</span>
            <span className="text-white font-black text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>
              {match?.team1Id?.teamName} vs {match?.team2Id?.teamName}
            </span>
          </div>
          <div className="text-xs text-white/40 mt-0.5">{match?.roundName} · Match #{match?.matchNumber}</div>
        </div>
        {scorecard?.status === 'live' && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-400 font-semibold">LIVE</span>
          </div>
        )}
        {scorecard?.status !== 'live' && <div className="w-8" />}
      </div>

      <div className="max-w-lg mx-auto px-5 py-6">
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-900/50 border border-red-500/30 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Not started */}
        {(!scorecard || scorecard.status === 'not_started') && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">{sportEmoji[sport]}</div>
            <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              Ready to score?
            </h2>
            <p className="text-white/40 text-sm mb-8">
              {match?.team1Id?.teamName} vs {match?.team2Id?.teamName}
            </p>
            <button
              onClick={handleStartMatch}
              disabled={starting}
              className="px-8 py-4 bg-blue-600 text-white font-black text-lg rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-60"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {starting ? 'Starting...' : '▶ Start Match'}
            </button>
          </div>
        )}

        {/* Scorer interface */}
        {scorecard?.status === 'live' && renderScorer()}

        {/* Event feed */}
        {events.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Event Feed</h3>
            <div className="flex flex-col gap-2">
              {events.slice(0, 10).map((event) => (
                <div key={event._id} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5">
                  <span className="text-xs text-white/30 flex-shrink-0">
                    {new Date(event.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-xs text-white/70 capitalize">{event.eventType.replace(/_/g, ' ')}</span>
                  {event.playerName && (
                    <span className="text-xs text-blue-400 ml-auto">{event.playerName}</span>
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