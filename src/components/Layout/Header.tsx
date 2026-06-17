import { useNavigate } from 'react-router-dom';
import { Search, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../api/supabase';
import { useState } from 'react';
import { NotificationBell } from '../NotificationBell';

export function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate('/login');
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/users?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-tech-gradient border-b border-primary-700/20 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500/40" size={18} />
          <input
            type="text"
            placeholder="搜索任务、用户..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full bg-primary-900/20 border border-primary-700/20 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-primary-500/30 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <NotificationBell />

        <div className="flex items-center gap-2 pl-3 border-l border-primary-700/20">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-white font-medium truncate max-w-[120px]">{user?.email || '未登录'}</p>
            <p className="text-[10px] text-primary-400/50 flex items-center justify-end gap-1">
              <span>🐉</span> 已认证
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
