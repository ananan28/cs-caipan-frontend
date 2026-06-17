import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Send, Search, User, Wallet, Clock, CheckCircle, XCircle } from 'lucide-react';

type TransferRecord = {
  id: string;
  from_user: string;
  to_user: string;
  amount: number;
  fee: number;
  net_amount: number;
  status: 'pending' | 'completed' | 'failed';
  note: string;
  created_at: string;
  from_username?: string;
  to_username?: string;
};

export function Transfer() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');
  const [feePercent, setFeePercent] = useState(5);
  const [minTransfer, setMinTransfer] = useState(10);
  const [maxTransfer, setMaxTransfer] = useState(10000);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<TransferRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'transfer' | 'history'>('transfer');

  useEffect(() => {
    fetchConfig();
    fetchBalance();
    fetchRecords();
    fetchUsers();
  }, [user?.id]);

  const fetchConfig = async () => {
    const { data } = await supabase
      .from('system_configs')
      .select('key, value')
      .in('key', ['transfer_fee_percent', 'min_transfer_amount', 'max_transfer_amount']);
    if (data) {
      data.forEach((c: any) => {
        if (c.key === 'transfer_fee_percent') setFeePercent(parseFloat(c.value) || 5);
        if (c.key === 'min_transfer_amount') setMinTransfer(parseFloat(c.value) || 10);
        if (c.key === 'max_transfer_amount') setMaxTransfer(parseFloat(c.value) || 10000);
      });
    }
  };

  const fetchBalance = async () => {
    const { data } = await supabase
      .from('points_accounts')
      .select('balance')
      .eq('user_id', user?.id)
      .single();
    if (data) setBalance(data.balance);
  };

  const fetchRecords = async () => {
    const { data } = await supabase
      .from('points_ledger')
      .select('*')
      .or(`user_id.eq.${user?.id}`)
      .in('type', ['transfer_out', 'transfer_in'])
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) {
      const formatted = data.map((r: any) => ({
        id: r.id,
        from_user: r.user_id,
        to_user: r.user_id,
        amount: Math.abs(r.amount),
        fee: 0,
        net_amount: Math.abs(r.amount),
        status: 'completed',
        note: r.description || '',
        created_at: r.created_at,
      }));
      setRecords(formatted);
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, email')
      .neq('id', user?.id)
      .limit(100);
    if (data) setUsers(data);
  };

  const searchUsers = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const results = users.filter(u =>
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(results.slice(0, 10));
  };

  const handleTransfer = async () => {
    if (!selectedUser) {
      alert('请选择要转账的用户');
      return;
    }
    if (amount < minTransfer) {
      alert(`最低转账 ${minTransfer} 积分`);
      return;
    }
    if (amount > maxTransfer) {
      alert(`最高转账 ${maxTransfer} 积分`);
      return;
    }
    if (amount > balance) {
      alert('余额不足');
      return;
    }

    const fee = amount * (feePercent / 100);
    const netAmount = amount - fee;

    if (!confirm(`确认转账？\n\n转出: ${amount} 积分\n手续费: ${fee.toFixed(2)} 积分\n到账: ${netAmount.toFixed(2)} 积分\n\n收款人: ${selectedUser.username}`)) return;

    setLoading(true);
    try {
      // 1. 扣除转出方
      const { data: fromAccount } = await supabase
        .from('points_accounts')
        .select('id, balance')
        .eq('user_id', user?.id)
        .single();

      await supabase
        .from('points_accounts')
        .update({ balance: fromAccount.balance - amount })
        .eq('user_id', user?.id);

      // 2. 增加接收方
      const { data: toAccount } = await supabase
        .from('points_accounts')
        .select('id, balance')
        .eq('user_id', selectedUser.id)
        .single();

      await supabase
        .from('points_accounts')
        .update({ balance: toAccount.balance + netAmount })
        .eq('user_id', selectedUser.id);

      // 3. 记录流水
      await supabase.from('points_ledger').insert([
        {
          user_id: user?.id,
          account_id: fromAccount.id,
          amount: -amount,
          balance_after: fromAccount.balance - amount,
          type: 'transfer_out',
          description: `转账给 ${selectedUser.username}，手续费 ${fee.toFixed(2)}`,
        },
        {
          user_id: selectedUser.id,
          account_id: toAccount.id,
          amount: netAmount,
          balance_after: toAccount.balance + netAmount,
          type: 'transfer_in',
          description: `收到 ${user?.email} 的转账 ${netAmount.toFixed(2)} 积分`,
        }
      ]);

      alert('✅ 转账成功！');
      setAmount(0);
      setSelectedUser(null);
      setSearchResults([]);
      setSearchQuery('');
      fetchBalance();
      fetchRecords();
    } catch (error: any) {
      alert('转账失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFeeAmount = (amount: number) => {
    return amount * (feePercent / 100);
  };

  const getNetAmount = (amount: number) => {
    return amount - getFeeAmount(amount);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Send className="text-blue-500" size={28} />
            积分转账
          </h1>
          <p className="text-gray-400 text-sm">向其他用户转账积分</p>
        </div>
        <div className="text-sm text-amber-500 bg-amber-500/10 px-4 py-2 rounded-lg border border-amber-500/20">
          余额: {balance.toFixed(2)} 积分
        </div>
      </div>

      <div className="flex gap-2 border-b border-[#1e2a45] pb-2">
        <button
          onClick={() => setActiveTab('transfer')}
          className={`px-4 py-2 rounded-lg text-sm transition ${activeTab === 'transfer' ? 'bg-primary-600/20 text-primary-400' : 'text-gray-400 hover:text-white'}`}
        >
          💸 转账
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-sm transition ${activeTab === 'history' ? 'bg-primary-600/20 text-primary-400' : 'text-gray-400 hover:text-white'}`}
        >
          📋 转账记录
        </button>
      </div>

      {activeTab === 'transfer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="bg-[#141b2d] border-[#1e2a45] lg:col-span-2">
            <h3 className="text-white font-semibold mb-3">📝 转账</h3>

            {/* 搜索用户 */}
            <div>
              <label className="text-gray-400 text-sm">搜索收款人</label>
              <div className="flex gap-2 mt-1">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="输入用户名或邮箱"
                  className="flex-1 bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm"
                />
                <Button size="sm" variant="secondary" onClick={searchUsers}>搜索</Button>
              </div>
            </div>

            {/* 搜索结果 */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-[#1e2a45] rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                {searchResults.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => { setSelectedUser(u); setSearchResults([]); setSearchQuery(u.username); }}
                    className={`p-2 cursor-pointer hover:bg-[#1a2340] border-b border-[#1e2a45]/50 flex items-center gap-3 ${selectedUser?.id === u.id ? 'bg-primary-500/10' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-white font-bold">
                      {u.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-white text-sm">{u.username}</p>
                      <p className="text-gray-400 text-xs">{u.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 选中用户 */}
            {selectedUser && (
              <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-white font-bold">
                  {selectedUser.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-white text-sm">✅ 收款人: {selectedUser.username}</p>
                  <p className="text-gray-400 text-xs">{selectedUser.email}</p>
                </div>
              </div>
            )}

            {/* 转账金额 */}
            <div className="mt-3">
              <label className="text-gray-400 text-sm">转账金额 (积分)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                min={minTransfer}
                max={maxTransfer}
                className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">最低 {minTransfer} · 最高 {maxTransfer} 积分</p>
            </div>

            {/* 备注 */}
            <div className="mt-3">
              <label className="text-gray-400 text-sm">备注 (可选)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="转账说明"
                className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm mt-1"
              />
            </div>

            {/* 费用明细 */}
            {amount > 0 && (
              <div className="mt-3 p-3 bg-[#0a0e1a] rounded-lg border border-[#1e2a45] text-sm">
                <div className="flex justify-between"><span className="text-gray-400">转账金额</span><span className="text-white">{amount} 积分</span></div>
                <div className="flex justify-between"><span className="text-gray-400">手续费 ({feePercent}%)</span><span className="text-yellow-500">{getFeeAmount(amount).toFixed(2)} 积分</span></div>
                <div className="flex justify-between border-t border-[#1e2a45] pt-1 mt-1"><span className="text-gray-400">到账金额</span><span className="text-green-500">{getNetAmount(amount).toFixed(2)} 积分</span></div>
              </div>
            )}

            <Button className="mt-3 w-full" onClick={handleTransfer} loading={loading} disabled={!selectedUser || amount <= 0}>
              <Send size={16} /> 确认转账
            </Button>
          </Card>

          <Card className="bg-[#141b2d] border-[#1e2a45]">
            <h3 className="text-white font-semibold mb-3">📊 转账规则</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">手续费</span>
                <span className="text-amber-500">{feePercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">最低转账</span>
                <span className="text-white">{minTransfer} 积分</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">最高转账</span>
                <span className="text-white">{maxTransfer} 积分</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">余额</span>
                <span className="text-amber-500">{balance.toFixed(2)} 积分</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <Card className="bg-[#141b2d] border-[#1e2a45]">
          <h3 className="text-white font-semibold mb-3">📋 转账记录</h3>
          {records.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">暂无转账记录</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {records.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-[#0a0e1a] rounded-lg">
                  <div>
                    <p className="text-white text-sm">{r.note || '转账'}</p>
                    <p className="text-gray-500 text-xs">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${r.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {r.amount > 0 ? '+' : ''}{r.amount.toFixed(2)}
                    </span>
                    <p className="text-gray-500 text-xs">手续费: {r.fee.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
