import { useState } from 'react';
import tournamentService from '../../services/tournamentService';

const STEPS = ['Basic Info', 'Dates', 'Format & Teams', 'Finance', 'Review'];

const sportOptions = [
  { value: 'cricket',    label: 'Cricket',    emoji: '🏏' },
  { value: 'football',   label: 'Football',   emoji: '⚽' },
  { value: 'badminton',  label: 'Badminton',  emoji: '🏸' },
  { value: 'kabaddi',    label: 'Kabaddi',    emoji: '🤼' },
  { value: 'basketball', label: 'Basketball', emoji: '🏀' },
  { value: 'volleyball', label: 'Volleyball', emoji: '🏐' },
];

const formatOptions = [
  { value: 'knockout',        label: 'Knockout',              desc: "Single elimination — lose once, you're out" },
  { value: 'league',          label: 'League / Round Robin',  desc: 'Everyone plays everyone, points decide standings' },
  { value: 'league+knockout', label: 'League + Knockout',     desc: 'Group stage followed by knockout rounds' },
];

const sportSpecialAwards = {
  cricket:    ['Top Scorer', 'Best Bowler', 'Most Catches'],
  football:   ['Top Scorer', 'Most Assists', 'Clean Sheet'],
  badminton:  ['Most Sets Won', 'Best Rally Winner'],
  kabaddi:    ['Most Raids', 'Most Tackles'],
  basketball: ['Top Scorer', 'Most Assists', 'Most Rebounds'],
  volleyball: ['Most Spikes', 'Most Blocks', 'Best Setter'],
};

const defaultTeamSizes = {
  cricket: 11, football: 11, badminton: 1,
  kabaddi: 7,  basketball: 5, volleyball: 6,
};

