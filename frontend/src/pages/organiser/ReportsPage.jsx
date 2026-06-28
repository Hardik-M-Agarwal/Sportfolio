import { useState, useEffect, useCallback } from 'react';
import OrganiserLayout from '../../layouts/OrganiserLayout';
import tournamentService from '../../services/tournamentService';
import sponsorshipService from '../../services/sponsorshipService';
import reportService from '../../services/reportService';

const sportEmoji = {
  cricket: '🏏', football: '⚽', badminton: '🏸',
  kabaddi: '🤼', basketball: '🏀', volleyball: '🏐',
};

const statusConfig = {
  upcoming:     { color: 'bg-gray-100 text-gray-500',       label: 'Upcoming' },
  registration: { color: 'bg-blue-100 text-blue-600',       label: 'Registration' },
  ongoing:      { color: 'bg-emerald-100 text-emerald-600', label: 'Ongoing' },
  completed:    { color: 'bg-purple-100 text-purple-600',   label: 'Completed' },
};

const tierColor = {
  platinum: 'bg-purple-100 text-purple-700',
  gold:     'bg-yellow-100 text-yellow-700',
  silver:   'bg-gray-100 text-gray-600',
  bronze:   'bg-orange-100 text-orange-700',
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const REPORT_TYPES = [
  { key: 'financial', icon: '💰', label: 'Financial Summary', desc: 'Revenue, expenses, net surplus, prize pool breakdown.',          color: 'bg-emerald-50 border-emerald-200', btnColor: 'bg-emerald-600 hover:bg-emerald-700' },
  { key: 'teams',     icon: '👥', label: 'Team Performance',  desc: 'Standings, match results, player list and stats per team.',      color: 'bg-blue-50 border-blue-200',       btnColor: 'bg-blue-600 hover:bg-blue-700' },
  { key: 'sponsor',   icon: '💼', label: 'Sponsor Impact',    desc: 'ML-powered audience reach, ROI rating, and sponsor thank you.', color: 'bg-amber-50 border-amber-200',     btnColor: 'bg-amber-500 hover:bg-amber-600' },
];

export default function ReportsPage() {
  const [tournaments, setTournaments]     = useState([]);
  const [sponsorships, setSponsorships]   = useState({});
  const [loading, setLoading]             = useState(true);
  const [generating, setGenerating]       = useState({});
  const [sponsorModal, setSponsorModal]   = useState(null); // { tournamentId, tournamentName }

  const fetchData = useCallback(async () => {
    try {
      const data = await tournamentService.getMyTournaments();
      const ts   = data.tournaments || [];
      setTournaments(ts);

      // fetch sponsorships for completed tournaments
      const completed = ts.filter((t) => t.status === 'completed');
      const sponsorMap = {};
      await Promise.all(completed.map(async (t) => {
        try {
          const sData = await sponsorshipService.getSponsorshipsByTournament(t._id);
          sponsorMap[t._id] = sData.sponsorships || [];
        } catch { sponsorMap[t._id] = []; }
      }));
      setSponsorships(sponsorMap);
    } catch (err) {
      console.error('Failed to fetch', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDownload = async (tournamentId, tournamentName, type, sponsorshipId = null) => {
    const key = `${tournamentId}-${type}`;
    setGenerating((prev) => ({ ...prev, [key]: true }));
    try {
      if (type === 'financial') await reportService.downloadFinancialSummary(tournamentId, tournamentName);
      if (type === 'teams')     await reportService.downloadTeamPerformance(tournamentId, tournamentName);
      if (type === 'sponsor')   await reportService.downloadSponsorImpact(tournamentId, sponsorshipId, tournamentName);
    } catch (err) {
      console.error('Report error', err);
      alert('Failed to generate report.');
    } finally {
      setGenerating((prev) => ({ ...prev, [key]: false }));
      setSponsorModal(null);
    }
  };

  const completedTournaments = tournaments.filter((t) => t.status === 'completed');
  const otherTournaments     = tournaments.filter((t) => t.status !== 'completed');

  return (
    <OrganiserLayout>
      <div className="p-8 max-w-5xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
            Reports
          </h1>
          <p className="text-gray-500 mt-1">Generate and download PDF reports for your tournaments.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tournaments.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">📄</div>
            <p className="text-gray-400 text-sm">No tournaments yet. Create one to generate reports.</p>
          </div>
        ) : (
          <>
            {/* Report type info cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {REPORT_TYPES.map((r) => (
                <div key={r.key} className={`border rounded-2xl p-5 ${r.color}`}>
                  <div className="text-2xl mb-2">{r.icon}</div>
                  <h3 className="text-sm font-black text-gray-900 mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {r.label}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{r.desc}</p>
                </div>
              ))}
            </div>

            {/* Completed tournaments */}
            {completedTournaments.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4"
                  style={{ fontFamily: "'Syne', sans-serif" }}>
                  ✅ Completed Tournaments
                </h2>
                <div className="flex flex-col gap-4">
                  {completedTournaments.map((t) => (
                    <TournamentReportCard
                      key={t._id}
                      tournament={t}
                      generating={generating}
                      sponsorships={sponsorships[t._id] || []}
                      onDownload={handleDownload}
                      onSponsorClick={() => setSponsorModal({ tournamentId: t._id, tournamentName: t.name })}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other tournaments */}
            {otherTournaments.length > 0 && (
              <div>
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4"
                  style={{ fontFamily: "'Syne', sans-serif" }}>
                  Other Tournaments
                </h2>
                <div className="flex flex-col gap-3">
                  {otherTournaments.map((t) => (
                    <div key={t._id} className="bg-white border border-gray-200 rounded-xl p-5 opacity-60">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{sportEmoji[t.sport]}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-base text-gray-700" style={{ fontFamily: "'Syne', sans-serif" }}>
                              {t.name}
                            </h3>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusConfig[t.status]?.color}`}>
                              {statusConfig[t.status]?.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 capitalize">{t.sport} · {t.format} · {t.venue?.city}</p>
                        </div>
                        <p className="text-xs text-gray-400 ml-auto">Reports available after tournament completes</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sponsor selector modal */}
      {sponsorModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={() => setSponsorModal(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-black text-gray-900 mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
              Select Sponsor
            </h3>
            <p className="text-xs text-gray-400 mb-4">Choose which sponsor to generate the impact report for.</p>

            {(sponsorships[sponsorModal.tournamentId] || []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No sponsors for this tournament.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {(sponsorships[sponsorModal.tournamentId] || []).map((sp) => (
                  <button
                    key={sp._id}
                    onClick={() => handleDownload(sponsorModal.tournamentId, sponsorModal.tournamentName, 'sponsor', sp._id)}
                    disabled={generating[`${sponsorModal.tournamentId}-sponsor`]}
                    className="flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl hover:bg-amber-50 hover:border-amber-300 transition-all text-left disabled:opacity-50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{sp.businessName}</p>
                      <p className="text-xs text-gray-400">₹{sp.amount.toLocaleString('en-IN')}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${tierColor[sp.tier]}`}>
                      {sp.tier}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setSponsorModal(null)}
              className="w-full mt-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </OrganiserLayout>
  );
}

function TournamentReportCard({ tournament: t, generating, sponsorships, onDownload, onSponsorClick }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{sportEmoji[t.sport]}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-lg text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>{t.name}</h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusConfig[t.status]?.color}`}>
                {statusConfig[t.status]?.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 capitalize mt-0.5">{t.sport} · {t.format} · {t.venue?.name}, {t.venue?.city}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(t.startDate)} → {formatDate(t.endDate)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {[
            { label: 'Teams',     value: `${t.registeredCount || 0} / ${t.maxTeams}` },
            { label: 'Sponsors',  value: sponsorships.length },
            { label: 'Entry Fee', value: `₹${t.entryFee.toLocaleString('en-IN')}` },
          ].map((s) => (
            <div key={s.label} className="text-right">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-sm font-black text-gray-700" style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Download Reports</p>
        <div className="flex flex-wrap gap-3">
          {REPORT_TYPES.map((r) => {
            const key         = `${t._id}-${r.key}`;
            const isGenerating = generating[key];
            const isSponsor   = r.key === 'sponsor';

            return (
              <button
                key={r.key}
                onClick={() => isSponsor ? onSponsorClick() : onDownload(t._id, t.name, r.key)}
                disabled={isGenerating || (isSponsor && sponsorships.length === 0)}
                className={`flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 ${r.btnColor}`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {r.icon} {r.label}
                    {isSponsor && sponsorships.length === 0 && (
                      <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">No sponsors</span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}