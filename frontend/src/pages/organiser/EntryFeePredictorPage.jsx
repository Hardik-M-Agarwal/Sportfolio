import { useState } from 'react';
import OrganiserLayout from '../../layouts/OrganiserLayout';
import EntryFeeSuggestion from '../../components/ml/EntryFeeSuggestion';

const sports = ['cricket', 'football', 'badminton', 'kabaddi', 'basketball', 'volleyball'];
const formats = ['knockout', 'league', 'league+knockout'];
const sportEmoji = {
  cricket: '🏏', football: '⚽', badminton: '🏸',
  kabaddi: '🤼', basketball: '🏀', volleyball: '🏐',
};

const cityTiers = [
  { value: 1, label: 'Tier 1 — Mumbai, Delhi, Bangalore, Chennai, Hyderabad' },
  { value: 2, label: 'Tier 2 — Pune, Surat, Nagpur, Jaipur, Lucknow' },
  { value: 3, label: 'Tier 3 — Nashik, Aurangabad, Kolhapur, smaller cities' },
];

export default function EntryFeePredictorPage() {
  const [formData, setFormData] = useState({
    sport:           '',
    cityTier:        '',
    venueCost:       '',
    maxTeams:        '',
    teamSize:        '',
    format:          '',
    hasSponsorship:  false,
    prizePercentage: 60,
    tournamentDays:  1,
  });
  const [usedFee, setUsedFee] = useState(null);

  const set = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  const handleUseFee = (fee) => {
    setUsedFee(fee);
    // scroll to top to show the result
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isComplete = formData.sport && formData.cityTier &&
    formData.venueCost && formData.maxTeams;

  return (
    <OrganiserLayout>
      <div className="p-8 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg">
              🤖
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                Entry Fee Predictor
              </h1>
              <p className="text-gray-400 text-sm">XGBoost model + Gemini AI · Trained on 50,000 tournament records</p>
            </div>
          </div>
        </div>

        {/* Used fee banner */}
        {usedFee && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">AI Suggested Entry Fee</p>
              <p className="text-3xl font-black text-emerald-600" style={{ fontFamily: "'Syne', sans-serif" }}>
                ₹{usedFee.toLocaleString('en-IN')}
              </p>
            </div>
            <button
              onClick={() => setUsedFee(null)}
              className="text-xs text-emerald-500 hover:text-emerald-700 font-medium"
            >
              Clear
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left — inputs */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-5"
              style={{ fontFamily: "'Syne', sans-serif" }}>
              Tournament Parameters
            </h2>

            <div className="flex flex-col gap-4">

              {/* Sport */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                  Sport *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {sports.map((s) => (
                    <button
                      key={s}
                      onClick={() => set('sport', s)}
                      className={`py-2 rounded-xl border-2 text-xs font-semibold capitalize transition-all flex items-center justify-center gap-1.5
                        ${formData.sport === s
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      <span>{sportEmoji[s]}</span> {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* City Tier */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                  City Tier *
                </label>
                <div className="flex flex-col gap-2">
                  {cityTiers.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => set('cityTier', t.value)}
                      className={`px-4 py-2.5 rounded-xl border-2 text-left transition-all
                        ${formData.cityTier === t.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <span className={`text-xs font-semibold ${formData.cityTier === t.value ? 'text-blue-600' : 'text-gray-600'}`}>
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Venue Cost + Max Teams */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Venue Cost (₹) *
                  </label>
                  <input
                    type="number"
                    className="input"
                    placeholder="e.g. 15000"
                    value={formData.venueCost}
                    onChange={(e) => set('venueCost', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Max Teams *
                  </label>
                  <input
                    type="number"
                    className="input"
                    placeholder="e.g. 16"
                    value={formData.maxTeams}
                    onChange={(e) => set('maxTeams', e.target.value)}
                  />
                </div>
              </div>

              {/* Team Size + Tournament Days */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Players / Team
                  </label>
                  <input
                    type="number"
                    className="input"
                    placeholder="e.g. 11"
                    value={formData.teamSize}
                    onChange={(e) => set('teamSize', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Tournament Days
                  </label>
                  <input
                    type="number"
                    className="input"
                    placeholder="e.g. 2"
                    min={1}
                    max={10}
                    value={formData.tournamentDays}
                    onChange={(e) => set('tournamentDays', e.target.value)}
                  />
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                  Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {formats.map((f) => (
                    <button
                      key={f}
                      onClick={() => set('format', f)}
                      className={`py-2 rounded-xl border-2 text-xs font-semibold capitalize transition-all
                        ${formData.format === f
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prize Percentage */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Prize Pool Percentage — {formData.prizePercentage}%
                </label>
                <input
                  type="range"
                  min={30}
                  max={80}
                  step={5}
                  value={formData.prizePercentage}
                  onChange={(e) => set('prizePercentage', Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-300 mt-1">
                  <span>30%</span>
                  <span>80%</span>
                </div>
              </div>

              {/* Has Sponsor */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Have a sponsor?</p>
                  <p className="text-xs text-gray-400">Sponsor reduces required entry fee</p>
                </div>
                <button
                  onClick={() => set('hasSponsorship', !formData.hasSponsorship)}
                  className={`w-12 h-6 rounded-full transition-all relative ${formData.hasSponsorship ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${formData.hasSponsorship ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>

            </div>
          </div>

          {/* Right — AI suggestion */}
          <div>
            {/* Model info */}
            <div className="bg-gray-900 rounded-2xl p-5 mb-4">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Model Info</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Algorithm',  value: 'XGBoost' },
                  { label: 'Training',   value: '50K records' },
                  { label: 'R² Score',   value: '97.24%' },
                ].map((s) => (
                  <div key={s.label} className="bg-white/8 rounded-xl p-3 text-center">
                    <div className="text-sm font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
                    <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[
                  { label: 'RMSE', value: '₹454' },
                  { label: 'MAE',  value: '₹262' },
                ].map((s) => (
                  <div key={s.label} className="bg-white/8 rounded-xl p-3 text-center">
                    <div className="text-sm font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
                    <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature importance */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">
                Top Feature Importance
              </p>
              {[
                { label: 'Venue Cost',       pct: 31 },
                { label: 'City Tier',        pct: 26 },
                { label: 'Sport Type',       pct: 19 },
                { label: 'Prize %',          pct: 13 },
                { label: 'Has Sponsor',      pct: 7  },
                { label: 'Format',           pct: 4  },
              ].map((f) => (
                <div key={f.label} className="mb-2.5">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500 font-medium">{f.label}</span>
                    <span className="text-gray-700 font-bold">{f.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${f.pct * 3}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* AI Suggestion widget */}
            <EntryFeeSuggestion
              formData={formData}
              onUseFee={handleUseFee}
            />
          </div>
        </div>
      </div>
    </OrganiserLayout>
  );
}