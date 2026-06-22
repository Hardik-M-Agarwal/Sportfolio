import { useState } from 'react';

export default function KabaddiScorer({ scoreState, match, onAddEvent }) {
  const [selectedTeam, setSelectedTeam] = useState('team1');
  const [eventType, setEventType] = useState('raid_point');
  const [playerName, setPlayerName] = useState('');
  const [points, setPoints] = useState(1);

  const selectedPlayers = selectedTeam === 'team1'
    ? match?.team1Id?.players || []
    : match?.team2Id?.players || [];

  const selectedTeamId = selectedTeam === 'team1' ? match?.team1Id?._id : match?.team2Id?._id;

  const handleEvent = () => {
    onAddEvent({
      eventType,
      teamId: selectedTeamId,
      playerName,
      data: { points },
    });
    setPlayerName('');
    setPoints(1);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Score */}
      <div className="bg-gray-900 rounded-2xl p-5">
        <p className="text-xs text-white/40 text-center mb-3">
          {scoreState?.half === 2 ? '2nd Half' : '1st Half'}
        </p>
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-xs text-white/60 mb-1">{scoreState?.team1?.name}</p>
            <p className="text-5xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              {scoreState?.team1?.score ?? 0}
            </p>
          </div>
          <div className="text-white/30 text-2xl font-bold">—</div>
          <div className="text-center flex-1">
            <p className="text-xs text-white/60 mb-1">{scoreState?.team2?.name}</p>
            <p className="text-5xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              {scoreState?.team2?.score ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Event type */}
      <div>
        <label className="label">Event</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { type: 'raid_point', label: '🏃 Raid Point' },
            { type: 'tackle_point', label: '💪 Tackle Point' },
            { type: 'all_out', label: '🎯 All Out (+2)' },
            { type: 'half_time', label: '⏱️ Half Time' },
          ].map((e) => (
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

      {eventType !== 'half_time' && (
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
                  onClick={() => setSelectedTeam(t.key)}
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
              <label className="label">Points</label>
              <input
                type="number"
                className="input"
                min={1}
                max={10}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
              />
            </div>
          </div>
        </>
      )}

      <button
        onClick={handleEvent}
        className="w-full py-4 text-base font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        Record Event
      </button>
    </div>
  );
}