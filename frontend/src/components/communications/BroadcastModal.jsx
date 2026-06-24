import { useState, useEffect } from 'react';
import api from '../../services/api';

const templates = [
  {
    label: '📅 Match reminder',
    message: 'Your match is scheduled for tomorrow. Please ensure your team is present 30 minutes before the match time. Bring your ID proof.',
  },
  {
    label: '🏆 Match day',
    message: 'Match day is here! Your match is scheduled for today. Report to the venue on time. Best of luck!',
  },
  {
    label: '💰 Payment reminder',
    message: 'This is a reminder to complete your entry fee payment at the earliest to confirm your team\'s participation.',
  },
  {
    label: '🎉 Prize ceremony',
    message: 'The prize ceremony will be held after the final match. All teams are requested to be present. Certificates and prizes will be distributed.',
  },
  {
    label: '📋 General update',
    message: '',
  },
];

export default function BroadcastModal({ tournament, onClose }) {
  const [teams, setTeams] = useState([]);
  const [recipientType, setRecipientType] = useState('all_captains');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await api.get(`/communications/teams/${tournament._id}`);
        setTeams(response.data.teams);
      } catch (err) {
        console.error('Failed to fetch teams', err);
      } finally {
        setFetching(false);
      }
    };
    fetchTeams();
  }, [tournament._id]);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template.label);
    setMessage(template.message);
    setError('');
  };

  const getRecipientCount = () => {
    if (recipientType === 'all_captains') return teams.length;
    if (recipientType === 'specific_team') return selectedTeamId ? 1 : 0;
    return 0;
  };

  const handleSend = async () => {
    if (!message.trim()) { setError('Message is required'); return; }
    if (recipientType === 'specific_team' && !selectedTeamId) {
      setError('Please select a team');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.post('/communications/broadcast', {
        tournamentId: tournament._id,
        message,
        recipientType,
        teamId: selectedTeamId || undefined,
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
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
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-7 py-5 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                Broadcast Message
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">{tournament.name} · WhatsApp</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Success state */}
        {result ? (
          <div className="px-7 py-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-black text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              Message Sent!
            </h3>
            <p className="text-gray-500 text-sm mb-2">
              {result.message}
            </p>
            {result.result?.failed > 0 && (
              <p className="text-amber-500 text-xs">
                {result.result.failed} message(s) failed — recipients may not have joined the WhatsApp sandbox.
              </p>
            )}
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="px-7 py-6 flex flex-col gap-5">

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Recipients */}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">
                Send To
              </label>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setRecipientType('all_captains'); setSelectedTeamId(''); setError(''); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all
                    ${recipientType === 'all_captains' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0
                    ${recipientType === 'all_captains' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`} />
                  <div>
                    <div className="text-sm font-semibold text-gray-800">All Team Captains</div>
                    <div className="text-xs text-gray-400">
                      {fetching ? 'Loading...' : `${teams.length} captain(s) in this tournament`}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => { setRecipientType('specific_team'); setError(''); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all
                    ${recipientType === 'specific_team' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0
                    ${recipientType === 'specific_team' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`} />
                  <div className="text-sm font-semibold text-gray-800">Specific Team</div>
                </button>
              </div>

              {/* Team selector */}
              {recipientType === 'specific_team' && (
                <div className="mt-3">
                  <select
                    className="input"
                    value={selectedTeamId}
                    onChange={(e) => { setSelectedTeamId(e.target.value); setError(''); }}
                  >
                    <option value="">Select a team...</option>
                    {teams.map((team) => (
                      <option key={team._id} value={team._id}>
                        {team.teamName} — {team.captainId?.name} ({team.captainId?.phone || 'no phone'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Templates */}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">
                Quick Templates
              </label>
              <div className="flex flex-wrap gap-2">
                {templates.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => handleTemplateSelect(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                      ${selectedTemplate === t.label
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 block">
                Message
              </label>
              <textarea
                className="input min-h-32 resize-none"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => { setMessage(e.target.value); setError(''); }}
                rows={5}
              />
              <p className="text-xs text-gray-400 mt-1">{message.length} characters</p>
            </div>

            {/* Preview */}
            {message && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-green-700 mb-2">WhatsApp Preview</p>
                <div className="bg-white rounded-lg px-3 py-2 shadow-sm inline-block max-w-full">
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">
                    <strong>{tournament.name}</strong>{'\n\n'}{message}{'\n\n'}
                    <em className="text-gray-400">Sent by organiser via Sportfolio</em>
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={loading || getRecipientCount() === 0}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  `💬 Send to ${getRecipientCount()} recipient${getRecipientCount() !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}