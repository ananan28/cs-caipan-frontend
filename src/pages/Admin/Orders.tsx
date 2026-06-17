import { useState } from 'react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { BarChart3, RefreshCw, Search } from 'lucide-react';

type Order = {
  id: string;
  user: string;
  type: 'recharge' | 'task' | 'refund';
  amount: number;
  points: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
};

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([
    { id: '1', user: 'admin@caisheng.com', type: 'recharge', amount: 100, points: 1000, status: 'completed', createdAt: new Date().toISOString() },
    { id: '2', user: 'test@test.com', type: 'task', amount: 10, points: 100, status: 'pending', createdAt: new Date().toISOString() },
  ]);
  const [search, setSearch] = useState('');

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    completed: 'bg-green-500/20 text-green-500',
    failed: 'bg-red-500/20 text-red-500',
    refunded: 'bg-gray-500/20 text-gray-400',
  };
  const statusLabels = { pending: '待处理', completed: '已完成', failed: '失败', refunded: '已退款' };
  const typeLabels = { recharge: '充值', task: '任务消费', refund: '退款' };

  const filtered = orders.filter(o => o.user.includes(search) || o.id.includes(search));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-primary-500" size={28} />
            订单中心
          </h1>
          <p className="text-gray-400 text-sm">所有订单记录</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => {}}><RefreshCw size={16} /></Button>
      </div>

      <Card className="bg-[#141b2d] border-[#1e2a45] p-3">
        <div className="flex items-center gap-3">
          <Search className="text-gray-500" size={16} />
          <input
            placeholder="搜索订单..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none"
          />
          <span className="text-xs text-gray-400">{orders.length} 个订单</span>
        </div>
      </Card>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#0a0e1a]">
            <tr className="border-b border-[#1e2a45]">
              <th className="text-left py-3 text-gray-400 font-medium">订单号</th>
              <th className="text-left py-3 text-gray-400 font-medium">用户</th>
              <th className="text-left py-3 text-gray-400 font-medium">类型</th>
              <th className="text-left py-3 text-gray-400 font-medium">金额</th>
              <th className="text-left py-3 text-gray-400 font-medium">积分</th>
              <th className="text-left py-3 text-gray-400 font-medium">状态</th>
              <th className="text-left py-3 text-gray-400 font-medium">时间</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-b border-[#1e2a45]/50 hover:bg-[#1a2340] transition">
                <td className="py-3 text-white text-xs font-mono">#{o.id.slice(0,8)}</td>
                <td className="py-3 text-gray-300 text-xs">{o.user}</td>
                <td className="py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400">{typeLabels[o.type]}</span></td>
                <td className="py-3 text-amber-500">${o.amount}</td>
                <td className="py-3 text-white">{o.points}</td>
                <td className="py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[o.status]}`}>{statusLabels[o.status]}</span></td>
                <td className="py-3 text-gray-400 text-xs">{new Date(o.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
