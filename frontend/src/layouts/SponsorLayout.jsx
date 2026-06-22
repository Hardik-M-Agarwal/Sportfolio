import SponsorSidebar from '../components/sidebars/SponsorSidebar';

export default function SponsorLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SponsorSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}