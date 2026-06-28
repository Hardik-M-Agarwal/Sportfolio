import { useState, useEffect, useCallback } from 'react';
import expenseService from '../../services/expenseService';

const CATEGORIES = [
  { value: 'venue',         label: 'Venue',         icon: '🏟️', color: 'bg-blue-100 text-blue-700' },
  { value: 'officials',     label: 'Officials',     icon: '👨‍⚖️', color: 'bg-purple-100 text-purple-700' },
  { value: 'equipment',     label: 'Equipment',     icon: '🏏', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'marketing',     label: 'Marketing',     icon: '📢', color: 'bg-pink-100 text-pink-700' },
  { value: 'hospitality',   label: 'Hospitality',   icon: '🍽️', color: 'bg-orange-100 text-orange-700' },
  { value: 'awards',        label: 'Awards',        icon: '🏆', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'transport',     label: 'Transport',     icon: '🚗', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'miscellaneous', label: 'Miscellaneous', icon: '📦', color: 'bg-gray-100 text-gray-700' },
];

const getCategoryConfig = (value) =>
  CATEGORIES.find((c) => c.value === value) || CATEGORIES[7];

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const defaultForm = {
  category:    'venue',
  description: '',
  amount:      '',
  date:        new Date().toISOString().split('T')[0],
};

