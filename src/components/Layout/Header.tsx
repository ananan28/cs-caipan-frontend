import { useNavigate } from 'react-router-dom';
import { Bell, Search, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../api/supabase';

export function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-tech-gradient border-b border-primary-700/20 flex items-center justify-between px-6 ml-64">
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500/40" size={18} />
          <input
            type="text"
            placeholder="搜索任务、用户..."
            className="w-full bg-primary-900/20 border border-primary-700/20 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-primary-500/30 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-primary-900/20 transition-colors border border-transparent hover:border-primary-700/20">
          <Bell size={18} className="text-primary-400/60" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#0a0e1a]"></span>
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-primary-700/20">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-white font-medium">{user?.email || '未登录'}</p>
            <p className="text-[10px] text-primary-400/50">已认证</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
