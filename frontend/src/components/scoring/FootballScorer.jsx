import { useState } from 'react';

export default function FootballScorer({ scoreState, match, onAddEvent }) {
  const [selectedTeam, setSelectedTeam] = useState('team1');
  const [playerName, setPlayerName] = useState('');
  const [minute, setMinute] = useState('');
  const [eventType, setEventType] = useState('goal');

  const team1Players = match?.team1Id?.players || [];
  const team2Players = match?.team2Id?.players || [];
  const selectedPlayers = selectedTeam === 'team1' ? team1Players : team2Players;
  const selectedTeamId = selectedTeam === 'team1' ? match?.team1Id?._id : match?.team2Id?._id;

  const handleEvent = () => {
    onAddEvent({
      eventType,
      teamId: selectedTeamId,
      playerName,
      data: { minute: Number(minute) },
    });
    setPlayerName('');
    setMinute('');
  };

  const events = [
    { type: 'goal', label: '⚽ Goal', color: 'border-emerald-500 bg-emerald-50 text-emerald-600' },
    { type: 'assist', label: '🅰️ Assist', color: 'border-blue-500 bg-blue-50 text-blue-600' },
    { type: 'yellow_card', label: '🟡 Yellow Card', color: 'border-yellow-500 bg-yellow-50 text-yellow-600' },
    { type: 'red_card', label: '🔴 Red Card', color: 'border-red-500 bg-red-50 text-red-600' },
    { type: 'half_time', label: '⏱️ Half Time', color: 'border-gray-400 bg-gray-50 text-gray-600' },
    { type: 'full_time', label: '🏁 Full Time', color: 'border-gray-400 bg-gray-50 text-gray-600' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Score */}
      <div className="bg-gray-900 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-xs text-white/60 mb-1">{scoreState?.team1?.name}</p>
            <p className="text-5xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              {scoreState?.team1?.goals ?? 0}
            </p>
          </div>
          <div className="text-center px-4">
            <p className="text-white/40 text-sm font-bold">
              {scoreState?.half === 2 ? '2nd Half' : '1st Half'}
            </p>
            {scoreState?.minute > 0 && (
              <p className="text-white/60 text-xs mt-1">{scoreState.minute}'</p>
            )}
          </div>
          <div className="text-center flex-1">
            <p className="text-xs text-white/60 mb-1">{scoreState?.team2?.name}</p>
            <p className="text-5xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              {scoreState?.team2?.goals ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Event type */}
      <div>
        <label className="label">Event Type</label>
        <div className="grid grid-cols-2 gap-2">
          {events.map((e) => (
            <button
              key={e.type}
              onClick={() => setEventType(e.type)}
              className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all
                ${eventType === e.type ? e.color : 'border-gray-200 text-gray-500'}`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {/* Team + player (not for half/full time) */}
      {!['half_time', 'full_time'].includes(eventType) && (
        <>
          <div>
            <label className="label">Team</label>
            <div className="flex gap-2">
              {[
                { key: 'team1', name: scoreState?.team1?.name },
                { key: 'team2', name: scoreState?.team2?.name },
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Player</label>
              <select className="input" value={playerName} onChange={(e) => setPlayerName(e.target.value)}>
                <option value="">Select player</option>
                {selectedPlayers.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Minute</label>
              <input
                type="number"
                className="input"
                placeholder="e.g. 45"
                min={1}
                max={120}
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      <button
        onClick={handleEvent}
        className="w-full py-4 text-base font-black text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        Record Event
      </button>
    </div>
  );
}