import { useState, useEffect } from 'react';
import CaptainLayout from '../../layouts/CaptainLayout';
import teamService from '../../services/teamService';

const sportEmoji = {
  cricket: '🏏', football: '⚽', badminton: '🏸',
  kabaddi: '🤼', basketball: '🏀', volleyball: '🏐',
};

const paymentColor = {
  pending: 'bg-red-100 text-red-600',
  paid: 'bg-emerald-100 text-emerald-600',
  cash: 'bg-amber-100 text-amber-600',
};

export default function MyTeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await teamService.getMyTeams();
        setTeams(data.teams);
      } catch (error) {
        console.error('Failed to fetch teams', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  return (
    <CaptainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
            My Teams
          </h1>
          <p className="text-gray-500 mt-1">All teams you've registered across tournaments.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : teams.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">🧢</div>
            <h2 className="text-xl font-black text-gray-900 mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>No teams yet</h2>
            <p className="text-gray-400 text-sm">Register a team in a tournament to see it here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {teams.map((team) => {
              const t = team.tournamentId;
              if (!t) return null;
              return (
                <div key={team._id} className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{sportEmoji[t.sport]}</div>
                      <div>
                        <h3 className="font-black text-lg text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>{t.name}</h3>
                        <p className="text-xs text-gray-400 capitalize">{t.sport} · {t.format} · {t.venue?.city}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${paymentColor[team.paymentStatus]}`}>
                        {team.paymentStatus}
                      </span>
                      {team.isApproved && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-600">
                          Approved ✓
                        </span>
                      )}
                      {team.isWaitlisted && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-600">
                          Waitlisted
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-400 mb-1">Team name</p>
                    <p className="text-base font-black text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>{team.teamName}</p>
                  </div>

                  {/* Players table */}
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">
                      Players ({team.players?.length})
                    </p>
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                      {team.players?.map((p, i) => (
                        <div key={i} className={`flex items-center gap-4 px-4 py-3 ${i !== team.players.length - 1 ? 'border-b border-gray-100' : ''}`}>
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                            {i + 1}
                          </div>
                          <span className="text-sm font-medium text-gray-700 flex-1">{p.name}</span>
                          {p.phone && <span className="text-xs text-gray-400">{p.phone}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CaptainLayout>
  );
}