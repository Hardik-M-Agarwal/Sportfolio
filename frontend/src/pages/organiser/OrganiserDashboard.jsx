import OrganiserLayout from '../../layouts/OrganiserLayout';
import { useAuth } from '../../context/AuthContext';

export default function OrganiserDashboard() {
  const { user } = useAuth();

  return (
    <OrganiserLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your tournaments.</p>
        </div>

        {/* Placeholder stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Total Tournaments', value: '—', color: 'bg-blue-50 text-blue-600' },
            { label: 'Active Tournaments', value: '—', color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Total Revenue', value: '—', color: 'bg-purple-50 text-purple-600' },
            { label: 'Teams Registered', value: '—', color: 'bg-amber-50 text-amber-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full inline-block mb-3 ${s.color}`}>
                {s.label}
              </div>
              <div className="text-3xl font-black text-gray-300 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                {s.value}
              </div>
              <p className="text-xs text-gray-400 mt-1">Data available once tournaments are created</p>
            </div>
          ))}
        </div>

        {/* Coming soon banner */}
        <div className="mt-8 bg-gray-900 rounded-2xl p-8 text-center">
          <div className="text-2xl font-black text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
            Dashboard coming soon
          </div>
          <p className="text-white/50 text-sm">
            Full analytics — revenue charts, team stats, match summaries — will populate here as you run tournaments.
          </p>
          
            <a href="/organiser/tournaments"
            className="inline-block mt-5 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Tournaments →
          </a>
        </div>
      </div>
    </OrganiserLayout>
  );
}