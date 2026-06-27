import OrganiserSidebar from '../components/sidebars/OrganiserSidebar';

export default function OrganiserLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="sticky top-0 h-screen flex-shrink-0">
        <OrganiserSidebar />
      </div>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}