import { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/UI/Card';
import { Users, Wallet, FileText, TrendingUp, UserCheck, Activity, Clock, DollarSign } from 'lucide-react';

export function GMDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    totalPoints: 0,
    pendingTopups: 0,
    activeUsers: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchGMData();
  }, []);

  const fetchGMData = async () => {
    try {
      const [usersRes, tasksRes, pointsRes, topupsRes, ordersRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('tasks').select('id', { count: 'exact', head: true }),
        supabase.from('points_accounts').select('balance'),
        supabase.from('topup_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('topup_requests').select('id', { count: 'exact', head: true }),
      ]);

      const totalPoints = pointsRes.data?.reduce((sum: number, p: any) => sum + (p.balance || 0), 0) || 0;

      // 活跃用户（最近登录）
      const { data: activeUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('status', 'active')
        .limit(100);

      setStats({
        totalUsers: usersRes.count || 0,
        totalTasks: tasksRes.count || 0,
        totalPoints: totalPoints,
        pendingTopups: topupsRes.count || 0,
        activeUsers: activeUsers?.length || 0,
        totalOrders: ordersRes.count || 0,
      });

      // 最近活动
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentActivities(logs || []);

    } catch (error) {
      console.error('GM Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: '总用户', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
    { label: '活跃用户', value: stats.activeUsers, icon: UserCheck, color: 'text-green-500' },
    { label: '总任务', value: stats.totalTasks, icon: FileText, color: 'text-purple-500' },
    { label: '总积分', value: stats.totalPoints, icon: Wallet, color: 'text-amber-500' },
    { label: '待审核充值', value: stats.pendingTopups, icon: Clock, color: 'text-red-500' },
    { label: '总订单', value: stats.totalOrders, icon: DollarSign, color: 'text-cyan-500' },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserCheck className="text-primary-500" size={28} />
            GM 控制台
          </h1>
          <p className="text-gray-400 text-sm">管理面板 - 欢迎 {user?.email}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full">
          <Activity size={16} /> 系统运行正常
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card) => (
          <Card key={card.label} className="bg-[#141b2d] border-[#1e2a45] p-3 hover:border-primary-500/30 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">{card.label}</p>
                <p className="text-xl font-bold text-white mt-0.5">
                  {loading ? '...' : card.value}
                </p>
              </div>
              <card.icon className={`w-6 h-6 ${card.color} opacity-80`} />
            </div>
          </Card>
        ))}
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-[#141b2d] border-[#1e2a45] cursor-pointer hover:border-amber-500/30 transition">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <DollarSign className="text-amber-500" size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-xs">待审核</p>
              <p className="text-white font-medium">{stats.pendingTopups} 笔</p>
            </div>
          </div>
        </Card>
        <Card className="bg-[#141b2d] border-[#1e2a45] cursor-pointer hover:border-primary-500/30 transition">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="text-blue-500" size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-xs">总用户</p>
              <p className="text-white font-medium">{stats.totalUsers}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-[#141b2d] border-[#1e2a45] cursor-pointer hover:border-primary-500/30 transition">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <FileText className="text-purple-500" size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-xs">总任务</p>
              <p className="text-white font-medium">{stats.totalTasks}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-[#141b2d] border-[#1e2a45] cursor-pointer hover:border-primary-500/30 transition">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-xs">总积分</p>
              <p className="text-white font-medium">{stats.totalPoints}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 最近活动 */}
      <Card className="bg-[#141b2d] border-[#1e2a45]">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Clock size={18} className="text-gray-400" />
          最近活动
        </h3>
        {recentActivities.length === 0 ? (
          <p className="text-gray-400 text-sm">暂无活动记录</p>
        ) : (
          <div className="space-y-1">
            {recentActivities.map((log, i) => (
              <div key={i} className="flex items-center justify-between p-2 hover:bg-[#1a2340] rounded-lg transition">
                <span className="text-gray-300 text-sm">{log.action || '操作'}</span>
                <span className="text-gray-500 text-xs">{new Date(log.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
