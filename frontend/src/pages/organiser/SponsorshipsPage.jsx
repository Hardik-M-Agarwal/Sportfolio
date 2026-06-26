import { useState, useEffect, useCallback } from 'react';
import OrganiserLayout from '../../layouts/OrganiserLayout';
import api from '../../services/api';
import tournamentService from '../../services/tournamentService';

const tierColor = {
  platinum: 'bg-purple-100 text-purple-600',
  gold:     'bg-yellow-100 text-yellow-600',
  silver:   'bg-gray-100 text-gray-600',
  bronze:   'bg-orange-100 text-orange-600',
};

const statusColor = {
  not_contacted: 'bg-gray-100 text-gray-500',
  contacted:     'bg-blue-100 text-blue-600',
  interested:    'bg-amber-100 text-amber-600',
  converted:     'bg-emerald-100 text-emerald-600',
  rejected:      'bg-red-100 text-red-500',
};

const statusLabel = {
  not_contacted: '— Not contacted',
  contacted:     '📧 Contacted',
  interested:    '🤝 Interested',
  converted:     '✅ Converted',
  rejected:      '❌ Rejected',
};

const tiers = ['platinum', 'gold', 'silver', 'bronze'];
const tierAmounts = { platinum: 50000, gold: 25000, silver: 15000, bronze: 7000 };

