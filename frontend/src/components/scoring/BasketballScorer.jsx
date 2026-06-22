import { useState } from 'react';

export default function BasketballScorer({ scoreState, match, onAddEvent }) {
  const [selectedTeam, setSelectedTeam] = useState('team1');
  const [playerName, setPlayerName] = useState('');
  const [eventType, setEventType] = useState('two_point');

  const selectedPlayers = selectedTeam === 'team1'
    ? match?.team1Id?.players || []
    : match?.team2Id?.players || [];

  const selectedTeamId = selectedTeam === 'team1' ? match?.team1Id?._id : match?.team2Id?._id;

  const handleEvent = () => {
    onAddEvent({ eventType, teamId: selectedTeamId, playerName, data: {} });
    setPlayerName('');
  };

  const t1 = scoreState?.team1;
  const t2 = scoreState?.team2;

  const events = [
    { type: 'two_point', label: '🏀 2 Points' },
    { type: 'three_point', label: '🎯 3 Points' },
    { type: 'free_throw', label: '1️⃣ Free Throw' },
    { type: 'assist', label: '🅰️ Assist' },
    { type: 'foul', label: '⚠️ Foul' },
    { type: 'quarter_complete', label: '⏱️ End Quarter' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Score */}
      <div className="bg-gray-900 rounded-2xl p-5">
        <p className="text-xs text-white/40 text-center mb-3">
          Quarter {scoreState?.currentQuarter || 1}
        </p>
        <div className="flex items-center justify-between mb-4">
          <div className="text-center flex-1">
            <p className="text-xs text-white/60 mb-1">{t1?.name}</p>
            <p className="text-5xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              {t1?.score ?? 0}
            </p>
          </div>
          <div className="text-white/30 text-2xl font-bold">—</div>
          <div className="text-center flex-1">
            <p className="text-xs text-white/60 mb-1">{t2?.name}</p>
            <p className="text-5xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              {t2?.score ?? 0}
            </p>
          </div>
        </div>
        {/* Quarter scores */}
        <div className="flex gap-2 justify-center">
          {[0, 1, 2, 3].map((q) => (
            <div key={q} className="text-center">
              <p className="text-xs text-white/30">Q{q + 1}</p>
              <p className="text-xs text-white/60">{t1?.quarters?.[q] ?? 0}-{t2?.quarters?.[q] ?? 0}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Events */}
      <div>
        <label className="label">Event</label>
        <div className="grid grid-cols-2 gap-2">
          {events.map((e) => (
            <button
              key={e.type}
              onClick={() => setEventType(e.type)}
              className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all
                ${eventType === e.type ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500'}`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {eventType !== 'quarter_complete' && (
        <>
          <div>
            <label className="label">Team</label>
            <div className="flex gap-2">
              {[
                { key: 'team1', name: t1?.name },
                { key: 'team2', name: t2?.name },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setSelectedTeam(t.key); setPlayerName(''); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all
                    ${selectedTeam === t.key ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600'}`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Player</label>
            <select className="input" value={playerName} onChange={(e) => setPlayerName(e.target.value)}>
              <option value="">Select player</option>
              {selectedPlayers.map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        </>
      )}

      <button
        onClick={handleEvent}
        className="w-full py-4 text-base font-black text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        Record Event
      </button>
    </div>
  );
}