import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SponsorLayout from '../../layouts/SponsorLayout';
import { useAuth } from '../../context/AuthContext';
import sponsorshipService from '../../services/sponsorshipService';

const tierColor = {
  platinum: 'bg-purple-100 text-purple-600',
  gold: 'bg-yellow-100 text-yellow-600',
  silver: 'bg-gray-100 text-gray-600',
  bronze: 'bg-orange-100 text-orange-600',
};

const statusColor = {
  upcoming: 'bg-gray-100 text-gray-500',
  registration: 'bg-blue-100 text-blue-600',
  ongoing: 'bg-emerald-100 text-emerald-600',
  completed: 'bg-purple-100 text-purple-600',
};

export default function SponsorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sponsorships, setSponsorships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSponsorships = async () => {
      try {
        const data = await sponsorshipService.getMySponsorships();
        setSponsorships(data.sponsorships);
      } catch (error) {
        console.error('Failed to fetch sponsorships', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSponsorships();
  }, []);

  const totalInvested = sponsorships.reduce((sum, s) => sum + s.amount, 0);
  const totalPrizeContribution = sponsorships.reduce((sum, s) => sum + s.prizeContribution, 0);
  const activeSponsorships = sponsorships.filter((s) =>
    ['upcoming', 'registration', 'ongoing'].includes(s.tournamentId?.status)
  );

  return (
    <SponsorLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
              Welcome, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 mt-1">Your sponsorship portfolio overview.</p>
          </div>
          <button
            onClick={() => navigate('/sponsor/tournaments')}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition-all hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Browse Tournaments
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sponsorships.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">💼</div>
            <h2 className="text-xl font-black text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              No sponsorships yet
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Browse tournaments and invest in one to get started.
            </p>
            <button
              onClick={() => navigate('/sponsor/tournaments')}
              className="px-6 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition-colors"
            >
              Browse Tournaments
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { label: 'Total Invested', value: `₹${totalInvested.toLocaleString('en-IN')}`, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Prize Contributions', value: `₹${totalPrizeContribution.toLocaleString('en-IN')}`, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Active Sponsorships', value: activeSponsorships.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-xl p-5`}>
                  <div className={`text-3xl font-black tracking-tight ${s.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Sponsorships list */}
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                Your Sponsorships
              </h2>
              {sponsorships.map((s) => (
                <div key={s._id} className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-lg text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                          {s.tournamentId?.name}
                        </h3>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${tierColor[s.tier]}`}>
                          {s.tier}
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColor[s.tournamentId?.status]}`}>
                          {s.tournamentId?.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {s.tournamentId?.sport} · {s.tournamentId?.venue?.name}, {s.tournamentId?.venue?.city}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Business: <span className="font-semibold text-gray-600">{s.businessName}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Amount paid</div>
                      <div className="text-xl font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                        ₹{s.amount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Prize Contribution</p>
                      <p className="text-base font-black text-purple-600" style={{ fontFamily: "'Syne', sans-serif" }}>
                        ₹{s.prizeContribution.toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Set by organiser</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Operating Revenue</p>
                      <p className="text-base font-black text-gray-700" style={{ fontFamily: "'Syne', sans-serif" }}>
                        ₹{(s.amount - s.prizeContribution).toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Goes to organiser</p>
                    </div>
                  </div>

                  {/* Impact report if tournament completed */}
                  {s.tournamentId?.status === 'completed' && s.impactReport?.teamsReached > 0 && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Impact Report</p>
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: 'Teams Reached', value: s.impactReport.teamsReached },
                          { label: 'Players Reached', value: s.impactReport.playersReached },
                          { label: 'Matches Played', value: s.impactReport.matchesPlayed },
                          { label: 'Est. Audience', value: s.impactReport.estimatedAudience },
                        ].map((r) => (
                          <div key={r.label} className="text-center">
                            <div className="text-lg font-black text-amber-500" style={{ fontFamily: "'Syne', sans-serif" }}>{r.value}</div>
                            <div className="text-xs text-gray-400">{r.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SponsorLayout>
  );
}