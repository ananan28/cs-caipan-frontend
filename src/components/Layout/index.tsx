import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '../../store/authStore';

export function Layout() {
  const { user } = useAuthStore();
  if (!user) return <Outlet />;
  
  return (
    <div className="min-h-screen bg-[#0a0e1a] flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6">
          <div className="glass-card rounded-2xl p-6 min-h-[calc(100vh-180px)]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
