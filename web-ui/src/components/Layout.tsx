import { Outlet, Link } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-900 text-white p-4">
        <h1 className="text-xl font-bold mb-8">🔥 FlowForge</h1>
        <nav className="space-y-2">
          <Link to="/" className="block px-4 py-2 rounded hover:bg-gray-800">
            Dashboard
          </Link>
          <Link to="/services" className="block px-4 py-2 rounded hover:bg-gray-800">
            Services
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
