import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import OrganiserLayout from '../../layouts/OrganiserLayout';
import tournamentService from '../../services/tournamentService';
import expenseService from '../../services/expenseService';
import api from '../../services/api';

const CATEGORIES = [
  { value: 'venue',         label: 'Venue',         icon: '🏟️' },
  { value: 'officials',     label: 'Officials',     icon: '👨‍⚖️' },
  { value: 'equipment',     label: 'Equipment',     icon: '🏏' },
  { value: 'marketing',     label: 'Marketing',     icon: '📢' },
  { value: 'hospitality',   label: 'Hospitality',   icon: '🍽️' },
  { value: 'awards',        label: 'Awards',        icon: '🏆' },
  { value: 'transport',     label: 'Transport',     icon: '🚗' },
  { value: 'miscellaneous', label: 'Miscellaneous', icon: '📦' },
];

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

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function FinanceDashboard() {
  const navigate = useNavigate();

  const [tournaments, setTournaments]   = useState([]);
  const [expenseData, setExpenseData]   = useState(null);
  const [sponsorships, setSponsorships] = useState([]);
  const [loading, setLoading]           = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [tData, eData, sData] = await Promise.all([
        tournamentService.getMyTournaments(),
        expenseService.getMyExpenses(),
        api.get('/outreach/my-sponsorships-summary'),
      ]);
      setTournaments(tData.tournaments || []);
      setExpenseData(eData);
      setSponsorships(sData.data.sponsorships || []);
    } catch (err) {
      console.error('Failed to fetch finance data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <OrganiserLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </OrganiserLayout>
    );
  }

  // ── aggregate calculations ───────────────────────────────────────
  const totalEntryRevenue   = tournaments.reduce((sum, t) => sum + (t.paidTeams || 0) * t.entryFee, 0);
  const totalSponsorRevenue = sponsorships.reduce((sum, s) => sum + s.amount, 0);
  const totalRevenue        = totalEntryRevenue + totalSponsorRevenue;
  const totalExpenses       = expenseData?.totalExpenses || 0;
  const netSurplus          = totalRevenue - totalExpenses;
  const categoryTotals      = expenseData?.categoryTotals || {};
  const allExpenses         = expenseData?.expenses || [];
  const recentExpenses      = [...allExpenses].slice(0, 10);

  const maxExpenseCategory = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  // per-tournament P&L
  const tournamentPnL = tournaments.map((t) => {
    const entryRev   = (t.paidTeams || 0) * t.entryFee;
    const sponsorRev = sponsorships
      .filter((s) => s.tournamentId?._id?.toString() === t._id?.toString())
      .reduce((sum, s) => sum + s.amount, 0);
    const revenue    = entryRev + sponsorRev;
    const expRow     = (expenseData?.byTournament || []).find(
      (e) => e.tournament?._id?.toString() === t._id?.toString()
    );
    const expenses   = expRow?.total || 0;
    const surplus    = revenue - expenses;
    return { tournament: t, revenue, expenses, surplus, entryRev, sponsorRev };
  });

  return (
    <OrganiserLayout>
      <div className="p-8 max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
            Finance Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Aggregate P&L across all your tournaments.</p>
        </div>

        {/* ── Top stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Revenue',  value: `₹${totalRevenue.toLocaleString('en-IN')}`,  color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '💰' },
            { label: 'Total Expenses', value: `₹${totalExpenses.toLocaleString('en-IN')}`, color: 'text-red-500',     bg: 'bg-red-50',     icon: '📉' },
            {
              label: netSurplus >= 0 ? 'Net Surplus' : 'Net Deficit',
              value: `${netSurplus < 0 ? '-' : ''}₹${Math.abs(netSurplus).toLocaleString('en-IN')}`,
              color: netSurplus >= 0 ? 'text-blue-600' : 'text-red-600',
              bg:    netSurplus >= 0 ? 'bg-blue-50'    : 'bg-red-50',
              icon:  netSurplus >= 0 ? '📈' : '⚠️',
            },
            { label: 'Tournaments', value: tournaments.length, color: 'text-purple-600', bg: 'bg-purple-50', icon: '🏆' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-5`}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className={`text-2xl font-black tracking-tight ${s.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                {s.value}
              </div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* ── Revenue breakdown ── */}
          <div className="bg-gray-900 rounded-2xl p-6">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-5">Revenue Sources</p>
            <div className="flex flex-col gap-4">
              {[
                { label: 'Entry Fees',   value: totalEntryRevenue,   barColor: 'bg-emerald-400', textColor: 'text-emerald-400', pct: totalRevenue > 0 ? Math.round(totalEntryRevenue / totalRevenue * 100) : 0 },
                { label: 'Sponsorships', value: totalSponsorRevenue, barColor: 'bg-blue-400',    textColor: 'text-blue-400',    pct: totalRevenue > 0 ? Math.round(totalSponsorRevenue / totalRevenue * 100) : 0 },
              ].map((r) => (
                <div key={r.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-white/50">{r.label}</span>
                    <span className={`text-sm font-black ${r.textColor}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                      ₹{r.value.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${r.barColor}`} style={{ width: `${r.pct}%` }} />
                  </div>
                  <div className="text-xs text-white/30 mt-1">{r.pct}% of total</div>
                </div>
              ))}
              <div className="border-t border-white/10 pt-4 mt-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/50">Total Revenue</span>
                  <span className="text-xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                    ₹{totalRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Expense by category ── */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-5">Expenses by Category</p>
            {Object.keys(categoryTotals).length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-gray-400 text-sm">No expenses logged yet.</p>
                <p className="text-gray-300 text-xs mt-1">Add expenses in each tournament's Finance tab.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {CATEGORIES.filter((c) => categoryTotals[c.value]).map((cat) => {
                  const amount = categoryTotals[cat.value] || 0;
                  const pct    = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
                  return (
                    <div key={cat.value} className="flex items-center gap-3">
                      <span className="text-lg w-7 flex-shrink-0">{cat.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 font-medium">{cat.label}</span>
                          <span className="font-black text-gray-800" style={{ fontFamily: "'Syne', sans-serif" }}>
                            ₹{amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${cat.value === maxExpenseCategory ? 'bg-red-400' : 'bg-blue-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-1">
                  <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Total Expenses</span>
                  <span className="text-base font-black text-red-500" style={{ fontFamily: "'Syne', sans-serif" }}>
                    ₹{totalExpenses.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Per tournament P&L ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-5" style={{ fontFamily: "'Syne', sans-serif" }}>
            Per Tournament P&L
          </h2>
          {tournamentPnL.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No tournaments yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-5 gap-3 px-4 pb-2 border-b border-gray-100">
                {['Tournament', 'Entry Rev', 'Sponsor Rev', 'Expenses', 'Net'].map((h) => (
                  <span key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</span>
                ))}
              </div>

              {tournamentPnL.map(({ tournament: t, expenses, surplus, entryRev, sponsorRev }) => (
                <div
                  key={t._id}
                  onClick={() => navigate(`/organiser/tournaments/${t._id}`)}
                  className="grid grid-cols-5 gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer items-center"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg flex-shrink-0">{sportEmoji[t.sport]}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-gray-900 truncate" style={{ fontFamily: "'Syne', sans-serif" }}>
                        {t.name}
                      </p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusConfig[t.status]?.color}`}>
                        {statusConfig[t.status]?.label}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-600">₹{entryRev.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-400">{t.paidTeams || 0} paid</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-600">₹{sponsorRev.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-500">₹{expenses.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-black ${surplus >= 0 ? 'text-gray-900' : 'text-red-500'}`}
                      style={{ fontFamily: "'Syne', sans-serif" }}>
                      {surplus < 0 ? '-' : '+'}₹{Math.abs(surplus).toLocaleString('en-IN')}
                    </p>
                    {(entryRev + sponsorRev) > 0 && (
                      <p className="text-xs text-gray-400">
                        {Math.round(surplus / (entryRev + sponsorRev) * 100)}% margin
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Total row */}
              <div className="grid grid-cols-5 gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 mt-1">
                <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Total</span>
                <span className="text-sm font-black text-emerald-600" style={{ fontFamily: "'Syne', sans-serif" }}>
                  ₹{totalEntryRevenue.toLocaleString('en-IN')}
                </span>
                <span className="text-sm font-black text-blue-600" style={{ fontFamily: "'Syne', sans-serif" }}>
                  ₹{totalSponsorRevenue.toLocaleString('en-IN')}
                </span>
                <span className="text-sm font-black text-red-500" style={{ fontFamily: "'Syne', sans-serif" }}>
                  ₹{totalExpenses.toLocaleString('en-IN')}
                </span>
                <span className={`text-sm font-black ${netSurplus >= 0 ? 'text-gray-900' : 'text-red-500'}`}
                  style={{ fontFamily: "'Syne', sans-serif" }}>
                  {netSurplus < 0 ? '-' : '+'}₹{Math.abs(netSurplus).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Recent expenses ── */}
        {recentExpenses.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-5" style={{ fontFamily: "'Syne', sans-serif" }}>
              Recent Expenses
            </h2>
            <div className="flex flex-col gap-2">
              {recentExpenses.map((e) => {
                const cat = CATEGORIES.find((c) => c.value === e.category) || CATEGORIES[7];
                return (
                  <div key={e._id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <span className="text-lg flex-shrink-0">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{e.description}</p>
                      <p className="text-xs text-gray-400">
                        {e.tournamentId?.name} · {cat.label} · {formatDate(e.date)}
                      </p>
                    </div>
                    <p className="text-sm font-black text-gray-900 flex-shrink-0" style={{ fontFamily: "'Syne', sans-serif" }}>
                      ₹{e.amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </OrganiserLayout>
  );
}