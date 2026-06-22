import { useState, useEffect } from 'react';
import SponsorLayout from '../../layouts/SponsorLayout';
import sponsorshipService from '../../services/sponsorshipService';

const tierColor = {
  platinum: 'bg-purple-100 text-purple-600',
  gold: 'bg-yellow-100 text-yellow-600',
  silver: 'bg-gray-100 text-gray-600',
  bronze: 'bg-orange-100 text-orange-600',
};

export default function MySponsorshipsPage() {
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

  return (
    <SponsorLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
            My Sponsorships
          </h1>
          <p className="text-gray-500 mt-1">All your tournament sponsorships in one place.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sponsorships.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">💼</div>
            <h2 className="text-xl font-black text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>No sponsorships yet</h2>
            <p className="text-gray-400 text-sm">Browse tournaments and sponsor one to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
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
                    </div>
                    <p className="text-xs text-gray-400">
                      {s.tournamentId?.sport} · {s.tournamentId?.venue?.city}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Business: <span className="font-semibold">{s.businessName}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Amount paid</div>
                    <div className="text-xl font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                      ₹{s.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Prize Contribution</p>
                    <p className="text-base font-black text-purple-600" style={{ fontFamily: "'Syne', sans-serif" }}>
                      ₹{s.prizeContribution.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Operating Revenue</p>
                    <p className="text-base font-black text-gray-700" style={{ fontFamily: "'Syne', sans-serif" }}>
                      ₹{(s.amount - s.prizeContribution).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {s.tournamentId?.status === 'completed' && s.impactReport?.teamsReached > 0 && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Impact Report</p>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'Teams', value: s.impactReport.teamsReached },
                        { label: 'Players', value: s.impactReport.playersReached },
                        { label: 'Matches', value: s.impactReport.matchesPlayed },
                        { label: 'Audience', value: s.impactReport.estimatedAudience },
                      ].map((r) => (
                        <div key={r.label} className="text-center bg-amber-50 rounded-lg p-2">
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
        )}
      </div>
    </SponsorLayout>
  );
}