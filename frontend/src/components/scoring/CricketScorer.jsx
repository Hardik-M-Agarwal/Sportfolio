import { useState } from 'react';

const ballTypes = ['normal', 'wide', 'no-ball', 'bye', 'leg-bye'];

export default function CricketScorer({ scoreState, match, onAddEvent }) {
  const [batsmanName, setBatsmanName] = useState('');
  const [bowlerName, setBowlerName] = useState('');
  const [catchName, setCatchName] = useState('');
  const [ballRuns, setBallRuns] = useState(0);
  const [extras, setExtras] = useState(0);
  const [ballType, setBallType] = useState('normal');
  const [isWicket, setIsWicket] = useState(false);
  const [dismissalType, setDismissalType] = useState('bowled');

  const battingTeamKey = scoreState?.currentBatting || 'team1';
  const battingTeam = scoreState?.[battingTeamKey];
  const bowlingTeamKey = battingTeamKey === 'team1' ? 'team2' : 'team1';
  const bowlingTeam = scoreState?.[bowlingTeamKey];

  // get players from match
  const battingPlayers = battingTeamKey === 'team1'
    ? match?.team1Id?.players || []
    : match?.team2Id?.players || [];
  const bowlingPlayers = battingTeamKey === 'team1'
    ? match?.team2Id?.players || []
    : match?.team1Id?.players || [];

  const battingTeamId = battingTeamKey === 'team1'
    ? match?.team1Id?._id
    : match?.team2Id?._id;

  const handleBall = () => {
    onAddEvent({
      eventType: 'ball',
      teamId: battingTeamId,
      playerName: batsmanName,
      data: {
        runs: ballRuns,
        extras,
        isWicket,
        ballType,
        dismissalType: isWicket ? dismissalType : null,
        batsmanName,
        bowlerName,
        catchName: dismissalType === 'caught' ? catchName : null,
      },
    });

    // reset ball
    setBallRuns(0);
    setExtras(0);
    setBallType('normal');
    setIsWicket(false);
    setDismissalType('bowled');
    setCatchName('');
  };

  const handleInningsComplete = () => {
    onAddEvent({ eventType: 'innings_complete', data: {} });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Live score */}
      <div className="bg-gray-900 rounded-2xl p-5">
        <div className="grid grid-cols-2 gap-4">
          {['team1', 'team2'].map((key) => {
            const team = scoreState?.[key];
            const isBatting = scoreState?.currentBatting === key;
            return (
              <div key={key} className={`rounded-xl p-4 ${isBatting ? 'bg-blue-600' : 'bg-white/10'}`}>
                <p className="text-xs text-white/60 mb-1">{team?.name}</p>
                <p className="text-3xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {team?.runs}/{team?.wickets}
                </p>
                <p className="text-xs text-white/60 mt-1">{team?.overs} overs</p>
                {isBatting && <span className="text-xs font-bold text-white/80 bg-white/20 px-2 py-0.5 rounded-full mt-2 inline-block">Batting</span>}
              </div>
            );
          })}
        </div>

        {/* Ball history */}
        {scoreState?.ballHistory?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-white/40 mb-2">This over</p>
            <div className="flex gap-1.5 flex-wrap">
              {scoreState.ballHistory.slice(-6).map((ball, i) => (
                <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  ${ball.isWicket ? 'bg-red-500 text-white' :
                    ball.runs === 4 ? 'bg-blue-500 text-white' :
                    ball.runs === 6 ? 'bg-purple-500 text-white' :
                    ball.extras > 0 ? 'bg-amber-500 text-white' :
                    'bg-white/20 text-white'}`}>
                  {ball.isWicket ? 'W' : ball.runs === 0 ? '•' : ball.runs}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Player selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Batsman</label>
          <select className="input" value={batsmanName} onChange={(e) => setBatsmanName(e.target.value)}>
            <option value="">Select batsman</option>
            {battingPlayers.map((p) => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Bowler</label>
          <select className="input" value={bowlerName} onChange={(e) => setBowlerName(e.target.value)}>
            <option value="">Select bowler</option>
            {bowlingPlayers.map((p) => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ball type */}
      <div>
        <label className="label">Ball Type</label>
        <div className="flex gap-2 flex-wrap">
          {ballTypes.map((t) => (
            <button
              key={t}
              onClick={() => setBallType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all capitalize
                ${ballType === t ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Runs */}
      <div>
        <label className="label">Runs off bat</label>
        <div className="flex gap-2 flex-wrap">
          {[0, 1, 2, 3, 4, 5, 6].map((r) => (
            <button
              key={r}
              onClick={() => setBallRuns(r)}
              className={`w-12 h-12 rounded-xl text-sm font-black border-2 transition-all
                ${ballRuns === r
                  ? r === 4 ? 'border-blue-500 bg-blue-600 text-white'
                  : r === 6 ? 'border-purple-500 bg-purple-600 text-white'
                  : 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 text-gray-600'}`}
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Wicket */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setIsWicket(!isWicket)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all
              ${isWicket ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200 text-gray-500'}`}
          >
            {isWicket ? '🔴 Wicket!' : 'Wicket?'}
          </button>
        </div>

        {isWicket && (
          <div className="flex flex-col gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div>
              <label className="label">Dismissal Type</label>
              <div className="flex gap-2 flex-wrap">
                {['bowled', 'caught', 'lbw', 'run out', 'stumped', 'hit wicket'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDismissalType(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 capitalize transition-all
                      ${dismissalType === d ? 'border-red-500 bg-red-100 text-red-600' : 'border-gray-200 text-gray-500 bg-white'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            {dismissalType === 'caught' && (
              <div>
                <label className="label">Caught by</label>
                <select className="input" value={catchName} onChange={(e) => setCatchName(e.target.value)}>
                  <option value="">Select fielder</option>
                  {bowlingPlayers.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit ball */}
      <button
        onClick={handleBall}
        disabled={!batsmanName || !bowlerName}
        className="w-full py-4 text-base font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        Record Ball
      </button>

      {/* Innings complete */}
      {scoreState?.currentInnings === 1 && (
        <button
          onClick={handleInningsComplete}
          className="w-full py-3 text-sm font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
        >
          End Innings →
        </button>
      )}
    </div>
  );
}