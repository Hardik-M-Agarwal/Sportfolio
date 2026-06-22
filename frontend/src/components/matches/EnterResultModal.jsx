import { useState } from 'react';
import matchService from '../../services/matchService';

export default function EnterResultModal({ match, tournament, onClose, onResultEntered }) {
  const [winnerId, setWinnerId] = useState('');
  const [team1Score, setTeam1Score] = useState('');
  const [team2Score, setTeam2Score] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sport = tournament?.sport;

  const getScorePlaceholder = () => {
    if (sport === 'cricket') return 'e.g. 145/6 (20 ov)';
    if (sport === 'football') return 'e.g. 2';
    if (sport === 'badminton') return 'e.g. 21-15, 21-18';
    if (sport === 'basketball') return 'e.g. 78';
    if (sport === 'volleyball') return 'e.g. 25-20, 25-18';
    if (sport === 'kabaddi') return 'e.g. 35';
    return 'Score';
  };

  const handleSubmit = async () => {
    if (!winnerId) { setError('Please select the winner'); return; }
    setLoading(true);
    try {
      const data = await matchService.enterResult(match._id, {
        winnerId,
        team1Score,
        team2Score,
        notes,
      });
      onResultEntered(data.match);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enter result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
              Enter Result
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Match {match.matchNumber} · {match.roundName}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-5">
          {/* Winner selection */}
          <div>
            <label className="label">Winner</label>
            <div className="flex flex-col gap-2">
              {[match.team1Id, match.team2Id].map((team) => (
                <button
                  key={team._id}
                  type="button"
                  onClick={() => { setWinnerId(team._id); setError(''); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all
                    ${winnerId === team._id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0
                    ${winnerId === team._id ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}
                  />
                  <span className="text-sm font-semibold text-gray-800">{team.teamName}</span>
                  {winnerId === team._id && (
                    <span className="ml-auto text-xs font-bold text-emerald-600">🏆 Winner</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{match.team1Id?.teamName} Score</label>
              <input
                className="input"
                placeholder={getScorePlaceholder()}
                value={team1Score}
                onChange={(e) => setTeam1Score(e.target.value)}
              />
            </div>
            <div>
              <label className="label">{match.team2Id?.teamName} Score</label>
              <input
                className="input"
                placeholder={getScorePlaceholder()}
                value={team2Score}
                onChange={(e) => setTeam2Score(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes (optional)</label>
            <input
              className="input"
              placeholder="e.g. Won by 5 wickets, Extra time, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60"
          >
            {loading ? 'Saving...' : '✓ Confirm Result'}
          </button>
        </div>
      </div>
    </div>
  );
}