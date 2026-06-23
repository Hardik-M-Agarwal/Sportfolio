import { useState, useEffect } from 'react';
import scoringService from '../../services/scoringService';

export default function AssignScorerModal({ match, tournament, onClose, onAssigned }) {
  const [scorers, setScorers] = useState([]);
  const [selectedScorerId, setSelectedScorerId] = useState(match.scorerId?._id || match.scorerId || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchScorers = async () => {
      try {
        const data = await scoringService.getScorersByTournament(tournament._id);
        setScorers(data.scorers);
      } catch (err) {
        setError('Failed to load scorers');
      } finally {
        setLoading(false);
      }
    };
    fetchScorers();
  }, [tournament._id]);

  const handleAssign = async () => {
    if (!selectedScorerId) { setError('Please select a scorer'); return; }
    setSaving(true);
    setError('');
    try {
      const data = await scoringService.assignScorer(match._id, selectedScorerId);
      onAssigned(data.match);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign scorer');
    } finally {
      setSaving(false);
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
              Assign Scorer
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Match #{match.matchNumber} · {match.team1Id?.teamName} vs {match.team2Id?.teamName}
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

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : scorers.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl mb-5">
            <div className="text-3xl mb-2">🎯</div>
            <p className="text-gray-500 text-sm font-medium">No scorers registered yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Share tournament code{' '}
              <span className="font-mono font-bold text-gray-600">{tournament.tournamentCode}</span>
              {' '}so scorers can sign up.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 block">
              Select Scorer
            </label>
            {scorers.map((scorer) => (
              <button
                key={scorer._id}
                type="button"
                onClick={() => { setSelectedScorerId(scorer._id); setError(''); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all
                  ${selectedScorerId === scorer._id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                  ${selectedScorerId === scorer._id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {scorer.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800">{scorer.name}</div>
                  <div className="text-xs text-gray-400 truncate">{scorer.email}</div>
                </div>
                {scorer.phone && (
                  <span className="text-xs text-gray-400 flex-shrink-0">{scorer.phone}</span>
                )}
                {selectedScorerId === scorer._id && (
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 12 12">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={saving || !selectedScorerId || scorers.length === 0}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {saving ? 'Assigning...' : 'Assign Scorer'}
          </button>
        </div>
      </div>
    </div>
  );
}