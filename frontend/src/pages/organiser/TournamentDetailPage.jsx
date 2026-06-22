import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OrganiserLayout from '../../layouts/OrganiserLayout';
import tournamentService from '../../services/tournamentService';
import teamService from '../../services/teamService';
import sponsorshipService from '../../services/sponsorshipService';
import MatchesSection from '../../components/matches/MatchesSection';

const sportEmoji = {
  cricket: '🏏', football: '⚽', badminton: '🏸',
  kabaddi: '🤼', basketball: '🏀', volleyball: '🏐',
};

const statusConfig = {
  upcoming: { color: 'bg-gray-100 text-gray-600', label: 'Upcoming' },
  registration: { color: 'bg-blue-100 text-blue-600', label: 'Registration Open' },
  ongoing: { color: 'bg-emerald-100 text-emerald-600', label: 'Ongoing' },
  completed: { color: 'bg-purple-100 text-purple-600', label: 'Completed' },
};

const paymentConfig = {
  pending: { color: 'bg-red-100 text-red-600', label: 'Pending' },
  paid: { color: 'bg-emerald-100 text-emerald-600', label: 'Paid' },
  cash: { color: 'bg-amber-100 text-amber-600', label: 'Cash' },
};

const tierColor = {
  platinum: 'bg-purple-100 text-purple-600',
  gold: 'bg-yellow-100 text-yellow-600',
  silver: 'bg-gray-100 text-gray-600',
  bronze: 'bg-orange-100 text-orange-600',
};

