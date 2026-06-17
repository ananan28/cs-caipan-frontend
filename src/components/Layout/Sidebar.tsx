import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Wallet, Grid3x3, Shield, Activity, 
  Server, Gift, BarChart3, Trash2, LogOut, History, UserCog, 
  Key, TrendingUp, DollarSign, Settings, MessageCircle, 
  Ticket, Megaphone, MapPin, Crown, ClipboardList,
  BarChart, User, Power, Percent
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../api/supabase';

const menuGroups = [
  { label: '超级管理', items: [
    { path: '/super', icon: Crown, label: '超级管理台', roles: ['owner'] },
    { path: '/admin/fees', icon: Percent, label: '手续费管理', roles: ['owner'] },
  ]},
  { label: '核心', items: [
    { path: '/', icon: LayoutDashboard, label: '控制台', roles: ['owner', 'gm'] },
    { path: '/gm', icon: UserCog, label: 'GM控制台', roles: ['gm'] },
    { path: '/users', icon: Users, label: '用户中心', roles: ['owner', 'gm', 'agent'] },
    { path: '/wallet', icon: Wallet, label: '我的余额', roles: ['owner', 'gm', 'agent', 'user'] },
    { path: '/profile', icon: User, label: '个人中心', roles: ['owner', 'gm', 'agent', 'user'] },
  ]},
  { label: '业务', items: [
    { path: '/tasks', icon: Grid3x3, label: '功能中心', roles: ['owner', 'gm', 'agent', 'user'] },
    { path: '/history', icon: History, label: '检测历史', roles: ['owner', 'gm', 'agent', 'user'] },
  ]},
  { label: '消息', items: [
    { path: '/messages', icon: MessageCircle, label: '站内消息', roles: ['owner', 'gm', 'agent', 'user'] },
    { path: '/tickets', icon: Ticket, label: '工单系统', roles: ['owner', 'gm', 'agent', 'user'] },
    { path: '/announcements', icon: Megaphone, label: '公告系统', roles: ['owner', 'gm'] },
  ]},
  { label: '管理', items: [
    { path: '/admin/permissions', icon: Shield, label: '权限管理', roles: ['owner'] },
    { path: '/admin/delegation', icon: Key, label: 'Root授权', roles: ['owner'] },
    { path: '/admin/points', icon: TrendingUp, label: '积分调整', roles: ['owner'] },
    { path: '/admin/topup', icon: DollarSign, label: '充值审核', roles: ['owner', 'gm'] },
    { path: '/admin/address', icon: MapPin, label: '地址池管理', roles: ['owner'] },
    { path: '/admin/features', icon: Settings, label: '功能管理', roles: ['owner'] },
    { path: '/admin/workers', icon: Activity, label: 'Worker监控', roles: ['owner', 'gm'] },
    { path: '/admin/providers', icon: Server, label: '接口中心', roles: ['owner'] },
    { path: '/admin/provider-stats', icon: BarChart, label: '接口统计', roles: ['owner'] },
    { path: '/admin/packages', icon: Gift, label: '套餐中心', roles: ['owner'] },
    { path: '/admin/recycle', icon: Trash2, label: '软删除中心', roles: ['owner', 'gm'] },
    { path: '/logs', icon: ClipboardList, label: '系统日志', roles: ['owner', 'gm'] },
  ]},
  { label: '系统', items: [
    { path: '/admin/orders', icon: BarChart3, label: '订单中心', roles: ['owner', 'gm'] },
  ]}
];

export function Sidebar() {
  const { user } = useAuthStore();
  const userRole = user?.role || 'user';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 min-h-screen bg-tech-gradient border-r border-primary-700/20 flex flex-col fixed left-0 top-0 bottom-0 z-50 overflow-y-auto">
      <div className="absolute right-0 bottom-20 text-9xl opacity-5 pointer-events-none">🐉</div>
      <div className="absolute left-0 top-20 text-8xl opacity-5 pointer-events-none">🐲</div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="p-5 border-b border-primary-700/20 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm relative">
              CS
              <span className="absolute -top-1 -right-1 text-[8px]">🐉</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight flex items-center gap-1">
                财盛集团
                <span className="text-primary-400/30 text-xs">🐲</span>
              </h1>
              <p className="text-[10px] text-primary-400/70 tracking-wider">博亿研发中心 · 商业版</p>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-primary-500/50 font-mono tracking-wider flex items-center gap-2">
            <span>🐉</span> V2.8 全球化权限融合版 <span>🐲</span>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-primary-700/20 flex-shrink-0">
          <div className="flex items-center gap-3 bg-primary-900/20 rounded-lg p-2 border border-primary-700/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{user?.email || '未登录'}</p>
              <p className="text-[10px] text-primary-400/60 flex items-center gap-1">
                <span>🐉</span> {userRole} · 已认证
              </p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0">
              <LogOut size={14} />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-3">
          {menuGroups.map((group, idx) => {
            const visibleItems = group.items.filter(item => {
              if (!item.roles) return true;
              return item.roles.includes(userRole);
            });
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx}>
                <p className="text-[10px] text-primary-400/40 uppercase tracking-wider px-3 mb-1.5 font-medium">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                            isActive 
                              ? 'bg-primary-600/20 text-primary-400 border border-primary-500/20' 
                              : 'text-gray-400 hover:text-white hover:bg-primary-900/20'
                          }`
                        }
                      >
                        <Icon size={15} className="flex-shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-primary-700/20 text-center flex-shrink-0">
          <p className="text-[9px] text-primary-500/30 font-mono">© 2026 CS 财盛集团 · 博亿研发中心</p>
        </div>
      </div>
    </aside>
  );
}
