import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { 
  Shield, Users, Wallet, TrendingUp, TrendingDown, 
  RefreshCw, Send, Search, UserX, UserCheck,
  Crown, Edit, Save, X, Eye, EyeOff,
  DollarSign, Percent, Gift, Settings
} from 'lucide-react';

type FeeSettings = {
  id: number;
  enabled: boolean;
  transfer_rate: number;
  recycle_rate: number;
  min_fee: number;
  max_fee: number;
  payer: 'sender' | 'receiver' | 'shared' | 'platform';
};

type SystemConfig = {
  exchange_rate: number;
  min_transfer_amount: number;
  max_transfer_amount: number;
};

type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  balance: number;
  points: number;
};

export function SuperDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [feeSettings, setFeeSettings] = useState<FeeSettings>({
    id: 1,
    enabled: true,
    transfer_rate: 0.1,
    recycle_rate: 0.1,
    min_fee: 0,
    max_fee: 999999,
    payer: 'receiver',
  });
  const [configs, setConfigs] = useState<SystemConfig>({
    exchange_rate: 10,
    min_transfer_amount: 10,
    max_transfer_amount: 10000,
  });
  const [platformWallet, setPlatformWallet] = useState({ balance: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'fees' | 'config'>('overview');
  const [searchUser, setSearchUser] = useState('');
  const [searchResult, setSearchResult] = useState<User[]>([]);
  const [editingFee, setEditingFee] = useState(false);
  const [feeForm, setFeeForm] = useState<FeeSettings | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [usersRes, feeRes, configRes, walletRes] = await Promise.all([
        supabase.from('profiles').select('id, username, email, role, status, balance, points').order('created_at', { ascending: false }),
        supabase.from('fee_settings').select('*').limit(1).maybeSingle(),
        supabase.from('system_configs').select('key, value'),
        supabase.from('platform_wallet').select('*').limit(1).maybeSingle(),
      ]);

      if (usersRes.data) setUsers(usersRes.data);
      if (feeRes.data) setFeeSettings(feeRes.data);
      if (walletRes.data) setPlatformWallet({ balance: walletRes.data.balance || 0 });

      if (configRes.data) {
        const config: any = {};
        configRes.data.forEach((c: any) => {
          config[c.key] = parseFloat(c.value) || 0;
        });
        setConfigs({
          exchange_rate: config.exchange_rate || 10,
          min_transfer_amount: config.min_transfer_amount || 10,
          max_transfer_amount: config.max_transfer_amount || 10000,
        });
      }
    } catch (error) {
      console.error('Fetch data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveFeeSettings = async () => {
    const data = feeForm || feeSettings;
    try {
      await supabase
        .from('fee_settings')
        .upsert({
          id: data.id || 1,
          enabled: data.enabled,
          transfer_rate: data.transfer_rate,
          recycle_rate: data.recycle_rate,
          min_fee: data.min_fee,
          max_fee: data.max_fee,
          payer: data.payer,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id || 1);
      alert('✅ 手续费设置已保存');
      setEditingFee(false);
      fetchAllData();
    } catch (error: any) {
      alert('保存失败：' + error.message);
    }
  };

  const updateConfig = async (key: string, value: number) => {
    await supabase.from('system_configs').update({ value: String(value) }).eq('key', key);
    fetchAllData();
  };

  const toggleUserStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'frozen' : 'active';
    if (!confirm(`确定${newStatus === 'active' ? '激活' : '冻结'}此用户吗？`)) return;
    await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
    fetchAllData();
  };

  const totalBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);
  const totalPoints = users.reduce((sum, u) => sum + (u.points || 0), 0);

  const payerLabels = {
    sender: '发送方承担',
    receiver: '接收方承担',
    shared: '双方分摊',
    platform: '平台承担',
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-amber-500" size={28} />
            超级管理台
          </h1>
          <p className="text-gray-400 text-sm">全网管理 · 手续费控制 · 积分转账</p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchAllData}>
          <RefreshCw size={16} /> 刷新
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="bg-[#141b2d] border-[#1e2a45] p-2">
          <p className="text-xs text-gray-400">总用户</p>
          <p className="text-lg font-bold text-white">{users.length}</p>
        </Card>
        <Card className="bg-[#141b2d] border-[#1e2a45] p-2">
          <p className="text-xs text-gray-400">总余额</p>
          <p className="text-lg font-bold text-green-500">${totalBalance.toFixed(0)}</p>
        </Card>
        <Card className="bg-[#141b2d] border-[#1e2a45] p-2">
          <p className="text-xs text-gray-400">总积分</p>
          <p className="text-lg font-bold text-amber-500">{totalPoints.toFixed(0)}</p>
        </Card>
        <Card className="bg-[#141b2d] border-[#1e2a45] p-2">
          <p className="text-xs text-gray-400">平台余额</p>
          <p className="text-lg font-bold text-blue-500">${platformWallet.balance.toFixed(0)}</p>
        </Card>
      </div>

      <div className="flex gap-2 border-b border-[#1e2a45] pb-2 flex-wrap">
        {[
          { key: 'overview', label: '📊 总览' },
          { key: 'users', label: '👥 用户管理' },
          { key: 'fees', label: '🧾 手续费配置' },
          { key: 'config', label: '⚙️ 系统配置' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm transition ${activeTab === tab.key ? 'bg-primary-600/20 text-primary-400' : 'text-gray-400 hover:text-white'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'fees' && (
        <div className="grid grid-cols-1 gap-4">
          <Card className="bg-[#141b2d] border-[#1e2a45] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Percent size={18} className="text-amber-500" />
                手续费管理中心
                <span className="text-xs text-gray-400">(所有者)</span>
              </h3>
              {!editingFee && (
                <Button size="sm" onClick={() => { setEditingFee(true); setFeeForm({ ...feeSettings }); }}>
                  <Edit size={14} /> 编辑
                </Button>
              )}
            </div>

            {editingFee && feeForm ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><label className="text-gray-400 text-xs">转账费率 %</label><input type="number" step="0.01" value={feeForm.transfer_rate} onChange={(e) => setFeeForm({ ...feeForm, transfer_rate: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded px-2 py-1 text-white text-sm" /></div>
                  <div><label className="text-gray-400 text-xs">回收费率 %</label><input type="number" step="0.01" value={feeForm.recycle_rate} onChange={(e) => setFeeForm({ ...feeForm, recycle_rate: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded px-2 py-1 text-white text-sm" /></div>
                  <div><label className="text-gray-400 text-xs">最低手续费</label><input type="number" step="0.01" value={feeForm.min_fee} onChange={(e) => setFeeForm({ ...feeForm, min_fee: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded px-2 py-1 text-white text-sm" /></div>
                  <div><label className="text-gray-400 text-xs">最高手续费</label><input type="number" step="0.01" value={feeForm.max_fee} onChange={(e) => setFeeForm({ ...feeForm, max_fee: parseFloat(e.target.value) || 0 })} className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded px-2 py-1 text-white text-sm" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-gray-400 text-xs">承担方</label><select value={feeForm.payer} onChange={(e) => setFeeForm({ ...feeForm, payer: e.target.value as any })} className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded px-2 py-1 text-white text-sm">
                    <option value="sender">发送方承担</option><option value="receiver">接收方承担</option><option value="shared">双方分摊</option><option value="platform">平台承担</option>
                  </select></div>
                  <div><label className="text-gray-400 text-xs">开关</label><select value={String(feeForm.enabled)} onChange={(e) => setFeeForm({ ...feeForm, enabled: e.target.value === 'true' })} className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded px-2 py-1 text-white text-sm">
                    <option value="true">启用</option><option value="false">关闭</option>
                  </select></div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={saveFeeSettings}><Save size={14} /> 保存</Button>
                  <Button size="sm" variant="secondary" onClick={() => { setEditingFee(false); setFeeForm(null); }}><X size={14} /> 取消</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="bg-[#0a0e1a] p-2 rounded-lg"><span className="text-gray-400">转账费率</span><span className="text-amber-500 float-right">{feeSettings.transfer_rate}%</span></div>
                  <div className="bg-[#0a0e1a] p-2 rounded-lg"><span className="text-gray-400">回收费率</span><span className="text-amber-500 float-right">{feeSettings.recycle_rate}%</span></div>
                  <div className="bg-[#0a0e1a] p-2 rounded-lg"><span className="text-gray-400">最低手续费</span><span className="text-white float-right">${feeSettings.min_fee}</span></div>
                  <div className="bg-[#0a0e1a] p-2 rounded-lg"><span className="text-gray-400">最高手续费</span><span className="text-white float-right">${feeSettings.max_fee}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#0a0e1a] p-2 rounded-lg"><span className="text-gray-400">承担方</span><span className="text-blue-400 float-right">{payerLabels[feeSettings.payer]}</span></div>
                  <div className="bg-[#0a0e1a] p-2 rounded-lg"><span className="text-gray-400">状态</span><span className={feeSettings.enabled ? 'text-green-500 float-right' : 'text-red-500 float-right'}>{feeSettings.enabled ? '✅ 已启用' : '❌ 已关闭'}</span></div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-[#141b2d] border-[#1e2a45]">
            <h3 className="text-white font-semibold mb-3">💰 充值设置</h3>
            <div>
              <label className="text-gray-400 text-sm">1 USDT = 多少积分</label>
              <div className="flex gap-2 mt-1">
                <input type="number" value={configs.exchange_rate} onChange={(e) => setConfigs({ ...configs, exchange_rate: parseFloat(e.target.value) || 0 })} className="flex-1 bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-1.5 text-white text-sm" />
                <Button size="sm" onClick={() => updateConfig('exchange_rate', configs.exchange_rate)}>保存</Button>
              </div>
            </div>
          </Card>

          <Card className="bg-[#141b2d] border-[#1e2a45]">
            <h3 className="text-white font-semibold mb-3">💸 转账限制</h3>
            <div className="space-y-2">
              <div><label className="text-gray-400 text-xs">最小转账</label><div className="flex gap-2 mt-1"><input type="number" value={configs.min_transfer_amount} onChange={(e) => setConfigs({ ...configs, min_transfer_amount: parseFloat(e.target.value) || 0 })} className="flex-1 bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-2 py-1 text-white text-xs" /><Button size="sm" onClick={() => updateConfig('min_transfer_amount', configs.min_transfer_amount)}>保存</Button></div></div>
              <div><label className="text-gray-400 text-xs">最大转账</label><div className="flex gap-2 mt-1"><input type="number" value={configs.max_transfer_amount} onChange={(e) => setConfigs({ ...configs, max_transfer_amount: parseFloat(e.target.value) || 0 })} className="flex-1 bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-2 py-1 text-white text-xs" /><Button size="sm" onClick={() => updateConfig('max_transfer_amount', configs.max_transfer_amount)}>保存</Button></div></div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <Card className="bg-[#141b2d] border-[#1e2a45] p-0 overflow-hidden">
          <div className="p-3 border-b border-[#1e2a45] flex items-center gap-3">
            <Search size={16} className="text-gray-500" />
            <input placeholder="搜索用户..." value={searchUser} onChange={(e) => setSearchUser(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setSearchResult(users.filter(u => u.username?.includes(searchUser) || u.email?.includes(searchUser)))} className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none" />
            <Button size="sm" variant="secondary" onClick={() => setSearchResult(users.filter(u => u.username?.includes(searchUser) || u.email?.includes(searchUser)))}>搜索</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0a0e1a]">
                <tr className="border-b border-[#1e2a45]">
                  <th className="text-left py-2 px-3 text-gray-400">用户</th>
                  <th className="text-left py-2 px-3 text-gray-400">角色</th>
                  <th className="text-left py-2 px-3 text-gray-400">余额</th>
                  <th className="text-left py-2 px-3 text-gray-400">积分</th>
                  <th className="text-left py-2 px-3 text-gray-400">状态</th>
                  <th className="text-left py-2 px-3 text-gray-400">操作</th>
                </tr>
              </thead>
              <tbody>
                {(searchResult.length > 0 ? searchResult : users).map((u) => (
                  <tr key={u.id} className="border-b border-[#1e2a45]/50 hover:bg-[#1a2340]">
                    <td className="py-2 px-3">
                      <p className="text-white text-sm">{u.username}</p>
                      <p className="text-gray-400 text-xs">{u.email}</p>
                    </td>
                    <td className="py-2 px-3 text-xs">{u.role}</td>
                    <td className="py-2 px-3 text-green-500">${u.balance || 0}</td>
                    <td className="py-2 px-3 text-amber-500">{u.points || 0}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                        {u.status === 'active' ? '正常' : '冻结'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <button onClick={() => toggleUserStatus(u.id, u.status)} className="p-1 rounded hover:bg-blue-500/10 text-gray-500 hover:text-blue-400">
                        {u.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-[#141b2d] border-[#1e2a45]">
            <h3 className="text-white font-semibold mb-2">📋 快速操作</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setActiveTab('users')} className="p-2 bg-[#0a0e1a] border border-[#1e2a45] rounded-lg text-white text-sm hover:border-blue-500/30">👥 管理用户</button>
              <button onClick={() => setActiveTab('fees')} className="p-2 bg-[#0a0e1a] border border-[#1e2a45] rounded-lg text-white text-sm hover:border-blue-500/30">🧾 手续费配置</button>
              <button onClick={() => setActiveTab('config')} className="p-2 bg-[#0a0e1a] border border-[#1e2a45] rounded-lg text-white text-sm hover:border-blue-500/30">⚙️ 系统配置</button>
            </div>
          </Card>
          <Card className="bg-[#141b2d] border-[#1e2a45]">
            <h3 className="text-white font-semibold mb-2">📈 当前配置</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">1 USDT =</span><span className="text-amber-500">{configs.exchange_rate} 积分</span></div>
              <div className="flex justify-between"><span className="text-gray-400">转账费率</span><span className="text-blue-500">{feeSettings.transfer_rate}%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">回收费率</span><span className="text-red-500">{feeSettings.recycle_rate}%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">承担方</span><span className="text-purple-400">{payerLabels[feeSettings.payer]}</span></div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
