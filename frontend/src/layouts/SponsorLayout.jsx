import SponsorSidebar from '../components/sidebars/SponsorSidebar';

export default function SponsorLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="sticky top-0 h-screen flex-shrink-0">
        <SponsorSidebar />
      </div>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}