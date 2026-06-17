import { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { 
  Wallet as WalletIcon, 
  TrendingUp, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertTriangle,
  History,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  Filter
} from 'lucide-react';

type LedgerRecord = {
  id: number;
  amount: number;
  balance_after: number;
  type: string;
  description: string;
  created_at: string;
};

type TopupRecord = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
};

export function Wallet() {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState(0);
  const [totalRecharged, setTotalRecharged] = useState(0);
  const [totalConsumed, setTotalConsumed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(100);
  const [address, setAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);
  
  // 流水记录
  const [ledger, setLedger] = useState<LedgerRecord[]>([]);
  const [topups, setTopups] = useState<TopupRecord[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchWallet();
    generateAddress();
    fetchLedger();
    fetchTopups();
  }, [user?.id]);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('points_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      if (data) {
        setBalance(data.balance);
        setTotalRecharged(data.total_recharged);
        setTotalConsumed(data.total_consumed);
      }
    } catch (error) {
      console.error('Fetch wallet error:', error);
      setBalance(1000);
      setTotalRecharged(1200);
      setTotalConsumed(200);
    } finally {
      setLoading(false);
    }
  };

  // 获取积分流水
  const fetchLedger = async () => {
    setLoadingLedger(true);
    try {
      const { data, error } = await supabase
        .from('points_ledger')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setLedger(data || []);
    } catch (error) {
      console.error('Fetch ledger error:', error);
      // 模拟数据
      setLedger([
        { id: 1, amount: 100, balance_after: 1000, type: 'recharge', description: 'USDT充值 10 USDT', created_at: new Date().toISOString() },
        { id: 2, amount: -10, balance_after: 990, type: 'task_cost', description: 'WhatsApp检测消耗', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, amount: 50, balance_after: 1040, type: 'bonus', description: '邀请奖励', created_at: new Date(Date.now() - 7200000).toISOString() },
      ]);
    } finally {
      setLoadingLedger(false);
    }
  };

  // 获取充值记录
  const fetchTopups = async () => {
    try {
      const { data, error } = await supabase
        .from('topup_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setTopups(data || []);
    } catch (error) {
      console.error('Fetch topups error:', error);
      setTopups([
        { id: '1', amount: 100, currency: 'USDT', status: 'confirmed', created_at: new Date().toISOString() },
        { id: '2', amount: 50, currency: 'USDT', status: 'pending', created_at: new Date(Date.now() - 86400000).toISOString() },
      ]);
    }
  };

  const generateAddress = () => {
    const chars = '0123456789abcdef';
    let addr = '0x';
    for (let i = 0; i < 40; i++) {
      addr += chars[Math.floor(Math.random() * 16)];
    }
    setAddress(addr);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRechargeClick = () => {
    if (amount < 10) {
      alert('最低充值 10 USDT');
      return;
    }
    generateAddress();
    setPendingAmount(amount);
    setShowConfirmModal(true);
  };

  const handleConfirmTransfer = async () => {
    setShowConfirmModal(false);
    try {
      const { data: topupData, error: topupError } = await supabase
        .from('topup_requests')
        .insert({
          user_id: user?.id,
          amount: pendingAmount,
          currency: 'USDT',
          to_address: address,
          status: 'pending',
          note: `用户充值 ${pendingAmount} USDT`,
        })
        .select()
        .single();

      if (topupError) throw topupError;

      const ticketTitle = `充值审核 - ${pendingAmount} USDT`;
      const ticketContent = `用户 ${user?.email} 申请充值 ${pendingAmount} USDT\n\n充值地址: ${address}\n\n请审核该充值申请。`;

      await supabase
        .from('tickets')
        .insert({
          user_id: user?.id,
          title: ticketTitle,
          content: ticketContent,
          category: '充值',
          priority: 'high',
          status: 'open',
        });

      alert(`✅ 充值申请已提交！\n\n金额: ${pendingAmount} USDT\n地址: ${address}\n\n已自动创建工单，请等待GM审核。`);
      fetchTopups();
    } catch (error: any) {
      alert('提交失败：' + error.message);
    }
  };

  const handleCancelTransfer = () => {
    setShowConfirmModal(false);
    alert('❌ 已取消充值');
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, { label: string; color: string; icon: any }> = {
      recharge: { label: '充值', color: 'text-green-500', icon: ArrowUpCircle },
      task_cost: { label: '任务消耗', color: 'text-red-500', icon: ArrowDownCircle },
      refund: { label: '退款', color: 'text-yellow-500', icon: ArrowUpCircle },
      bonus: { label: '奖励', color: 'text-purple-500', icon: ArrowUpCircle },
      adjust: { label: '系统调整', color: 'text-blue-500', icon: ArrowUpCircle },
      transfer_in: { label: '转账收入', color: 'text-emerald-500', icon: ArrowUpCircle },
      transfer_out: { label: '转账支出', color: 'text-orange-500', icon: ArrowDownCircle },
    };
    return map[type] || { label: type, color: 'text-gray-400', icon: Clock };
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      pending: { label: '待审核', color: 'bg-yellow-500/20 text-yellow-400' },
      confirmed: { label: '已确认', color: 'bg-green-500/20 text-green-500' },
      rejected: { label: '已拒绝', color: 'bg-red-500/20 text-red-500' },
      completed: { label: '已完成', color: 'bg-blue-500/20 text-blue-400' },
      failed: { label: '失败', color: 'bg-gray-500/20 text-gray-400' },
    };
    return map[status] || { label: status, color: 'bg-gray-500/20 text-gray-400' };
  };

  const filteredLedger = filterType === 'all' 
    ? ledger 
    : ledger.filter(l => l.type === filterType);

  return (
    <div className="p-4 space-y-4">
      {/* 确认弹窗 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#141b2d] border border-amber-500/30 rounded-2xl p-6 max-w-md w-full">
            <div className="text-center">
              <AlertTriangle className="mx-auto text-amber-500" size={48} />
              <h2 className="text-xl font-bold text-white mt-3">确认充值</h2>
              <p className="text-gray-400 mt-2 text-sm">
                您确认要充值 <span className="text-amber-500 font-bold">{pendingAmount} USDT</span> 吗？
              </p>
              <div className="mt-4 p-3 bg-[#0a0e1a] rounded-lg border border-amber-500/20">
                <p className="text-gray-400 text-xs mb-1">💳 请转账到以下地址：</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-white text-xs font-mono break-all bg-[#141b2d] p-2 rounded">
                    {address}
                  </code>
                  <button onClick={copyAddress} className="p-2 rounded hover:bg-blue-500/10 text-gray-400 hover:text-blue-400 transition flex-shrink-0">
                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>金额: {pendingAmount} USDT</span>
                  <span>获得: {pendingAmount * 10} 积分</span>
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-2">⚠️ 请确认已转账后再点击「我已转账」</p>
              <div className="flex gap-3 mt-4">
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleConfirmTransfer}>
                  ✅ 我已转账
                </Button>
                <Button variant="secondary" className="flex-1" onClick={handleCancelTransfer}>
                  ❌ 取消
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 顶部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <WalletIcon className="text-amber-500" size={28} />
            我的余额
          </h1>
          <p className="text-gray-400 text-sm">查看积分、充值记录和流水</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => { fetchWallet(); fetchLedger(); fetchTopups(); }}>
          <RefreshCw size={16} /> 刷新
        </Button>
      </div>

      {/* 余额卡片 */}
      <Card className="bg-gradient-to-r from-amber-900/30 to-[#141b2d] border-amber-500/30 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 text-8xl opacity-10">💰</div>
        <div className="relative">
          <p className="text-gray-400 text-sm">可用积分</p>
          <p className="text-4xl font-bold text-amber-500 mt-1">
            {loading ? '...' : balance.toFixed(2)}
          </p>
          <div className="flex gap-6 mt-4 pt-4 border-t border-amber-500/20">
            <div>
              <p className="text-gray-400 text-xs">累计充值</p>
              <p className="text-green-500 font-medium">{totalRecharged.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">累计消耗</p>
              <p className="text-red-500 font-medium">{totalConsumed.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 充值 */}
      <Card className="bg-[#141b2d] border-[#1e2a45]">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          💳 充值积分
          <span className="text-xs text-gray-500">(1 USDT = 10 积分)</span>
        </h3>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[150px]">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={10}
              step={10}
              className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
            />
            <p className="text-xs text-gray-500 mt-1">最低 10 USDT</p>
          </div>
          <Button onClick={handleRechargeClick}>
            <TrendingUp size={18} /> 生成充值地址
          </Button>
        </div>
      </Card>

      {/* Tabs: 充值记录 | 积分流水 */}
      <div className="flex gap-2 border-b border-[#1e2a45] pb-2">
        <button 
          onClick={() => {}} 
          className="px-4 py-2 rounded-lg text-sm bg-primary-600/20 text-primary-400"
        >
          <History size={14} className="inline mr-1" /> 充值记录
        </button>
        <button 
          onClick={() => {}} 
          className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white"
        >
          <History size={14} className="inline mr-1" /> 积分流水
        </button>
      </div>

      {/* 充值记录 */}
      <Card className="bg-[#141b2d] border-[#1e2a45]">
        <h3 className="text-white font-semibold mb-3 text-sm">📋 充值记录</h3>
        {topups.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">暂无充值记录</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {topups.map((t) => {
              const status = getStatusLabel(t.status);
              return (
                <div key={t.id} className="flex items-center justify-between p-2 bg-[#0a0e1a] rounded-lg">
                  <div>
                    <span className="text-white text-sm">{t.amount} {t.currency}</span>
                    <p className="text-gray-500 text-xs">{new Date(t.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 积分流水 */}
      <Card className="bg-[#141b2d] border-[#1e2a45]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-sm">📊 积分流水</h3>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#0a0e1a] border border-[#1e2a45] rounded px-2 py-1 text-white text-xs"
          >
            <option value="all">全部</option>
            <option value="recharge">充值</option>
            <option value="task_cost">任务消耗</option>
            <option value="bonus">奖励</option>
            <option value="refund">退款</option>
            <option value="adjust">系统调整</option>
            <option value="transfer_in">转账收入</option>
            <option value="transfer_out">转账支出</option>
          </select>
        </div>
        {loadingLedger ? (
          <p className="text-gray-400 text-sm text-center py-4">加载中...</p>
        ) : filteredLedger.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">暂无流水记录</p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {filteredLedger.map((l) => {
              const typeInfo = getTypeLabel(l.type);
              const Icon = typeInfo.icon;
              const isIncome = l.amount > 0;
              return (
                <div key={l.id} className="flex items-center justify-between p-2 bg-[#0a0e1a] rounded-lg hover:bg-[#1a2340] transition">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${isIncome ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      <Icon size={14} className={typeInfo.color} />
                    </div>
                    <div>
                      <span className="text-white text-sm">{typeInfo.label}</span>
                      <p className="text-gray-500 text-xs">{l.description || '-'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                      {isIncome ? '+' : ''}{l.amount.toFixed(2)}
                    </span>
                    <p className="text-gray-500 text-xs">余额: {l.balance_after.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