const defaultForm = {
  name: '',
  sport: '',
  format: '',
  venue: { name: '', city: '', capacity: '' },
  startDate: '',
  endDate: '',
  registrationStartDate: '',
  registrationEndDate: '',
  maxTeams: '',
  entryFee: '',
  prizeStructure: {
    percentage: 60,
    distribution: { winner: 50, runnerUp: 30, third: 10, special: 10 },
  },
  sponsorshipTiers: ['gold', 'silver', 'bronze'],
  sportConfig: { specialAwards: [], teamSize: '' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
};

export default function CreateTournamentModal({ onClose, onCreated }) {
  const [step, setStep]       = useState(0);
  const [form, setForm]       = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const updateNested = (parent, field, value) => {
    setForm((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
    setError('');
  };

  const updateDistribution = (field, value) => {
    setForm((prev) => ({
      ...prev,
      prizeStructure: {
        ...prev.prizeStructure,
        distribution: {
          ...prev.prizeStructure.distribution,
          [field]: Number(value),
        },
      },
    }));
  };

  const toggleTier = (tier) => {
    setForm((prev) => ({
      ...prev,
      sponsorshipTiers: prev.sponsorshipTiers.includes(tier)
        ? prev.sponsorshipTiers.filter((t) => t !== tier)
        : [...prev.sponsorshipTiers, tier],
    }));
  };

  const toggleAward = (award) => {
    const current = form.sportConfig.specialAwards || [];
    const updated  = current.includes(award)
      ? current.filter((a) => a !== award)
      : [...current, award];
    setForm((prev) => ({
      ...prev,
      sportConfig: { ...prev.sportConfig, specialAwards: updated },
    }));
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.name.trim())        return 'Tournament name is required';
      if (!form.sport)              return 'Please select a sport';
      if (!form.venue.name.trim())  return 'Venue name is required';
      if (!form.venue.city.trim())  return 'City is required';
    }
    if (step === 1) {
      if (!form.registrationStartDate) return 'Registration start date is required';
      if (!form.registrationEndDate)   return 'Registration end date is required';
      if (!form.startDate)             return 'Tournament start date is required';
      if (!form.endDate)               return 'Tournament end date is required';
      if (new Date(form.registrationEndDate) < new Date(form.registrationStartDate))
        return 'Registration end date must be after registration start date';
      if (new Date(form.startDate) < new Date(form.registrationEndDate))
        return 'Tournament start date must be after registration closes';
      if (new Date(form.endDate) < new Date(form.startDate))
        return 'Tournament end date must be after start date';
    }
    if (step === 2) {
      if (!form.format) return 'Please select a format';
      if (!form.maxTeams || Number(form.maxTeams) < 2) return 'Minimum 2 teams required';
      if (!form.sportConfig.teamSize || Number(form.sportConfig.teamSize) < 1)
        return 'Players per team is required';
    }
    if (step === 3) {
      if (form.entryFee === '' || form.entryFee === null) return 'Entry fee is required';
      if (Number(form.entryFee) < 0) return 'Entry fee cannot be negative';
      const { winner, runnerUp, third, special } = form.prizeStructure.distribution;
      if (winner + runnerUp + third + special !== 100)
        return 'Prize distribution must add up to 100%';
    }
    return '';
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        maxTeams: Number(form.maxTeams),
        entryFee: Number(form.entryFee),
        venue: {
          ...form.venue,
          capacity: form.venue.capacity ? Number(form.venue.capacity) : 0,
        },
        sportConfig: {
          ...form.sportConfig,
          teamSize: Number(form.sportConfig.teamSize),
        },
      };
      const data = await tournamentService.create(payload);
      onCreated(data.tournament);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  const totalDistribution =
    form.prizeStructure.distribution.winner +
    form.prizeStructure.distribution.runnerUp +
    form.prizeStructure.distribution.third +
    form.prizeStructure.distribution.special;

  const estimatedPrizePool =
    form.entryFee !== '' && form.maxTeams
      ? Math.round(Number(form.entryFee) * Number(form.maxTeams) * form.prizeStructure.percentage / 100)
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-7 py-5 rounded-t-2xl z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
              Create Tournament
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className={`flex items-center gap-1.5 ${i <= step ? 'text-blue-600' : 'text-gray-300'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${i < step ? 'bg-blue-600 text-white' : i === step ? 'border-2 border-blue-600 text-blue-600' : 'border-2 border-gray-200 text-gray-300'}`}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span className="text-xs font-medium hidden sm:block whitespace-nowrap">{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-1 ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-6">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* STEP 0 — Basic Info */}
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <div>
                <label className="label">Tournament Name</label>
                <input
                  className="input"
                  placeholder="e.g. Mumbai T20 Open 2025"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                />
              </div>

              <div>
                <label className="label">Sport</label>
                <div className="grid grid-cols-3 gap-2">
                  {sportOptions.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          sport: s.value,
                          sportConfig: {
                            specialAwards: sportSpecialAwards[s.value] || [],
                            teamSize: defaultTeamSizes[s.value] || '',
                          },
                        }));
                        setError('');
                      }}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all
                        ${form.sport === s.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <span className="text-2xl">{s.emoji}</span>
                      <span className="text-xs font-semibold text-gray-700">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Venue — 3 fields */}
              <div>
                <label className="label">Venue</label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <input
                      className="input"
                      placeholder="Venue name e.g. Wankhede Stadium"
                      value={form.venue.name}
                      onChange={(e) => updateNested('venue', 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      className="input"
                      placeholder="City e.g. Mumbai"
                      value={form.venue.city}
                      onChange={(e) => updateNested('venue', 'city', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <input
                    type="number"
                    className="input"
                    placeholder="Venue capacity (spectators) e.g. 500 — used for Sponsor ROI estimate"
                    min={0}
                    value={form.venue.capacity}
                    onChange={(e) => updateNested('venue', 'capacity', e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Optional — how many spectators your venue can hold. Helps estimate sponsor audience reach.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1 — Dates */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">R</div>
                  <span className="text-sm font-semibold text-gray-700">Registration Window</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Opens On</label>
                    <input
                      type="date"
                      className="input"
                      value={form.registrationStartDate}
                      onChange={(e) => update('registrationStartDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Closes On</label>
                    <input
                      type="date"
                      className="input"
                      value={form.registrationEndDate}
                      onChange={(e) => update('registrationEndDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold flex-shrink-0">T</div>
                  <span className="text-sm font-semibold text-gray-700">Tournament Dates</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Start Date</label>
                    <input
                      type="date"
                      className="input"
                      value={form.startDate}
                      onChange={(e) => update('startDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">End Date</label>
                    <input
                      type="date"
                      className="input"
                      value={form.endDate}
                      onChange={(e) => update('endDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {form.registrationStartDate && form.startDate && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Timeline Preview</p>
                  <div className="flex items-center gap-1 text-xs flex-wrap gap-y-2">
                    <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded font-medium whitespace-nowrap">
                      Reg opens {formatDate(form.registrationStartDate)}
                    </span>
                    <div className="flex-1 h-px bg-blue-200 min-w-[8px]" />
                    <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded font-medium whitespace-nowrap">
                      Reg closes {formatDate(form.registrationEndDate)}
                    </span>
                    <div className="flex-1 h-px bg-emerald-200 min-w-[8px]" />
                    <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded font-medium whitespace-nowrap">
                      Starts {formatDate(form.startDate)}
                    </span>
                    <div className="flex-1 h-px bg-emerald-200 min-w-[8px]" />
                    <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded font-medium whitespace-nowrap">
                      Ends {formatDate(form.endDate)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2 — Format & Teams */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <label className="label">Tournament Format</label>
                <div className="flex flex-col gap-2">
                  {formatOptions.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => update('format', f.value)}
                      className={`flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all
                        ${form.format === f.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5
                        ${form.format === f.value ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`} />
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{f.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{f.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Maximum Teams</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="e.g. 16"
                    min={2}
                    value={form.maxTeams}
                    onChange={(e) => update('maxTeams', e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">Min 2 teams</p>
                </div>
                <div>
                  <label className="label">Players per Team</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="e.g. 11"
                    min={1}
                    value={form.sportConfig.teamSize}
                    onChange={(e) => setForm((prev) => ({
                      ...prev,
                      sportConfig: { ...prev.sportConfig, teamSize: e.target.value },
                    }))}
                  />
                  {form.sport && (
                    <p className="text-xs text-gray-400 mt-1">
                      Default for {form.sport}: {defaultTeamSizes[form.sport]}
                    </p>
                  )}
                </div>
              </div>

              {form.sport && (
                <div>
                  <label className="label">Special Awards</label>
                  <p className="text-xs text-gray-400 mb-2">Pre-selected based on sport — toggle as needed</p>
                  <div className="flex flex-wrap gap-2">
                    {(sportSpecialAwards[form.sport] || []).map((award) => (
                      <button
                        key={award}
                        type="button"
                        onClick={() => toggleAward(award)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all
                          ${(form.sportConfig.specialAwards || []).includes(award)
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                      >
                        {award}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="label">Sponsorship Tiers to Offer</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'platinum', active: 'border-purple-400 bg-purple-50 text-purple-600' },
                    { value: 'gold',     active: 'border-yellow-400 bg-yellow-50 text-yellow-600' },
                    { value: 'silver',   active: 'border-gray-400 bg-gray-50 text-gray-600' },
                    { value: 'bronze',   active: 'border-orange-300 bg-orange-50 text-orange-600' },
                  ].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => toggleTier(t.value)}
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase border-2 transition-all
                        ${form.sponsorshipTiers.includes(t.value) ? t.active : 'border-gray-200 text-gray-300'}`}
                    >
                      {t.value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Finance */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div>
                <label className="label">Entry Fee per Team (₹)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g. 2000"
                  min={0}
                  value={form.entryFee}
                  onChange={(e) => update('entryFee', e.target.value)}
                />
                {form.entryFee !== '' && form.maxTeams && (
                  <p className="text-xs text-gray-400 mt-1">
                    Total entry revenue if full: ₹{(Number(form.entryFee) * Number(form.maxTeams)).toLocaleString('en-IN')}
                  </p>
                )}
              </div>

              <div>
                <label className="label">Base Prize Pool — % of Entry Revenue</label>
                <p className="text-xs text-gray-400 mb-3">
                  Guaranteed prize pool from entry fees only. Sponsor contributions are added per deal later.
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={form.prizeStructure.percentage}
                    onChange={(e) => setForm((prev) => ({
                      ...prev,
                      prizeStructure: { ...prev.prizeStructure, percentage: Number(e.target.value) },
                    }))}
                    className="flex-1 accent-blue-600"
                  />
                  <span className="text-lg font-black text-blue-600 w-12 text-right" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {form.prizeStructure.percentage}%
                  </span>
                </div>
                {estimatedPrizePool > 0 && (
                  <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 flex justify-between items-center">
                    <span className="text-xs text-blue-500">Estimated base prize pool</span>
                    <span className="text-sm font-black text-blue-600" style={{ fontFamily: "'Syne', sans-serif" }}>
                      ₹{estimatedPrizePool.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="label">Prize Distribution</label>
                <p className={`text-xs mb-3 font-semibold ${totalDistribution === 100 ? 'text-emerald-500' : 'text-red-500'}`}>
                  Total: {totalDistribution}% {totalDistribution === 100 ? '✓ Good to go' : '— must equal 100%'}
                </p>
                <div className="flex flex-col gap-3">
                  {[
                    { key: 'winner',   label: '🥇 Winner' },
                    { key: 'runnerUp', label: '🥈 Runner-up' },
                    { key: 'third',    label: '🥉 Third place' },
                    { key: 'special',  label: '⭐ Special awards' },
                  ].map((d) => {
                    const amount = estimatedPrizePool
                      ? Math.round(estimatedPrizePool * form.prizeStructure.distribution[d.key] / 100)
                      : 0;
                    return (
                      <div key={d.key} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-32 flex-shrink-0">{d.label}</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="input w-20 text-center"
                          value={form.prizeStructure.distribution[d.key]}
                          onChange={(e) => updateDistribution(d.key, e.target.value)}
                        />
                        <span className="text-sm text-gray-400">%</span>
                        {amount > 0 && (
                          <span className="text-xs text-gray-400 ml-auto">
                            ≈ ₹{amount.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — Review */}
          {step === 4 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-500 mb-2">Review your tournament details before creating.</p>
              {[
                { label: 'Name',         value: form.name },
                { label: 'Sport',        value: form.sport },
                { label: 'Format',       value: form.format },
                { label: 'Venue',        value: `${form.venue.name}, ${form.venue.city}` },
                { label: 'Capacity',     value: form.venue.capacity ? `${Number(form.venue.capacity).toLocaleString('en-IN')} spectators` : 'Not specified' },
                { label: 'Reg Window',   value: `${formatDate(form.registrationStartDate)} → ${formatDate(form.registrationEndDate)}` },
                { label: 'Tournament',   value: `${formatDate(form.startDate)} → ${formatDate(form.endDate)}` },
                { label: 'Max Teams',    value: form.maxTeams },
                { label: 'Players/Team', value: form.sportConfig.teamSize },
                { label: 'Entry Fee',    value: `₹${Number(form.entryFee).toLocaleString('en-IN')} per team` },
                { label: 'Total Revenue', value: `₹${(Number(form.entryFee) * Number(form.maxTeams)).toLocaleString('en-IN')}` },
                { label: 'Base Prize Pool', value: `${form.prizeStructure.percentage}% → ₹${estimatedPrizePool.toLocaleString('en-IN')}` },
                { label: 'Distribution', value: `W:${form.prizeStructure.distribution.winner}% RU:${form.prizeStructure.distribution.runnerUp}% 3rd:${form.prizeStructure.distribution.third}% Special:${form.prizeStructure.distribution.special}%` },
                { label: 'Sponsor Tiers', value: form.sponsorshipTiers.join(', ') || 'None' },
                { label: 'Special Awards', value: form.sportConfig.specialAwards?.join(', ') || 'None' },
              ].map((r) => (
                <div key={r.label} className="flex justify-between items-start py-2.5 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-400 font-medium w-32 flex-shrink-0">{r.label}</span>
                  <span className="text-sm font-semibold text-gray-800 text-right capitalize">{r.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-7 py-4 rounded-b-2xl flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => step === 0 ? onClose() : setStep((s) => s - 1)}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {step === 0 ? 'Cancel' : '← Back'}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {loading ? 'Creating...' : '🏆 Create Tournament'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}