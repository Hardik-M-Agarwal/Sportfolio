import { useState } from 'react';
import matchService from '../../services/matchService';

export default function GenerateScheduleModal({ tournament, teams, onClose, onGenerated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const approvedTeams = teams.filter((t) => t.isApproved && !t.isWaitlisted);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await matchService.generateSchedule(tournament._id);
      onGenerated(data.matches);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate schedule');
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
          <h2 className="text-xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
            Generate Schedule
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 flex flex-col gap-3">
          {[
            { label: 'Tournament', value: tournament.name },
            { label: 'Format', value: tournament.format },
            { label: 'Approved teams', value: approvedTeams.length },
          ].map((r) => (
            <div key={r.label} className="flex justify-between">
              <span className="text-xs text-gray-400">{r.label}</span>
              <span className="text-xs font-semibold text-gray-700 capitalize">{r.value}</span>
            </div>
          ))}
        </div>

        {/* Warning if existing matches */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
          <p className="text-xs text-amber-700 font-medium">
            ⚠️ If a schedule already exists, it will be replaced. This cannot be undone.
          </p>
        </div>

        {approvedTeams.length < 2 && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
            <p className="text-xs text-red-600 font-medium">
              At least 2 approved teams are required to generate a schedule.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
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
            onClick={handleGenerate}
            disabled={loading || approvedTeams.length < 2}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              '🗓️ Generate'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}