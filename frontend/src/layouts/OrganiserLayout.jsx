import OrganiserSidebar from '../components/sidebars/OrganiserSidebar';

export default function OrganiserLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <OrganiserSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}