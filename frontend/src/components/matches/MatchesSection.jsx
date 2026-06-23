import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import matchService from '../../services/matchService';
import GenerateScheduleModal from './GenerateScheduleModal';
import ScheduleMatchModal from './ScheduleMatchModal';
import EnterResultModal from './EnterResultModal';
import AssignScorerModal from './AssignScorerModal';

const statusColor = {
  scheduled: 'bg-gray-100 text-gray-500',
  ongoing:   'bg-blue-100 text-blue-600',
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

export default function MatchesSection({ tournament, teams }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [schedulingMatch, setSchedulingMatch] = useState(null);
  const [resultMatch, setResultMatch] = useState(null);
  const [assigningMatch, setAssigningMatch] = useState(null);

  const fetchMatches = useCallback(async () => {
    try {
      const data = await matchService.getMatchesByTournament(tournament._id);
      setMatches(data.matches);
    } catch (error) {
      console.error('Failed to fetch matches', error);
    } finally {
      setLoading(false);
    }
  }, [tournament._id]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  const handleGenerated = (newMatches) => {
    setMatches(newMatches);
    setShowGenerate(false);
  };

  const handleScheduled = (updatedMatch) => {
    setMatches((prev) => prev.map((m) => m._id === updatedMatch._id ? updatedMatch : m));
    setSchedulingMatch(null);
  };

  const handleResultEntered = (updatedMatch) => {
    setMatches((prev) => prev.map((m) => m._id === updatedMatch._id ? updatedMatch : m));
    setResultMatch(null);
  };

  const handleScorerAssigned = (updatedMatch) => {
    setMatches((prev) => prev.map((m) => m._id === updatedMatch._id ? { ...m, scorerId: updatedMatch.scorerId } : m));
    setAssigningMatch(null);
  };

  // group matches by round
  const rounds = matches.reduce((acc, match) => {
    const key = match.roundName || `Round ${match.round}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {});

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            Schedule & Matches
          </h2>
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all hover:-translate-y-0.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {matches.length > 0 ? 'Regenerate' : 'Generate Schedule'}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
            <div className="text-4xl mb-3">🗓️</div>
            <p className="text-gray-400 text-sm font-medium">No schedule generated yet.</p>
            <p className="text-gray-300 text-xs mt-1">
              Click "Generate Schedule" to auto-create fixtures for all approved teams.
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
                  <div className="text-xs text-gray-300">{roundMatches.length} match{roundMatches.length > 1 ? 'es' : ''}</div>
                </div>

                <div className="flex flex-col gap-3">
                  {roundMatches.map((match) => (
                    <MatchCard
                      key={match._id}
                      match={match}
                      tournament={tournament}
                      onSchedule={() => setSchedulingMatch(match)}
                      onResult={() => setResultMatch(match)}
                      onAssignScorer={() => setAssigningMatch(match)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showGenerate && (
        <GenerateScheduleModal
          tournament={tournament}
          teams={teams}
          onClose={() => setShowGenerate(false)}
          onGenerated={handleGenerated}
        />
      )}

      {schedulingMatch && (
        <ScheduleMatchModal
          match={schedulingMatch}
          onClose={() => setSchedulingMatch(null)}
          onScheduled={handleScheduled}
        />
      )}

      {resultMatch && (
        <EnterResultModal
          match={resultMatch}
          tournament={tournament}
          onClose={() => setResultMatch(null)}
          onResultEntered={handleResultEntered}
        />
      )}

      {assigningMatch && (
        <AssignScorerModal
          match={assigningMatch}
          tournament={tournament}
          onClose={() => setAssigningMatch(null)}
          onAssigned={handleScorerAssigned}
        />
      )}
    </>
  );
}

function MatchCard({ match, tournament, onSchedule, onResult, onAssignScorer }) {
  const navigate = useNavigate();
  const isCompleted = match.status === 'completed';
  const winner = match.result?.winnerId;
  const hasScorer = match.scorerId;

  return (
    <div className={`border rounded-xl p-4 transition-all
      ${isCompleted ? 'border-emerald-100 bg-emerald-50/30' : 'border-gray-100 hover:border-gray-200'}`}
    >
      <div className="flex items-start justify-between flex-wrap gap-3">
        {/* Match info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-bold text-gray-300 font-mono">#{match.matchNumber}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[match.status]}`}>
              {match.status}
            </span>
            {match.group && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-500">
                Group {match.group}
              </span>
            )}
            {/* Scorer badge */}
            {hasScorer && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-500 flex items-center gap-1">
                🎯 {match.scorerId?.name || 'Scorer assigned'}
              </span>
            )}
          </div>

          {/* Teams */}
          <div className="flex items-center gap-3">
            <div className={`flex-1 text-sm font-black tracking-tight
              ${winner && winner._id === match.team1Id?._id ? 'text-emerald-600' : 'text-gray-700'}`}
              style={{ fontFamily: "'Syne', sans-serif" }}>
              {match.team1Id?.teamName}
              {winner && winner._id === match.team1Id?._id && <span className="ml-1 text-xs">🏆</span>}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {isCompleted && match.result ? (
                <div className="flex items-center gap-1 text-xs font-black text-gray-700"
                  style={{ fontFamily: "'Syne', sans-serif" }}>
                  <span className={winner?._id === match.team1Id?._id ? 'text-emerald-600' : 'text-gray-400'}>
                    {match.result.team1Score || '—'}
                  </span>
                  <span className="text-gray-300">vs</span>
                  <span className={winner?._id === match.team2Id?._id ? 'text-emerald-600' : 'text-gray-400'}>
                    {match.result.team2Score || '—'}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-gray-300 font-medium">vs</span>
              )}
            </div>

            <div className={`flex-1 text-sm font-black tracking-tight text-right
              ${winner && winner._id === match.team2Id?._id ? 'text-emerald-600' : 'text-gray-700'}`}
              style={{ fontFamily: "'Syne', sans-serif" }}>
              {winner && winner._id === match.team2Id?._id && <span className="mr-1 text-xs">🏆</span>}
              {match.team2Id?.teamName}
            </div>
          </div>

          {/* Notes */}
          {isCompleted && match.result?.notes && (
            <p className="text-xs text-gray-400 mt-1">{match.result.notes}</p>
          )}

          {/* Schedule info */}
          {(match.matchDate || match.venue) && (
            <div className="flex flex-wrap gap-3 mt-2">
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

        {/* Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0 items-end">
          <div className="flex items-center gap-2">
            {!isCompleted && (
              <button
                onClick={onSchedule}
                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {match.matchDate ? 'Edit Schedule' : 'Set Schedule'}
              </button>
            )}
            {!isCompleted && (
              <button
                onClick={onResult}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Enter Result
              </button>
            )}
            {isCompleted && (
              <button
                onClick={onResult}
                className="px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-400 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Edit Result
              </button>
            )}
          </div>

          {/* Second row of actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onAssignScorer}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors
                ${hasScorer
                  ? 'border border-purple-200 text-purple-600 hover:bg-purple-50'
                  : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              🎯 {hasScorer ? 'Change Scorer' : 'Assign Scorer'}
            </button>

            {/* View live scorecard */}
            <button
              onClick={() => navigate(`/match/${match._id}`)}
              className="px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
            >
              📊 Scorecard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}