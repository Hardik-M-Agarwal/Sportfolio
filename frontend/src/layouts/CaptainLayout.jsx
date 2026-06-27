import CaptainSidebar from '../components/sidebars/CaptainSidebar';

export default function CaptainLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="sticky top-0 h-screen flex-shrink-0">
        <CaptainSidebar />
      </div>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}