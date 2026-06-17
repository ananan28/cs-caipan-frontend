import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '../../store/authStore';

export function Layout() {
  const { user } = useAuthStore();
  if (!user) return <Outlet />;
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{
        backgroundImage: `url(/dragon-bg.jpg)`,
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm -z-0"></div>
      <div className="relative z-10 flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col ml-64">
          <Header />
          <main className="flex-1 p-6 relative">
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 min-h-[calc(100vh-120px)] border border-white/5">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
