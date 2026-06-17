import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Wallet, TrendingUp, TrendingDown, RefreshCw, Search, History } from 'lucide-react';

type User = {
  id: string;
  username: string;
  email: string;
  balance: number;
};

export function PointsAdjust() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'add' | 'subtract'>('add');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('user_list').select('id, username, email, balance').order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  };

  const fetchLogs = async (userId: string) => {
    if (!userId) return;
    const { data } = await supabase.from('points_ledger').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10);
    setLogs(data || []);
  };

  const handleAdjust = async () => {
    if (!selectedUser) { alert('请选择用户'); return; }
    if (!amount || amount <= 0) { alert('请输入有效的积分数量'); return; }
    if (!reason) { alert('请输入调整原因'); return; }

    setLoading(true);
    try {
      const adjustedAmount = type === 'add' ? amount : -amount;
      const { data: userData } = await supabase.from('points_accounts').select('id, balance').eq('user_id', selectedUser).single();
      if (!userData) throw new Error('用户积分账户不存在');
      const newBalance = userData.balance + adjustedAmount;
      if (newBalance < 0) { alert('积分不能为负数'); setLoading(false); return; }

      await supabase.from('points_accounts').update({ balance: newBalance }).eq('user_id', selectedUser);
      await supabase.from('points_ledger').insert({
        user_id: selectedUser,
        account_id: userData.id,
        amount: adjustedAmount,
        balance_after: newBalance,
        type: 'adjust',
        description: `管理员${type === 'add' ? '增加' : '扣除'}积分：${reason}`,
      });

      alert(`✅ 积分调整成功！${type === 'add' ? '增加' : '扣除'} ${amount} 积分`);
      fetchUsers();
      fetchLogs(selectedUser);
      setAmount(0);
      setReason('');
    } catch (error: any) {
      alert('调整失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => u.username?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="text-amber-500" size={28} />
            积分调整
          </h1>
          <p className="text-gray-400 text-sm">Owner 手动调整用户积分</p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchUsers}><RefreshCw size={16} /> 刷新</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-[#141b2d] border-[#1e2a45] p-4">
          <h3 className="text-white font-semibold mb-3">📝 调整积分</h3>
          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-sm">选择用户</label>
              <select value={selectedUser} onChange={(e) => { setSelectedUser(e.target.value); fetchLogs(e.target.value); }} className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-2 text-white text-sm mt-1">
                <option value="">选择用户</option>
                {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.username} ({u.email}) - {u.balance || 0}积分</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setType('add')} className={`flex-1 px-4 py-2 rounded-lg transition ${type === 'add' ? 'bg-green-600 text-white' : 'bg-[#0a0e1a] text-gray-400 hover:text-white'}`}><TrendingUp size={16} className="inline mr-1" /> 增加</button>
              <button onClick={() => setType('subtract')} className={`flex-1 px-4 py-2 rounded-lg transition ${type === 'subtract' ? 'bg-red-600 text-white' : 'bg-[#0a0e1a] text-gray-400 hover:text-white'}`}><TrendingDown size={16} className="inline mr-1" /> 扣除</button>
            </div>
            <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} min={1} placeholder="输入积分数量" className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-2 text-white text-sm" />
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="调整原因" className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-2 text-white text-sm" />
            <Button onClick={handleAdjust} loading={loading} className="w-full">{type === 'add' ? '➕ 增加积分' : '➖ 扣除积分'}</Button>
          </div>
        </Card>

        <Card className="bg-[#141b2d] border-[#1e2a45] p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <History size={18} className="text-gray-400" />
            操作记录 {selectedUser && <span className="text-xs text-gray-500">(最近10条)</span>}
          </h3>
          {logs.length === 0 ? <p className="text-gray-400 text-sm">暂无记录</p> : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-[#0a0e1a] rounded-lg text-sm">
                  <span className={`${log.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>{log.amount > 0 ? '+' : ''}{log.amount}</span>
                  <span className="text-gray-400 text-xs">{log.description}</span>
                  <span className="text-gray-500 text-xs">{new Date(log.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="bg-[#141b2d] border-[#1e2a45] p-3">
        <div className="flex items-center gap-3">
          <Search className="text-gray-500" size={16} />
          <input placeholder="搜索用户..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none" />
          <span className="text-xs text-gray-400">{users.length} 个用户</span>
        </div>
      </Card>
    </div>
  );
}