export default function ExpenseTracker({ tournamentId, entryRevenue, sponsorRevenue }) {
  const [expenses, setExpenses]             = useState([]);
  const [totalExpenses, setTotalExpenses]   = useState(0);
  const [categoryTotals, setCategoryTotals] = useState({});
  const [loading, setLoading]               = useState(true);
  const [showForm, setShowForm]             = useState(false);
  const [form, setForm]                     = useState(defaultForm);
  const [saving, setSaving]                 = useState(false);
  const [editingId, setEditingId]           = useState(null);
  const [deleteId, setDeleteId]             = useState(null);
  const [error, setError]                   = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const fetchExpenses = useCallback(async () => {
    try {
      const data = await expenseService.getByTournament(tournamentId);
      setExpenses(data.expenses);
      setTotalExpenses(data.totalExpenses);
      setCategoryTotals(data.categoryTotals);
    } catch (err) {
      console.error('Failed to fetch expenses', err);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleSave = async () => {
    if (!form.description.trim()) return setError('Description is required');
    if (!form.amount || Number(form.amount) <= 0) return setError('Enter a valid amount');

    setSaving(true);
    setError('');

    try {
      if (editingId) {
        await expenseService.update(editingId, form);
      } else {
        await expenseService.create({ ...form, tournamentId });
      }
      setForm(defaultForm);
      setShowForm(false);
      setEditingId(null);
      fetchExpenses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (expense) => {
    setForm({
      category:    expense.category,
      description: expense.description,
      amount:      expense.amount,
      date:        new Date(expense.date).toISOString().split('T')[0],
    });
    setEditingId(expense._id);
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    try {
      await expenseService.delete(id);
      setDeleteId(null);
      fetchExpenses();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const handleCancel = () => {
    setForm(defaultForm);
    setShowForm(false);
    setEditingId(null);
    setError('');
  };

  const totalRevenue = (entryRevenue || 0) + (sponsorRevenue || 0);
  const netSurplus   = totalRevenue - totalExpenses;

  const filteredExpenses = activeCategory === 'all'
    ? expenses
    : expenses.filter((e) => e.category === activeCategory);

  return (
    <div className="flex flex-col gap-6">

      {/* ── P&L Summary ── */}
      <div className="bg-gray-900 rounded-2xl p-6">
        <p className="text-xs text-white/40 uppercase tracking-widest mb-4">Financial Summary</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-white/40 mb-1">Total Revenue</p>
            <p className="text-xl font-black text-emerald-400" style={{ fontFamily: "'Syne', sans-serif" }}>
              ₹{totalRevenue.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-white/30 mt-0.5">
              Entry ₹{(entryRevenue || 0).toLocaleString('en-IN')} + Sponsor ₹{(sponsorRevenue || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Total Expenses</p>
            <p className="text-xl font-black text-red-400" style={{ fontFamily: "'Syne', sans-serif" }}>
              ₹{totalExpenses.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-white/30 mt-0.5">{expenses.length} expense{expenses.length !== 1 ? 's' : ''} logged</p>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Net {netSurplus >= 0 ? 'Surplus' : 'Deficit'}</p>
            <p className={`text-xl font-black ${netSurplus >= 0 ? 'text-white' : 'text-red-400'}`} style={{ fontFamily: "'Syne', sans-serif" }}>
              {netSurplus < 0 ? '-' : ''}₹{Math.abs(netSurplus).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-white/30 mt-0.5">
              {totalRevenue > 0 ? `${Math.round((netSurplus / totalRevenue) * 100)}% margin` : 'No revenue yet'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Category breakdown ── */}
      {expenses.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">Expenses by Category</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CATEGORIES.filter((c) => categoryTotals[c.value]).map((cat) => (
              <div key={cat.value} className={`rounded-xl p-3 ${cat.color.split(' ')[0]} bg-opacity-50`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{cat.icon}</span>
                  <span className="text-xs font-semibold text-gray-600">{cat.label}</span>
                </div>
                <p className="text-base font-black text-gray-800" style={{ fontFamily: "'Syne', sans-serif" }}>
                  ₹{(categoryTotals[cat.value] || 0).toLocaleString('en-IN')}
                </p>
                <div className="mt-1.5 h-1 bg-white/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-current rounded-full opacity-40"
                    style={{ width: `${Math.min((categoryTotals[cat.value] / totalExpenses) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Expense list + form ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider" style={{ fontFamily: "'Syne', sans-serif" }}>
            Expenses
          </h3>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Expense
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="border border-blue-200 bg-blue-50/30 rounded-xl p-5 mb-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">
              {editingId ? 'Edit Expense' : 'New Expense'}
            </h4>

            {error && (
              <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                {error}
              </div>
            )}

            {/* Category selector */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
                    className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border-2 text-xs font-semibold transition-all
                      ${form.category === cat.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-center leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Description</label>
                <input
                  className="input w-full"
                  placeholder="e.g. Ground booking fee"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Amount (₹)</label>
                <input
                  type="number"
                  className="input w-full"
                  placeholder="0"
                  min={0}
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Date</label>
                <input
                  type="date"
                  className="input w-full"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving...' : editingId ? 'Update Expense' : 'Save Expense'}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Category filter tabs */}
        {expenses.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
                ${activeCategory === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              All ({expenses.length})
            </button>
            {CATEGORIES.filter((c) => categoryTotals[c.value]).map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
                  ${activeCategory === cat.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Expense list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-gray-400 text-sm">No expenses logged yet.</p>
            <p className="text-gray-300 text-xs mt-1">Click "Add Expense" to start tracking.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredExpenses.map((expense) => {
              const cat = getCategoryConfig(expense.category);
              return (
                <div key={expense._id} className="flex items-center gap-3 py-3 px-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base ${cat.color}`}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{expense.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.color}`}>
                        {cat.label}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(expense.date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-sm font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                      ₹{expense.amount.toLocaleString('en-IN')}
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteId(expense._id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Total row */}
            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl mt-1">
              <span className="text-xs font-black text-gray-500 uppercase tracking-wider">
                {activeCategory === 'all' ? 'Total Expenses' : `Total — ${getCategoryConfig(activeCategory).label}`}
              </span>
              <span className="text-base font-black text-red-500" style={{ fontFamily: "'Syne', sans-serif" }}>
                ₹{(activeCategory === 'all'
                  ? totalExpenses
                  : categoryTotals[activeCategory] || 0
                ).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-base font-black text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              Delete Expense?
            </h3>
            <p className="text-sm text-gray-400 mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}