import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tournamentService from '../../services/tournamentService';
import teamService from '../../services/teamService';
import matchService from '../../services/matchService';
import sponsorshipService from '../../services/sponsorshipService';

const sportEmoji = {
  cricket: '🏏', football: '⚽', badminton: '🏸',
  kabaddi: '🤼', basketball: '🏀', volleyball: '🏐',
};

const statusColor = {
  upcoming:     'bg-gray-100 text-gray-500',
  registration: 'bg-blue-100 text-blue-600',
  ongoing:      'bg-emerald-100 text-emerald-600',
  completed:    'bg-purple-100 text-purple-600',
};

const matchStatusColor = {
  scheduled: 'bg-gray-100 text-gray-500',
  ongoing:   'bg-blue-100 text-blue-600',
  completed: 'bg-emerald-100 text-emerald-600',
};

const tierColor = {
  platinum: 'bg-purple-100 text-purple-600',
  gold:     'bg-yellow-100 text-yellow-600',
  silver:   'bg-gray-100 text-gray-600',
  bronze:   'bg-orange-100 text-orange-600',
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const formatTime = (time) => {
  if (!time) return null;
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
};

export default function PublicTournamentDetail() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [sponsorships, setSponsorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches');

  const fetchData = useCallback(async () => {
    try {
      const tData = await tournamentService.getTournamentByCode(code);
      const tournament = tData.tournament;
      setTournament(tournament);

      const [teamsData, matchesData, sponsorshipsData] = await Promise.all([
        teamService.getTeamsByTournament(tournament._id),
        matchService.getMatchesByTournament(tournament._id),
        sponsorshipService.getSponsorshipsByTournament(tournament._id),
      ]);

      setTeams(teamsData.teams);
      setMatches(matchesData.matches);
      setSponsorships(sponsorshipsData.sponsorships);
    } catch (error) {
      console.error('Failed to fetch tournament', error);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-black text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
            Tournament not found
          </h2>
          <p className="text-gray-400 text-sm mb-4">Invalid tournament code.</p>
          <button onClick={() => navigate('/tournaments')} className="text-blue-600 text-sm font-semibold hover:underline">
            Browse all tournaments →
          </button>
        </div>
      </div>
    );
  }

  // calculations
  const registeredTeams = teams.filter((t) => !t.isWaitlisted);
  const totalSponsorRevenue = sponsorships.reduce((sum, s) => sum + s.amount, 0);
  const totalPrizeContribution = sponsorships.reduce((sum, s) => sum + s.prizeContribution, 0);
  const basePrizePool = Math.round(tournament.entryFee * registeredTeams.length * tournament.prizeStructure?.percentage / 100);
  const totalPrizePool = basePrizePool + totalPrizeContribution;

  // group matches by round
  const rounds = matches.reduce((acc, match) => {
    const key = match.roundName || `Round ${match.round}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {});

  const tabs = [
    { key: 'matches', label: `Matches (${matches.length})` },
    { key: 'teams', label: `Teams (${registeredTeams.length})` },
    { key: 'sponsors', label: `Sponsors (${sponsorships.length})` },
  ];

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="font-black text-xl tracking-tight text-gray-900"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Sport<span className="text-blue-600">folio</span>
          </button>
          <button
            onClick={() => navigate('/tournaments')}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← All Tournaments
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Tournament hero */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{sportEmoji[tournament.sport]}</div>
              <div>
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h1 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {tournament.name}
                  </h1>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${statusColor[tournament.status]}`}>
                    {tournament.status}
                  </span>
                </div>
                <p className="text-sm text-gray-400 capitalize">
                  {tournament.sport} · {tournament.format} · {tournament.venue?.name}, {tournament.venue?.city}
                </p>
              </div>
            </div>

            {/* Share button */}
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Venue', value: `${tournament.venue?.name}, ${tournament.venue?.city}` },
              { label: 'Tournament Dates', value: `${formatDate(tournament.startDate)} → ${formatDate(tournament.endDate)}` },
              { label: 'Teams', value: `${registeredTeams.length} / ${tournament.maxTeams}` },
              { label: 'Players/Team', value: tournament.sportConfig?.teamSize },
            ].map((r) => (
              <div key={r.label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">{r.label}</p>
                <p className="text-sm font-semibold text-gray-700 capitalize">{r.value}</p>
              </div>
            ))}
          </div>

          {/* Prize pool */}
          <div className="bg-gray-900 rounded-2xl p-6">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-4">Prize Pool</p>
            <div className="flex items-end gap-3 mb-4">
              <p className="text-4xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                ₹{totalPrizePool.toLocaleString('en-IN')}
              </p>
              {totalPrizeContribution > 0 && (
                <p className="text-sm text-white/40 mb-1">
                  Base ₹{basePrizePool.toLocaleString('en-IN')} + ₹{totalPrizeContribution.toLocaleString('en-IN')} from sponsors
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: '🥇 Winner', pct: tournament.prizeStructure?.distribution?.winner },
                { label: '🥈 Runner-up', pct: tournament.prizeStructure?.distribution?.runnerUp },
                { label: '🥉 Third place', pct: tournament.prizeStructure?.distribution?.third },
                { label: '⭐ Special awards', pct: tournament.prizeStructure?.distribution?.special },
              ].map((d) => (
                <div key={d.label} className="bg-white/10 rounded-xl p-3">
                  <p className="text-xs text-white/50 mb-1">{d.label}</p>
                  <p className="text-base font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                    ₹{Math.round(totalPrizePool * (d.pct || 0) / 100).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-white/30">{d.pct}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Organised by */}
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Organised by <span className="font-semibold text-gray-600">{tournament.organiserId?.name}</span>
            <span>·</span>
            <span>{tournament.organiserId?.email}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all
                ${activeTab === tab.key
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Matches tab */}
        {activeTab === 'matches' && (
          <div className="flex flex-col gap-6">
            {matches.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
                <div className="text-4xl mb-3">🗓️</div>
                <p className="text-gray-400 text-sm">No matches scheduled yet.</p>
              </div>
            ) : (
              Object.entries(rounds).map(([roundName, roundMatches]) => (
                <div key={roundName}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      {roundName}
                    </div>
                    <div className="flex-1 h-px bg-gray-200" />
                    <div className="text-xs text-gray-300">{roundMatches.length} match{roundMatches.length > 1 ? 'es' : ''}</div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {roundMatches.map((match) => {
                      const isCompleted = match.status === 'completed';
                      const winner = match.result?.winnerId;

                      return (
                        <div key={match._id} className={`bg-white border rounded-xl p-5
                          ${isCompleted ? 'border-emerald-100' : 'border-gray-200'}`}>
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-3 flex-wrap">
                                <span className="text-xs font-bold text-gray-300 font-mono">#{match.matchNumber}</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${matchStatusColor[match.status]}`}>
                                  {match.status}
                                </span>
                                {match.group && (
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-500">
                                    Group {match.group}
                                  </span>
                                )}
                                {match.status === 'ongoing' && (
                                  <span className="flex items-center gap-1 text-xs font-bold text-red-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    LIVE
                                  </span>
                                )}
                              </div>

                              {/* Teams + score */}
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <p className={`text-base font-black ${winner?._id === match.team1Id?._id ? 'text-emerald-600' : 'text-gray-900'}`}
                                    style={{ fontFamily: "'Syne', sans-serif" }}>
                                    {match.team1Id?.teamName}
                                    {winner?._id === match.team1Id?._id && <span className="ml-1 text-sm">🏆</span>}
                                  </p>
                                  {isCompleted && match.result?.team1Score && (
                                    <p className="text-sm font-bold text-gray-500 mt-0.5">{match.result.team1Score}</p>
                                  )}
                                </div>
                                <span className="text-gray-300 text-sm font-bold flex-shrink-0">vs</span>
                                <div className="flex-1 text-right">
                                  <p className={`text-base font-black ${winner?._id === match.team2Id?._id ? 'text-emerald-600' : 'text-gray-900'}`}
                                    style={{ fontFamily: "'Syne', sans-serif" }}>
                                    {winner?._id === match.team2Id?._id && <span className="mr-1 text-sm">🏆</span>}
                                    {match.team2Id?.teamName}
                                  </p>
                                  {isCompleted && match.result?.team2Score && (
                                    <p className="text-sm font-bold text-gray-500 mt-0.5">{match.result.team2Score}</p>
                                  )}
                                </div>
                              </div>

                              {match.result?.notes && (
                                <p className="text-xs text-gray-400 mt-1">{match.result.notes}</p>
                              )}

                              {/* Schedule info */}
                              {(match.matchDate || match.venue) && (
                                <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">
                                  {match.matchDate && (
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      {formatDate(match.matchDate)}
                                      {match.matchTime && ` · ${formatTime(match.matchTime)}`}
                                    </span>
                                  )}
                                  {match.venue && (
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      </svg>
                                      {match.venue}{match.ground && ` · ${match.ground}`}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Scorecard link */}
                            <button
                              onClick={() => navigate(`/match/${match._id}`)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex-shrink-0 flex items-center gap-1
                                ${match.status === 'ongoing'
                                  ? 'bg-red-500 text-white hover:bg-red-600'
                                  : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >
                              {match.status === 'ongoing' ? '🔴 Watch Live' : '📊 Scorecard'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Teams tab */}
        {activeTab === 'teams' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            {registeredTeams.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">👥</div>
                <p className="text-gray-400 text-sm">No teams registered yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {registeredTeams.map((team, index) => (
                  <div key={team._id} className="flex items-start gap-4 border border-gray-100 rounded-xl p-4">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-base text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                        {team.teamName}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Captain: {team.captainId?.name}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {team.players?.map((p, i) => (
                          <span key={i} className="text-xs bg-gray-50 border border-gray-100 rounded-full px-2.5 py-0.5 text-gray-500">
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sponsors tab */}
        {activeTab === 'sponsors' && (
          <div className="flex flex-col gap-4">
            {sponsorships.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
                <div className="text-4xl mb-3">💼</div>
                <p className="text-gray-400 text-sm">No sponsors yet.</p>
              </div>
            ) : (
              sponsorships.map((s) => (
                <div key={s._id} className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-lg text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                          {s.businessName}
                        </h3>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${tierColor[s.tier]}`}>
                          {s.tier}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">Proud sponsor of this tournament</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Contributing to prize pool</p>
                      <p className="text-lg font-black text-purple-600" style={{ fontFamily: "'Syne', sans-serif" }}>
                        ₹{s.prizeContribution.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}