const statusFlow = ['upcoming', 'registration', 'ongoing', 'completed'];

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// ── Sponsors Section ──────────────────────────────────────────────────
function SponsorsSection({ tournamentId, basePrizePool, onSponsorshipUpdate, onSponsorshipsLoaded }) {
  const [sponsorships, setSponsorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [prizeInput, setPrizeInput] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSponsorships = useCallback(async () => {
    try {
      const data = await sponsorshipService.getSponsorshipsByTournament(tournamentId);
      setSponsorships(data.sponsorships);
      onSponsorshipsLoaded(data.sponsorships);
    } catch (error) {
      console.error('Failed to fetch sponsorships', error);
    } finally {
      setLoading(false);
    }
  }, [tournamentId, onSponsorshipsLoaded]);

  useEffect(() => { fetchSponsorships(); }, [fetchSponsorships]);

  const handleSetPrizeContribution = async (sponsorshipId) => {
    setSaving(true);
    try {
      const data = await sponsorshipService.setPrizeContribution(sponsorshipId, Number(prizeInput));
      const updated = sponsorships.map((s) => s._id === sponsorshipId ? data.sponsorship : s);
      setSponsorships(updated);
      onSponsorshipsLoaded(updated);
      setEditingId(null);
      setPrizeInput('');
      onSponsorshipUpdate();
    } catch (error) {
      console.error('Failed to set prize contribution', error);
    } finally {
      setSaving(false);
    }
  };

  const totalSponsorshipRevenue = sponsorships.reduce((sum, s) => sum + s.amount, 0);
  const totalPrizeContribution = sponsorships.reduce((sum, s) => sum + s.prizeContribution, 0);
  const totalPrizePool = basePrizePool + totalPrizeContribution;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
      <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4"
        style={{ fontFamily: "'Syne', sans-serif" }}>
        Sponsors
      </h2>

      {sponsorships.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: 'Sponsorship Revenue', value: `₹${totalSponsorshipRevenue.toLocaleString('en-IN')}`, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Sponsor Prize Contribution', value: `₹${totalPrizeContribution.toLocaleString('en-IN')}`, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Total Prize Pool', value: `₹${totalPrizePool.toLocaleString('en-IN')}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-lg font-black ${s.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sponsorships.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
          <div className="text-3xl mb-2">💼</div>
          <p className="text-gray-400 text-sm">No sponsors yet.</p>
          <p className="text-gray-300 text-xs mt-1">Sponsors will appear here once they pay.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sponsorships.map((s) => (
            <div key={s._id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-base text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                      {s.businessName}
                    </h3>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${tierColor[s.tier]}`}>
                      {s.tier}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {s.sponsorId?.name} · {s.sponsorId?.email}
                    {s.sponsorId?.phone && ` · ${s.sponsorId.phone}`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Amount paid</div>
                  <div className="text-lg font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                    ₹{s.amount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Prize Pool Contribution</p>
                {editingId === s._id ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">₹</span>
                    <input
                      type="number"
                      className="input w-32 py-1.5 text-sm"
                      placeholder="0"
                      min={0}
                      max={s.amount}
                      value={prizeInput}
                      onChange={(e) => setPrizeInput(e.target.value)}
                    />
                    <button
                      onClick={() => handleSetPrizeContribution(s._id)}
                      disabled={saving}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setPrizeInput(''); }}
                      className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-base font-black text-purple-600" style={{ fontFamily: "'Syne', sans-serif" }}>
                      ₹{s.prizeContribution.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-gray-300">
                      · ₹{(s.amount - s.prizeContribution).toLocaleString('en-IN')} to operations
                    </span>
                    <button
                      onClick={() => { setEditingId(s._id); setPrizeInput(s.prizeContribution); }}
                      className="text-xs text-blue-600 font-semibold hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function TournamentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [sponsorships, setSponsorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [tData, teamsData] = await Promise.all([
        tournamentService.getTournament(id),
        teamService.getTeamsByTournament(id),
      ]);
      setTournament(tData.tournament);
      setTeams(teamsData.teams);
    } catch (error) {
      console.error('Failed to fetch tournament', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    try {
      const data = await tournamentService.updateStatus(id, newStatus);
      setTournament(data.tournament);
    } catch (error) {
      console.error('Failed to update status', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleApprove = async (teamId) => {
    try {
      await teamService.approveTeam(teamId);
      setTeams((prev) => prev.map((t) => t._id === teamId ? { ...t, isApproved: true } : t));
    } catch (error) {
      console.error('Failed to approve team', error);
    }
  };

  const handleMarkPaid = async (teamId) => {
    try {
      await teamService.markTeamPaid(teamId);
      setTeams((prev) => prev.map((t) => t._id === teamId ? { ...t, paymentStatus: 'cash', isApproved: true } : t));
    } catch (error) {
      console.error('Failed to mark team as paid', error);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(tournament.tournamentCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading) {
    return (
      <OrganiserLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </OrganiserLayout>
    );
  }

  if (!tournament) {
    return (
      <OrganiserLayout>
        <div className="p-8 text-center">
          <p className="text-gray-400">Tournament not found.</p>
          <button onClick={() => navigate('/organiser/tournaments')} className="mt-4 text-blue-600 text-sm font-semibold hover:underline">
            ← Back to Tournaments
          </button>
        </div>
      </OrganiserLayout>
    );
  }

  const paidTeams = teams.filter((t) => t.paymentStatus === 'paid');
  const cashTeams = teams.filter((t) => t.paymentStatus === 'cash');
  const pendingTeams = teams.filter((t) => t.paymentStatus === 'pending');
  const registeredTeams = teams.filter((t) => !t.isWaitlisted);
  const waitlistedTeams = teams.filter((t) => t.isWaitlisted);

  const entryRevenue = [...paidTeams, ...cashTeams].length * tournament.entryFee;
  const basePrizePool = Math.round(
    tournament.entryFee * registeredTeams.length * tournament.prizeStructure.percentage / 100
  );

  // live sponsor calculations from lifted state
  const totalSponsorshipRevenue = sponsorships.reduce((sum, s) => sum + s.amount, 0);
  const totalPrizeContribution = sponsorships.reduce((sum, s) => sum + s.prizeContribution, 0);
  const totalRevenue = entryRevenue + totalSponsorshipRevenue;
  const totalPrizePool = basePrizePool + totalPrizeContribution;

  const currentStatusIndex = statusFlow.indexOf(tournament.status);
  const prevStatus = currentStatusIndex > 0 ? statusFlow[currentStatusIndex - 1] : null;
  const nextStatus = currentStatusIndex < statusFlow.length - 1 ? statusFlow[currentStatusIndex + 1] : null;

  return (
    <OrganiserLayout>
      <div className="p-8 max-w-6xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate('/organiser/tournaments')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tournaments
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{sportEmoji[tournament.sport]}</div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {tournament.name}
                </h1>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${statusConfig[tournament.status]?.color}`}>
                  {statusConfig[tournament.status]?.label}
                </span>
              </div>
              <p className="text-sm text-gray-400 capitalize">
                {tournament.sport} · {tournament.format} · {tournament.venue.name}, {tournament.venue.city}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {prevStatus && (
              <button
                onClick={() => handleStatusChange(prevStatus)}
                disabled={statusLoading}
                className="px-4 py-2 text-xs font-semibold border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50 capitalize"
              >
                ← {prevStatus}
              </button>
            )}
            {nextStatus && (
              <button
                onClick={() => handleStatusChange(nextStatus)}
                disabled={statusLoading}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 capitalize"
              >
                Move to {nextStatus} →
              </button>
            )}
          </div>
        </div>

        {/* Top grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

          {/* Tournament Info */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 lg:col-span-1">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
              Tournament Info
            </h2>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Sport', value: tournament.sport },
                { label: 'Format', value: tournament.format },
                { label: 'Venue', value: `${tournament.venue.name}, ${tournament.venue.city}` },
                { label: 'Registration', value: `${formatDate(tournament.registrationStartDate)} → ${formatDate(tournament.registrationEndDate)}` },
                { label: 'Tournament', value: `${formatDate(tournament.startDate)} → ${formatDate(tournament.endDate)}` },
                { label: 'Max Teams', value: tournament.maxTeams },
                { label: 'Players/Team', value: tournament.sportConfig?.teamSize },
                { label: 'Entry Fee', value: `₹${tournament.entryFee.toLocaleString('en-IN')}` },
              ].map((r) => (
                <div key={r.label} className="flex justify-between items-start">
                  <span className="text-xs text-gray-400">{r.label}</span>
                  <span className="text-xs font-semibold text-gray-700 text-right capitalize max-w-[60%]">{r.value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">Code</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded font-mono">
                    {tournament.tournamentCode}
                  </span>
                  <button onClick={handleCopyCode} className="text-gray-400 hover:text-blue-600 transition-colors">
                    {copiedCode ? (
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Snapshot — now uses live sponsor data */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 lg:col-span-2">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
              Financial Snapshot
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-5">
              {[
                {
                  label: 'Entry Revenue Collected',
                  value: `₹${entryRevenue.toLocaleString('en-IN')}`,
                  sub: `${paidTeams.length + cashTeams.length} teams paid`,
                  color: 'text-emerald-600', bg: 'bg-emerald-50',
                },
                {
                  label: 'Sponsorship Revenue',
                  value: `₹${totalSponsorshipRevenue.toLocaleString('en-IN')}`,
                  sub: sponsorships.length > 0 ? `${sponsorships.length} sponsor(s)` : 'No sponsors yet',
                  color: 'text-blue-600', bg: 'bg-blue-50',
                },
                {
                  label: 'Total Revenue',
                  value: `₹${totalRevenue.toLocaleString('en-IN')}`,
                  sub: 'Entry + sponsorship',
                  color: 'text-gray-900', bg: 'bg-gray-50',
                },
                {
                  label: 'Total Prize Pool',
                  value: `₹${totalPrizePool.toLocaleString('en-IN')}`,
                  sub: `Base ₹${basePrizePool.toLocaleString('en-IN')} + ₹${totalPrizeContribution.toLocaleString('en-IN')} from sponsors`,
                  color: 'text-purple-600', bg: 'bg-purple-50',
                },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
                  <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                  <p className={`text-xl font-black tracking-tight ${s.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Prize Distribution</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '🥇 Winner', pct: tournament.prizeStructure.distribution.winner },
                  { label: '🥈 Runner-up', pct: tournament.prizeStructure.distribution.runnerUp },
                  { label: '🥉 Third place', pct: tournament.prizeStructure.distribution.third },
                  { label: '⭐ Special awards', pct: tournament.prizeStructure.distribution.special },
                ].map((d) => (
                  <div key={d.label} className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{d.label}</span>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-700">{d.pct}%</span>
                      <span className="text-xs text-gray-400 ml-1">
                        · ₹{Math.round(totalPrizePool * d.pct / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Registration Progress */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider" style={{ fontFamily: "'Syne', sans-serif" }}>
              Registration Progress
            </h2>
            <span className="text-sm font-black text-gray-700" style={{ fontFamily: "'Syne', sans-serif" }}>
              {registeredTeams.length} / {tournament.maxTeams} teams
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${Math.min((registeredTeams.length / tournament.maxTeams) * 100, 100)}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Paid', value: paidTeams.length + cashTeams.length, color: 'text-emerald-600' },
              { label: 'Pending Payment', value: pendingTeams.length, color: 'text-red-500' },
              { label: 'Waitlisted', value: waitlistedTeams.length, color: 'text-amber-500' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className={`text-2xl font-black ${s.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Teams */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-5" style={{ fontFamily: "'Syne', sans-serif" }}>
            Registered Teams ({registeredTeams.length})
          </h2>
          {teams.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-gray-400 text-sm">No teams registered yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {teams.map((team, index) => (
                <div
                  key={team._id}
                  className={`border rounded-xl p-4 ${team.isWaitlisted ? 'border-amber-200 bg-amber-50' : 'border-gray-100'}`}
                >
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-base text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                            {team.teamName}
                          </h3>
                          {team.isWaitlisted && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-700">Waitlisted</span>
                          )}
                          {team.isApproved && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">Approved ✓</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Captain: {team.captainId?.name} · {team.captainId?.email}
                          {team.captainId?.phone && ` · ${team.captainId.phone}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${paymentConfig[team.paymentStatus]?.color}`}>
                        {paymentConfig[team.paymentStatus]?.label}
                      </span>
                      {!team.isApproved && !team.isWaitlisted && (
                        <button
                          onClick={() => handleApprove(team._id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {team.paymentStatus === 'pending' && !team.isWaitlisted && (
                        <button
                          onClick={() => handleMarkPaid(team._id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          Mark as Paid (Cash)
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-2">Players ({team.players?.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {team.players?.map((p, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1">
                          <span className="text-xs font-medium text-gray-600">{p.name}</span>
                          {p.phone && <span className="text-xs text-gray-300">· {p.phone}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Matches */}
        <MatchesSection
          tournament={tournament}
          teams={teams}
        />

        {/* Sponsors */}
        <SponsorsSection
          tournamentId={id}
          basePrizePool={basePrizePool}
          onSponsorshipUpdate={fetchData}
          onSponsorshipsLoaded={setSponsorships}
        />

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all hover:-translate-y-0.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Generate Schedule
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all hover:-translate-y-0.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Broadcast Message
            </button>
            {tournament.status !== 'completed' && (
              <button
                onClick={() => handleStatusChange('completed')}
                disabled={statusLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 text-sm font-semibold rounded-xl hover:bg-red-100 transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Close Tournament
              </button>
            )}
          </div>
        </div>
      </div>
    </OrganiserLayout>
  );
}