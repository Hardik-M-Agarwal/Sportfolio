import { useState } from 'react';
import matchService from '../../services/matchService';

export default function ScheduleMatchModal({ match, onClose, onScheduled }) {
  const [form, setForm] = useState({
    matchDate: match.matchDate ? new Date(match.matchDate).toISOString().split('T')[0] : '',
    matchTime: match.matchTime || '',
    venue: match.venue || '',
    ground: match.ground || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.matchDate) { setError('Match date is required'); return; }
    if (!form.matchTime) { setError('Match time is required'); return; }
    setLoading(true);
    try {
      const data = await matchService.scheduleMatch(match._id, form);
      onScheduled(data.match);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule match');
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
              Schedule Match
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {match.team1Id?.teamName} vs {match.team2Id?.teamName}
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

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Match Date</label>
              <input
                type="date"
                className="input"
                value={form.matchDate}
                onChange={(e) => setForm((f) => ({ ...f, matchDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Match Time</label>
              <input
                type="time"
                className="input"
                value={form.matchTime}
                onChange={(e) => setForm((f) => ({ ...f, matchTime: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="label">Venue</label>
            <input
              className="input"
              placeholder="e.g. Wankhede Stadium"
              value={form.venue}
              onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Ground / Court</label>
            <input
              className="input"
              placeholder="e.g. Ground 1, Court A"
              value={form.ground}
              onChange={(e) => setForm((f) => ({ ...f, ground: e.target.value }))}
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
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}