// ── Add Contact Modal ─────────────────────────────────────────────────
function AddContactModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    businessName: '', contactEmail: '', contactName: '', businessType: '', city: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.businessName.trim() || !form.contactEmail.trim()) {
      setError('Business name and email are required');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/outreach/contacts', form);
      onAdded(res.data.contact);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
            Add Business Contact
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

        <div className="flex flex-col gap-4">
          <div>
            <label className="label">Business Name *</label>
            <input className="input" placeholder="e.g. Sharma Sports Store" value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
          </div>
          <div>
            <label className="label">Contact Email *</label>
            <input className="input" type="email" placeholder="contact@business.com" value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Contact Name</label>
              <input className="input" placeholder="Owner name" value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" placeholder="Mumbai" value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Business Type</label>
            <input className="input" placeholder="e.g. Sports Store, Restaurant" value={form.businessType}
              onChange={(e) => setForm({ ...form, businessType: e.target.value })} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-60">
            {loading ? 'Adding...' : 'Add Contact'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Send Pitch Modal ──────────────────────────────────────────────────
function SendPitchModal({ contact, tournaments, onClose, onSent }) {
  const [tournamentId, setTournamentId] = useState('');
  const [tier, setTier] = useState('gold');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedTournament = tournaments.find((t) => t._id === tournamentId);

  const handleSend = async () => {
    if (!tournamentId) { setError('Please select a tournament'); return; }
    setLoading(true);
    try {
      await api.post(`/outreach/contacts/${contact._id}/pitch`, { tournamentId, tier });
      onSent();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send pitch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-7 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>Send Pitch</h2>
            <p className="text-sm text-gray-400 mt-0.5">To: {contact.businessName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

        <div className="flex flex-col gap-5">
          <div>
            <label className="label">Select Tournament</label>
            <select className="input" value={tournamentId} onChange={(e) => setTournamentId(e.target.value)}>
              <option value="">Choose tournament...</option>
              {tournaments.map((t) => (
                <option key={t._id} value={t._id}>{t.name} · {t.sport}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Sponsorship Tier</label>
            <div className="grid grid-cols-2 gap-2">
              {tiers.map((t) => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`py-2.5 rounded-xl border-2 text-sm font-semibold capitalize transition-all
                    ${tier === t ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500'}`}
                >
                  {t} · ₹{tierAmounts[t].toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Email preview */}
          {selectedTournament && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Email Preview</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                <strong>To:</strong> {contact.contactEmail}<br />
                <strong>Subject:</strong> Sponsorship Opportunity — {selectedTournament.name}, {selectedTournament.venue?.city}<br /><br />
                Dear <strong>{contact.businessName}</strong>,<br /><br />
                We're organizing <strong>{selectedTournament.name}</strong> ({selectedTournament.sport}) at {selectedTournament.venue?.name}, {selectedTournament.venue?.city}.<br /><br />
                We'd love to have you as our <strong className="capitalize">{tier}</strong> sponsor for ₹{tierAmounts[tier].toLocaleString('en-IN')}.<br /><br />
                <em>[Full details + direct payment link included]</em>
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
          <button onClick={handleSend} disabled={loading || !tournamentId}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-60">
            {loading ? 'Sending...' : '📧 Send Pitch Email'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Invite Platform Sponsor Modal ─────────────────────────────────────
function InviteModal({ sponsor, tournaments, onClose, onSent }) {
  const [tournamentId, setTournamentId] = useState('');
  const [tier, setTier] = useState('gold');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!tournamentId) { setError('Please select a tournament'); return; }
    setLoading(true);
    try {
      await api.post('/outreach/invite-platform-sponsor', {
        sponsorId: sponsor._id,
        tournamentId,
        tier,
      });
      onSent();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>Invite Sponsor</h2>
            <p className="text-sm text-gray-400 mt-0.5">{sponsor.name} · {sponsor.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

        <div className="flex flex-col gap-4">
          <div>
            <label className="label">Select Tournament</label>
            <select className="input" value={tournamentId} onChange={(e) => setTournamentId(e.target.value)}>
              <option value="">Choose tournament...</option>
              {tournaments.map((t) => (
                <option key={t._id} value={t._id}>{t.name} · {t.sport}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Suggest Tier</label>
            <div className="grid grid-cols-2 gap-2">
              {tiers.map((t) => (
                <button key={t} onClick={() => setTier(t)}
                  className={`py-2.5 rounded-xl border-2 text-sm font-semibold capitalize transition-all
                    ${tier === t ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500'}`}>
                  {t} · ₹{tierAmounts[t].toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
          <button onClick={handleSend} disabled={loading || !tournamentId}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-60">
            {loading ? 'Sending...' : '📧 Send Invitation'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function SponsorshipsPage() {
  const [activeTab, setActiveTab] = useState('my-sponsors');
  const [sponsorships, setSponsorships] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [platformSponsors, setPlatformSponsors] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddContact, setShowAddContact] = useState(false);
  const [pitchContact, setPitchContact] = useState(null);
  const [inviteSponsor, setInviteSponsor] = useState(null);
  const [filterTournament, setFilterTournament] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, contactsRes, platformRes, tournamentsRes] = await Promise.all([
        api.get('/outreach/my-sponsorships-summary'),
        api.get('/outreach/contacts'),
        api.get('/outreach/platform-sponsors'),
        tournamentService.getMyTournaments(),
      ]);
      setSponsorships(summaryRes.data.sponsorships);
      setContacts(contactsRes.data.contacts);
      setPlatformSponsors(platformRes.data.sponsors);
      setTournaments(tournamentsRes.tournaments);
    } catch (error) {
      console.error('Failed to fetch sponsorship data', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleContactAdded = (contact) => {
    setContacts((prev) => [contact, ...prev]);
    setShowAddContact(false);
    showSuccess('Contact added successfully!');
  };

  const handlePitchSent = () => {
    setPitchContact(null);
    fetchData();
    showSuccess('Pitch email sent successfully!');
  };

  const handleInviteSent = () => {
    setInviteSponsor(null);
    showSuccess('Invitation sent successfully!');
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm('Delete this contact?')) return;
    try {
      await api.delete(`/outreach/contacts/${id}`);
      setContacts((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error('Failed to delete contact', err);
    }
  };

  const handleStatusUpdate = async (contactId, tournamentId, status) => {
    try {
      const res = await api.put(`/outreach/contacts/${contactId}/pitch-status`, { tournamentId, status });
      setContacts((prev) => prev.map((c) => c._id === contactId ? res.data.contact : c));
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  // filtered sponsorships
  const filteredSponsorships = sponsorships.filter((s) => {
    if (filterTournament && s.tournamentId?._id !== filterTournament) return false;
    if (filterTier && s.tier !== filterTier) return false;
    return true;
  });

  const totalRevenue = sponsorships.reduce((sum, s) => sum + s.amount, 0);

  return (
    <OrganiserLayout>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
            Sponsorships
          </h1>
          <p className="text-gray-500 mt-1">Manage your sponsors and reach out to new businesses.</p>
        </div>

        {/* Success toast */}
        {successMsg && (
          <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-600 font-medium">
            ✓ {successMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6">
          {[
            { key: 'my-sponsors', label: `My Sponsors (${sponsorships.length})` },
            { key: 'outreach', label: `Outreach (${contacts.length + platformSponsors.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all
                ${activeTab === tab.key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── TAB 1: MY SPONSORS ── */}
            {activeTab === 'my-sponsors' && (
              <div>
                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Total Revenue',    value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: 'text-blue-600',    bg: 'bg-blue-50' },
                    { label: 'Total Sponsors',   value: sponsorships.length,                         color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Tournaments',      value: [...new Set(sponsorships.map((s) => s.tournamentId?._id))].length, color: 'text-purple-600', bg: 'bg-purple-50' },
                  ].map((s) => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-5`}>
                      <div className={`text-2xl font-black ${s.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
                      <div className="text-sm text-gray-500 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Filters */}
                <div className="flex gap-3 mb-5">
                  <select className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
                    value={filterTournament} onChange={(e) => setFilterTournament(e.target.value)}>
                    <option value="">All Tournaments</option>
                    {tournaments.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                  <select className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
                    value={filterTier} onChange={(e) => setFilterTier(e.target.value)}>
                    <option value="">All Tiers</option>
                    {tiers.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select>
                </div>

                {filteredSponsorships.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
                    <div className="text-5xl mb-4">💼</div>
                    <h2 className="text-xl font-black text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                      No sponsors yet
                    </h2>
                    <p className="text-gray-400 text-sm">Use the Outreach tab to find and pitch sponsors.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {filteredSponsorships.map((s) => (
                      <div key={s._id} className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-start justify-between flex-wrap gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-black text-lg text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                                {s.businessName}
                              </h3>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${tierColor[s.tier]}`}>
                                {s.tier}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">
                              {s.tournamentId?.name} · {s.tournamentId?.sport}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {s.sponsorId?.name} · {s.sponsorId?.email}
                              {s.sponsorId?.phone && ` · ${s.sponsorId.phone}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-400">Amount paid</div>
                            <div className="text-xl font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                              ₹{s.amount.toLocaleString('en-IN')}
                            </div>
                            <div className="text-xs text-purple-500 mt-0.5">
                              ₹{s.prizeContribution.toLocaleString('en-IN')} to prize pool
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: OUTREACH ── */}
            {activeTab === 'outreach' && (
              <div className="flex flex-col gap-8">

                {/* Section A: Existing Sportfolio Sponsors */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                        🏆 Sportfolio Sponsors
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Sponsors registered on the platform who haven't sponsored your tournaments yet
                      </p>
                    </div>
                  </div>

                  {platformSponsors.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                      <p className="text-gray-400 text-sm">No other sponsors on the platform yet.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {platformSponsors.map((sponsor) => (
                        <div key={sponsor._id} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between flex-wrap gap-3">
                          <div>
                            <h3 className="font-black text-base text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                              {sponsor.name}
                            </h3>
                            <p className="text-xs text-gray-400">{sponsor.email}{sponsor.phone && ` · ${sponsor.phone}`}</p>
                          </div>
                          <button
                            onClick={() => setInviteSponsor(sponsor)}
                            className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            📧 Invite to Sponsor
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-200" />

                {/* Section B: External Contacts */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                        ➕ External Businesses
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Local businesses outside Sportfolio — add and pitch them
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddContact(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Business
                    </button>
                  </div>

                  {contacts.length === 0 ? (
                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-10 text-center">
                      <div className="text-3xl mb-2">🏢</div>
                      <p className="text-gray-400 text-sm">No external contacts yet.</p>
                      <p className="text-gray-300 text-xs mt-1">Add local businesses and send them a pitch email.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {contacts.map((contact) => (
                        <div key={contact._id} className="bg-white border border-gray-200 rounded-xl p-5">
                          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                            <div>
                              <h3 className="font-black text-base text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                                {contact.businessName}
                              </h3>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {contact.contactEmail}
                                {contact.contactName && ` · ${contact.contactName}`}
                                {contact.city && ` · ${contact.city}`}
                                {contact.businessType && ` · ${contact.businessType}`}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setPitchContact(contact)}
                                className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                📧 Send Pitch
                              </button>
                              <button
                                onClick={() => handleDeleteContact(contact._id)}
                                className="px-3 py-1.5 text-xs font-semibold border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {/* Pitches */}
                          {contact.pitches?.length > 0 && (
                            <div className="border-t border-gray-100 pt-4">
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pitch History</p>
                              <div className="flex flex-col gap-2">
                                {contact.pitches.map((pitch, i) => (
                                  <div key={i} className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${tierColor[pitch.tier]}`}>
                                        {pitch.tier}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {pitch.tournamentId?.name}
                                      </span>
                                      {pitch.sentAt && (
                                        <span className="text-xs text-gray-300">
                                          · {new Date(pitch.sentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[pitch.status]}`}>
                                        {statusLabel[pitch.status]}
                                      </span>
                                      {/* Status update dropdown */}
                                      <select
                                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none"
                                        value={pitch.status}
                                        onChange={(e) => handleStatusUpdate(contact._id, pitch.tournamentId?._id, e.target.value)}
                                      >
                                        <option value="not_contacted">Not contacted</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="interested">Interested</option>
                                        <option value="converted">Converted</option>
                                        <option value="rejected">Rejected</option>
                                      </select>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showAddContact && (
        <AddContactModal onClose={() => setShowAddContact(false)} onAdded={handleContactAdded} />
      )}
      {pitchContact && (
        <SendPitchModal
          contact={pitchContact}
          tournaments={tournaments}
          onClose={() => setPitchContact(null)}
          onSent={handlePitchSent}
        />
      )}
      {inviteSponsor && (
        <InviteModal
          sponsor={inviteSponsor}
          tournaments={tournaments}
          onClose={() => setInviteSponsor(null)}
          onSent={handleInviteSent}
        />
      )}
    </OrganiserLayout>
  );
}