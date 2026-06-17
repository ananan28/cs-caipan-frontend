import { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/UI/Card';
import { Users, Wallet, BarChart3, CheckCircle2, TrendingUp } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      const [pointsRes, usersRes] = await Promise.all([
        supabase.from('points_accounts').select('balance').eq('user_id', user?.id).single(),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        totalUsers: usersRes.count || 0,
        balance: pointsRes.data?.balance || 0,
      });
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">控制台</h1>
          <p className="text-gray-400">欢迎回来，{user?.email}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full">
          <TrendingUp size={16} /> 系统运行正常
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '总用户', value: stats.totalUsers, icon: Users, color: 'text-purple-500' },
          { label: '积分余额', value: stats.balance, icon: Wallet, color: 'text-amber-500' },
          { label: '总任务', value: 0, icon: BarChart3, color: 'text-blue-500' },
          { label: '已完成', value: 0, icon: CheckCircle2, color: 'text-green-500' },
        ].map((card) => (
          <Card key={card.label} className="bg-cs-card border-cs-border hover:border-primary-500/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {loading ? '...' : card.value}
                </p>
              </div>
              <card.icon className={`w-8 h-8 ${card.color} opacity-80`} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
