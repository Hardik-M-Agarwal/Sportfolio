import CaptainSidebar from '../components/sidebars/CaptainSidebar';

export default function CaptainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <CaptainSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}