export default function VolleyballScorer({ scoreState, match, onAddEvent }) {
  const handlePoint = (teamKey) => {
    const teamId = teamKey === 'team1' ? match?.team1Id?._id : match?.team2Id?._id;
    onAddEvent({ eventType: 'point', teamId, data: {} });
  };

  const t1 = scoreState?.team1;
  const t2 = scoreState?.team2;

  return (
    <div className="flex flex-col gap-5">
      {/* Scoreboard */}
      <div className="bg-gray-900 rounded-2xl p-5">
        <p className="text-xs text-white/40 text-center mb-3">Set {scoreState?.currentSet || 1}</p>
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-xs text-white/60 mb-1">{t1?.name}</p>
            <p className="text-5xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              {t1?.currentSetPoints ?? 0}
            </p>
            <p className="text-xs text-white/40 mt-1">Sets: {t1?.sets ?? 0}</p>
          </div>
          <div className="text-white/30 text-2xl font-bold">—</div>
          <div className="text-center flex-1">
            <p className="text-xs text-white/60 mb-1">{t2?.name}</p>
            <p className="text-5xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              {t2?.currentSetPoints ?? 0}
            </p>
            <p className="text-xs text-white/40 mt-1">Sets: {t2?.sets ?? 0}</p>
          </div>
        </div>

        {scoreState?.sets?.length > 0 && (
          <div className="mt-4 flex flex-col gap-1">
            <p className="text-xs text-white/30 mb-1">Previous sets</p>
            {scoreState.sets.map((s, i) => (
              <div key={i} className="flex justify-between text-xs text-white/50">
                <span>Set {i + 1}</span>
                <span>{s.team1} — {s.team2}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Point buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handlePoint('team1')}
          className="py-8 rounded-2xl bg-blue-600 text-white font-black text-xl hover:bg-blue-700 active:scale-95 transition-all"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          +1 Point<br />
          <span className="text-sm font-medium opacity-80">{t1?.name}</span>
        </button>
        <button
          onClick={() => handlePoint('team2')}
          className="py-8 rounded-2xl bg-emerald-600 text-white font-black text-xl hover:bg-emerald-700 active:scale-95 transition-all"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          +1 Point<br />
          <span className="text-sm font-medium opacity-80">{t2?.name}</span>
        </button>
      </div>
    </div>
  );
}