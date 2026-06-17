import { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { 
  Wallet, Check, X, Clock, RefreshCw, Plus,
  Search, Send, Bell, UserCheck
} from 'lucide-react';

type TopupRequest = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  tx_hash: string;
  from_address: string;
  to_address: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'failed';
  note: string;
  created_at: string;
  reviewed_at: string;
  username?: string;
  email?: string;
};

export function TopupReview() {
  const [requests, setRequests] = useState<TopupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    amount: 0,
    currency: 'USDT',
    tx_hash: '',
    from_address: '',
    to_address: '',
    note: ''
  });
  const [users, setUsers] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('id, username, email');
    if (data) setUsers(data);
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('topup_requests')
        .select(`*, profiles:user_id (username, email)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const formatted = data?.map((item: any) => ({
        ...item,
        username: item.profiles?.username,
        email: item.profiles?.email,
      })) || [];
      setRequests(formatted);
    } catch (error) {
      console.error('Fetch topup requests error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ====== 审核通过 ======
  const handleApprove = async (request: TopupRequest) => {
    if (!confirm(`确认通过 ${request.username} 的 ${request.amount} ${request.currency} 充值申请？`)) return;
    setProcessingId(request.id);

    try {
      // 1. 更新充值状态
      await supabase
        .from('topup_requests')
        .update({
          status: 'confirmed',
          reviewed_at: new Date().toISOString(),
          approved_amount: request.amount,
        })
        .eq('id', request.id);

      // 2. 给用户加积分
      const { data: account } = await supabase
        .from('points_accounts')
        .select('id, balance')
        .eq('user_id', request.user_id)
        .single();

      if (account) {
        const newBalance = account.balance + request.amount;
        await supabase
          .from('points_accounts')
          .update({ balance: newBalance })
          .eq('user_id', request.user_id);

        // 3. 记录流水
        await supabase
          .from('points_ledger')
          .insert({
            user_id: request.user_id,
            account_id: account.id,
            amount: request.amount,
            balance_after: newBalance,
            type: 'recharge',
            ref_type: 'topup',
            ref_id: request.id,
            description: `充值审核通过：${request.amount} ${request.currency}`,
          });
      }

      // 4. 发送站内消息通知用户
      await supabase
        .from('messages')
        .insert({
          receiver_id: request.user_id,
          subject: '✅ 充值审核通过',
          content: `您的 ${request.amount} ${request.currency} 充值申请已审核通过，${request.amount * 10} 积分已到账。`,
          type: 'direct',
          sender_id: (await supabase.auth.getUser()).data.user?.id,
        });

      // 5. 关闭关联的工单
      await supabase
        .from('tickets')
        .update({ status: 'resolved' })
        .eq('title', `充值审核 - ${request.amount} ${request.currency}`)
        .eq('user_id', request.user_id);

      alert('✅ 充值已通过，积分已到账，用户已收到通知！');
      fetchRequests();
    } catch (error: any) {
      alert('操作失败：' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  // ====== 审核拒绝 ======
  const handleReject = async (request: TopupRequest) => {
    const reason = prompt('请输入拒绝原因：');
    if (reason === null) return;
    setProcessingId(request.id);

    try {
      await supabase
        .from('topup_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', request.id);

      // 发送拒绝通知
      await supabase
        .from('messages')
        .insert({
          receiver_id: request.user_id,
          subject: '❌ 充值审核被拒绝',
          content: `您的 ${request.amount} ${request.currency} 充值申请已被拒绝。\n原因：${reason}`,
          type: 'direct',
          sender_id: (await supabase.auth.getUser()).data.user?.id,
        });

      alert('✅ 已拒绝该充值申请，用户已收到通知');
      fetchRequests();
    } catch (error: any) {
      alert('操作失败：' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddTopup = async () => {
    if (!formData.user_id || !formData.amount) {
      alert('请选择用户并填写金额');
      return;
    }
    try {
      await supabase.from('topup_requests').insert({
        user_id: formData.user_id,
        amount: formData.amount,
        currency: formData.currency,
        tx_hash: formData.tx_hash || 'manual_' + Date.now(),
        from_address: formData.from_address || 'manual',
        to_address: formData.to_address || 'manual',
        note: formData.note || '手动添加',
        status: 'pending',
      });
      alert('✅ 充值记录已添加，等待审核');
      setShowAddForm(false);
      setFormData({ user_id: '', amount: 0, currency: 'USDT', tx_hash: '', from_address: '', to_address: '', note: '' });
      fetchRequests();
    } catch (error: any) {
      alert('添加失败：' + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { label: '待审核', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
      confirmed: { label: '已通过', color: 'bg-green-500/20 text-green-400', icon: Check },
      rejected: { label: '已拒绝', color: 'bg-red-500/20 text-red-400', icon: X },
      completed: { label: '已完成', color: 'bg-blue-500/20 text-blue-400', icon: Check },
      failed: { label: '失败', color: 'bg-gray-500/20 text-gray-400', icon: X },
    };
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;
    return <span className={`text-xs px-2 py-1 rounded-full ${config.color} flex items-center gap-1`}>
      <Icon size={12} /> {config.label}
    </span>;
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const filtered = requests.filter(r => 
    r.username?.includes(search) || r.email?.includes(search) || r.tx_hash?.includes(search)
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="text-amber-500" size={28} />
            充值审核
          </h1>
          <p className="text-gray-400 text-sm">审核通过自动加积分 · 自动通知用户</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={fetchRequests}><RefreshCw size={16} /></Button>
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}><Plus size={16} /> 添加充值</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '总申请', value: requests.length, color: 'text-blue-500' },
          { label: '待审核', value: pendingCount, color: 'text-yellow-500' },
          { label: '已通过', value: requests.filter(r => r.status === 'confirmed').length, color: 'text-green-500' },
          { label: '已拒绝', value: requests.filter(r => r.status === 'rejected').length, color: 'text-red-500' },
        ].map((stat, i) => (
          <Card key={i} className="bg-[#141b2d] border-[#1e2a45] p-3">
            <p className="text-xs text-gray-400">{stat.label}</p>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {showAddForm && (
        <Card className="bg-[#141b2d] border-[#1e2a45] p-4">
          <h3 className="text-white font-semibold mb-3">➕ 手动添加充值</h3>
          <div className="grid grid-cols-2 gap-3">
            <select value={formData.user_id} onChange={(e) => setFormData({ ...formData, user_id: e.target.value })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm">
              <option value="">选择用户</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.email})</option>)}
            </select>
            <input type="number" placeholder="金额" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm" />
            <input placeholder="TxHash (可选)" value={formData.tx_hash} onChange={(e) => setFormData({ ...formData, tx_hash: e.target.value })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm" />
            <input placeholder="备注" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm" />
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={handleAddTopup}>添加</Button>
            <Button variant="secondary" onClick={() => setShowAddForm(false)}>取消</Button>
          </div>
        </Card>
      )}

      <Card className="bg-[#141b2d] border-[#1e2a45] p-3">
        <div className="flex items-center gap-3">
          <Search className="text-gray-500" size={16} />
          <input placeholder="搜索用户或TxHash..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none" />
          <span className="text-xs text-gray-400">{requests.length} 条</span>
        </div>
      </Card>

      <Card className="bg-[#141b2d] border-[#1e2a45] p-0 overflow-hidden">
        {loading ? <div className="text-center py-8 text-gray-400">加载中...</div> : filtered.length === 0 ? <div className="text-center py-8 text-gray-400">暂无充值申请</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0a0e1a]">
                <tr className="border-b border-[#1e2a45]">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">用户</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">金额</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">状态</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">时间</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((req) => (
                  <tr key={req.id} className="border-b border-[#1e2a45]/50 hover:bg-[#1a2340] transition">
                    <td className="py-3 px-4">
                      <p className="text-white font-medium text-sm">{req.username || '未知用户'}</p>
                      <p className="text-gray-400 text-xs">{req.email}</p>
                    </td>
                    <td className="py-3 px-4"><span className="text-amber-500 font-medium">{req.amount} {req.currency}</span></td>
                    <td className="py-3 px-4">{getStatusBadge(req.status)}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{new Date(req.created_at).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      {req.status === 'pending' && (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="success" onClick={() => handleApprove(req)} loading={processingId === req.id}>
                            <Check size={14} /> 通过
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleReject(req)} loading={processingId === req.id}>
                            <X size={14} /> 拒绝
                          </Button>
                        </div>
                      )}
                      {req.status === 'confirmed' && <span className="text-green-500 text-xs">✅ 已到账</span>}
                      {req.status === 'rejected' && <span className="text-red-500 text-xs">❌ {req.rejection_reason || '已拒绝'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
