import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { 
  Shield, Users, Wallet, FileText, Settings, 
  RefreshCw, Send, Search, UserX, UserCheck,
  TrendingUp, TrendingDown, Crown, Edit, Save, X
} from 'lucide-react';

type SystemConfig = {
  exchange_rate: number;
  transfer_fee_percent: number;
  min_transfer_amount: number;
  max_transfer_amount: number;
};

type Feature = {
  id: string;
  name: string;
  icon: string;
  description: string;
  price: number;
  is_active: boolean;
  category: string;
};

type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  balance: number;
};

export function SuperDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [configs, setConfigs] = useState<SystemConfig>({
    exchange_rate: 10,
    transfer_fee_percent: 5,
    min_transfer_amount: 10,
    max_transfer_amount: 10000,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'config' | 'transfer' | 'prices'>('overview');
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<number>(0);
  
  // 转账表单
  const [transferForm, setTransferForm] = useState({
    fromUser: '',
    toUser: '',
    amount: 0,
    note: '',
  });
  const [searchUser, setSearchUser] = useState('');
  const [searchResult, setSearchResult] = useState<User[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 获取用户列表
      const { data: userData } = await supabase
        .from('user_list')
        .select('*')
        .order('created_at', { ascending: false });
      setUsers(userData || []);

      // 获取功能列表（含价格）
      const { data: featureData } = await supabase
        .from('features')
        .select('*')
        .order('sort_order', { ascending: true });
      setFeatures(featureData || []);

      // 获取系统配置
      const { data: configData } = await supabase
        .from('system_configs')
        .select('key, value');
      if (configData) {
        const config: any = {};
        configData.forEach((c: any) => {
          config[c.key] = parseFloat(c.value) || 0;
        });
        setConfigs({
          exchange_rate: config.exchange_rate || 10,
          transfer_fee_percent: config.transfer_fee_percent || 5,
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

  // 更新功能价格
  const updateFeaturePrice = async (id: string, price: number) => {
    try {
      await supabase
        .from('features')
        .update({ price: price })
        .eq('id', id);
      setFeatures(features.map(f => f.id === id ? { ...f, price } : f));
      alert('✅ 价格已更新');
      setEditingPrice(null);
    } catch (error) {
      alert('更新失败');
    }
  };

  // 搜索用户
  const searchUsers = async () => {
    if (!searchUser) { setSearchResult([]); return; }
    const { data } = await supabase
      .from('profiles')
      .select('id, username, email')
      .or(`username.ilike.%${searchUser}%,email.ilike.%${searchUser}%`)
      .limit(10);
    setSearchResult(data || []);
  };

  // 执行转账
  const handleTransfer = async () => {
    if (!transferForm.fromUser || !transferForm.toUser) {
      alert('请选择转出和转入用户');
      return;
    }
    if (transferForm.amount < configs.min_transfer_amount) {
      alert(`最低转账 ${configs.min_transfer_amount} 积分`);
      return;
    }
    if (transferForm.amount > configs.max_transfer_amount) {
      alert(`最高转账 ${configs.max_transfer_amount} 积分`);
      return;
    }

    const fee = transferForm.amount * (configs.transfer_fee_percent / 100);
    const netAmount = transferForm.amount - fee;

    if (!confirm(`确认转账？\n\n转出: ${transferForm.amount} 积分\n手续费: ${fee.toFixed(2)} 积分\n到账: ${netAmount.toFixed(2)} 积分`)) return;

    try {
      const { data: fromAccount } = await supabase
        .from('points_accounts')
        .select('id, balance')
        .eq('user_id', transferForm.fromUser)
        .single();
      
      if (!fromAccount || fromAccount.balance < transferForm.amount) {
        alert('余额不足');
        return;
      }

      await supabase
        .from('points_accounts')
        .update({ balance: fromAccount.balance - transferForm.amount })
        .eq('user_id', transferForm.fromUser);

      const { data: toAccount } = await supabase
        .from('points_accounts')
        .select('id, balance')
        .eq('user_id', transferForm.toUser)
        .single();

      await supabase
        .from('points_accounts')
        .update({ balance: toAccount.balance + netAmount })
        .eq('user_id', transferForm.toUser);

      await supabase.from('points_ledger').insert([
        {
          user_id: transferForm.fromUser,
          account_id: fromAccount.id,
          amount: -transferForm.amount,
          balance_after: fromAccount.balance - transferForm.amount,
          type: 'transfer_out',
          description: `转账给 ${transferForm.toUser}，手续费 ${fee.toFixed(2)}`,
        },
        {
          user_id: transferForm.toUser,
          account_id: toAccount.id,
          amount: netAmount,
          balance_after: toAccount.balance + netAmount,
          type: 'transfer_in',
          description: `收到转账 ${netAmount.toFixed(2)} 积分`,
        }
      ]);

      alert('✅ 转账成功！');
      setTransferForm({ fromUser: '', toUser: '', amount: 0, note: '' });
      fetchAllData();
    } catch (error: any) {
      alert('转账失败：' + error.message);
    }
  };

  // 更新系统配置
  const updateConfig = async (key: string, value: number) => {
    await supabase
      .from('system_configs')
      .update({ value: String(value) })
      .eq('key', key);
    alert('✅ 配置已更新');
    fetchAllData();
  };

  // 更新用户状态
  const toggleUserStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'frozen' : 'active';
    if (!confirm(`确定${newStatus === 'active' ? '激活' : '冻结'}此用户吗？`)) return;
    await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
    alert(`✅ 用户已${newStatus === 'active' ? '激活' : '冻结'}`);
    fetchAllData();
  };

  const totalPoints = users.reduce((sum, u) => sum + (u.balance || 0), 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-amber-500" size={28} />
            超级管理台
          </h1>
          <p className="text-gray-400 text-sm">全网积分管理 · 价格调整 · 转账系统</p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchAllData}>
          <RefreshCw size={16} /> 刷新
        </Button>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-[#141b2d] border-[#1e2a45] p-3">
          <p className="text-xs text-gray-400">总用户</p>
          <p className="text-xl font-bold text-white">{users.length}</p>
        </Card>
        <Card className="bg-[#141b2d] border-[#1e2a45] p-3">
          <p className="text-xs text-gray-400">全网总积分</p>
          <p className="text-xl font-bold text-amber-500">{totalPoints.toFixed(0)}</p>
        </Card>
        <Card className="bg-[#141b2d] border-[#1e2a45] p-3">
          <p className="text-xs text-gray-400">检测功能</p>
          <p className="text-xl font-bold text-blue-500">{features.filter(f => f.is_active).length}</p>
        </Card>
        <Card className="bg-[#141b2d] border-[#1e2a45] p-3">
          <p className="text-xs text-gray-400">转账手续费</p>
          <p className="text-xl font-bold text-blue-500">{configs.transfer_fee_percent}%</p>
        </Card>
      </div>

      {/* 标签栏 */}
      <div className="flex gap-2 border-b border-[#1e2a45] pb-2 flex-wrap">
        {[
          { key: 'overview', label: '📊 总览' },
          { key: 'users', label: '👥 用户管理' },
          { key: 'prices', label: '💰 功能价格' },
          { key: 'config', label: '⚙️ 系统配置' },
          { key: 'transfer', label: '💸 积分转账' },
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

      {/* ====== 总览 ====== */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-[#141b2d] border-[#1e2a45]">
            <h3 className="text-white font-semibold mb-2">📋 快速操作</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setActiveTab('users')} className="p-2 bg-[#0a0e1a] border border-[#1e2a45] rounded-lg text-white text-sm hover:border-blue-500/30">👥 管理用户</button>
              <button onClick={() => setActiveTab('prices')} className="p-2 bg-[#0a0e1a] border border-[#1e2a45] rounded-lg text-white text-sm hover:border-blue-500/30">💰 功能价格</button>
              <button onClick={() => setActiveTab('config')} className="p-2 bg-[#0a0e1a] border border-[#1e2a45] rounded-lg text-white text-sm hover:border-blue-500/30">⚙️ 系统配置</button>
              <button onClick={() => setActiveTab('transfer')} className="p-2 bg-[#0a0e1a] border border-[#1e2a45] rounded-lg text-white text-sm hover:border-blue-500/30">💸 积分转账</button>
            </div>
          </Card>
          <Card className="bg-[#141b2d] border-[#1e2a45]">
            <h3 className="text-white font-semibold mb-2">📈 当前配置</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">1 USDT =</span><span className="text-amber-500">{configs.exchange_rate} 积分</span></div>
              <div className="flex justify-between"><span className="text-gray-400">转账手续费</span><span className="text-blue-500">{configs.transfer_fee_percent}%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">最小转账</span><span className="text-white">{configs.min_transfer_amount} 积分</span></div>
              <div className="flex justify-between"><span className="text-gray-400">最大转账</span><span className="text-white">{configs.max_transfer_amount} 积分</span></div>
            </div>
          </Card>
        </div>
      )}

      {/* ====== 用户管理 ====== */}
      {activeTab === 'users' && (
        <Card className="bg-[#141b2d] border-[#1e2a45] p-0 overflow-hidden">
          <div className="p-3 border-b border-[#1e2a45] flex items-center gap-3">
            <Search size={16} className="text-gray-500" />
            <input
              placeholder="搜索用户..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none"
            />
            <Button size="sm" variant="secondary" onClick={searchUsers}>搜索</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0a0e1a]">
                <tr className="border-b border-[#1e2a45]">
                  <th className="text-left py-2 px-3 text-gray-400">用户</th>
                  <th className="text-left py-2 px-3 text-gray-400">角色</th>
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
                    <td className="py-2 px-3 text-amber-500">{u.balance || 0}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                        {u.status === 'active' ? '正常' : '冻结'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-1">
                        <button onClick={() => toggleUserStatus(u.id, u.status)} className="p-1 rounded hover:bg-blue-500/10 text-gray-500 hover:text-blue-400">
                          {u.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ====== 功能价格管理 ====== */}
      {activeTab === 'prices' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f) => (
            <Card key={f.id} className="bg-[#141b2d] border-[#1e2a45] p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{f.icon}</span>
                    <span className="text-white font-semibold">{f.name}</span>
                  </div>
                  <p className="text-gray-400 text-xs">{f.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{f.category}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${f.is_active ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'}`}>
                  {f.is_active ? '已上架' : '已下架'}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1e2a45]">
                {editingPrice === f.id ? (
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="number"
                      step="0.001"
                      value={editPriceValue}
                      onChange={(e) => setEditPriceValue(parseFloat(e.target.value) || 0)}
                      className="flex-1 bg-[#0a0e1a] border border-[#1e2a45] rounded px-2 py-1 text-white text-sm"
                    />
                    <button onClick={() => updateFeaturePrice(f.id, editPriceValue)} className="p-1 rounded bg-green-600 hover:bg-green-700 text-white">
                      <Save size={14} />
                    </button>
                    <button onClick={() => setEditingPrice(null)} className="p-1 rounded bg-red-600/20 hover:bg-red-600/30 text-red-400">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-amber-500 font-medium">{f.price} 积分/万次</span>
                    <button
                      onClick={() => {
                        setEditingPrice(f.id);
                        setEditPriceValue(f.price);
                      }}
                      className="p-1 rounded hover:bg-blue-500/10 text-gray-500 hover:text-blue-400"
                    >
                      <Edit size={14} /> 调整
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ====== 系统配置 ====== */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-[#141b2d] border-[#1e2a45]">
            <h3 className="text-white font-semibold mb-3">💰 充值设置</h3>
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-sm">1 USDT = 多少积分</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    value={configs.exchange_rate}
                    onChange={(e) => setConfigs({ ...configs, exchange_rate: parseFloat(e.target.value) || 0 })}
                    className="flex-1 bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-1.5 text-white text-sm"
                  />
                  <Button size="sm" onClick={() => updateConfig('exchange_rate', configs.exchange_rate)}>保存</Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-[#141b2d] border-[#1e2a45]">
            <h3 className="text-white font-semibold mb-3">💸 转账设置</h3>
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-sm">手续费 (%)</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    value={configs.transfer_fee_percent}
                    onChange={(e) => setConfigs({ ...configs, transfer_fee_percent: parseFloat(e.target.value) || 0 })}
                    className="flex-1 bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-1.5 text-white text-sm"
                  />
                  <Button size="sm" onClick={() => updateConfig('transfer_fee_percent', configs.transfer_fee_percent)}>保存</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-400 text-xs">最小转账</label>
                  <div className="flex gap-2 mt-1">
                    <input type="number" value={configs.min_transfer_amount} onChange={(e) => setConfigs({ ...configs, min_transfer_amount: parseFloat(e.target.value) || 0 })} className="flex-1 bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-2 py-1 text-white text-xs" />
                    <Button size="sm" onClick={() => updateConfig('min_transfer_amount', configs.min_transfer_amount)}>保存</Button>
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-xs">最大转账</label>
                  <div className="flex gap-2 mt-1">
                    <input type="number" value={configs.max_transfer_amount} onChange={(e) => setConfigs({ ...configs, max_transfer_amount: parseFloat(e.target.value) || 0 })} className="flex-1 bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-2 py-1 text-white text-xs" />
                    <Button size="sm" onClick={() => updateConfig('max_transfer_amount', configs.max_transfer_amount)}>保存</Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ====== 积分转账 ====== */}
      {activeTab === 'transfer' && (
        <Card className="bg-[#141b2d] border-[#1e2a45] p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Send size={18} className="text-blue-500" />
            积分转账
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm">转出用户</label>
              <select
                value={transferForm.fromUser}
                onChange={(e) => setTransferForm({ ...transferForm, fromUser: e.target.value })}
                className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-2 text-white text-sm mt-1"
              >
                <option value="">选择用户</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.username} ({u.email}) - {u.balance || 0}积分</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm">转入用户</label>
              <select
                value={transferForm.toUser}
                onChange={(e) => setTransferForm({ ...transferForm, toUser: e.target.value })}
                className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-2 text-white text-sm mt-1"
              >
                <option value="">选择用户</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm">转账金额 (积分)</label>
              <input
                type="number"
                value={transferForm.amount}
                onChange={(e) => setTransferForm({ ...transferForm, amount: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-2 text-white text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">备注 (可选)</label>
              <input
                value={transferForm.note}
                onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
                className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-2 text-white text-sm mt-1"
              />
            </div>
          </div>
          {transferForm.amount > 0 && (
            <div className="mt-3 p-3 bg-[#0a0e1a] rounded-lg border border-[#1e2a45] text-sm">
              <div className="flex justify-between"><span className="text-gray-400">转账金额</span><span className="text-white">{transferForm.amount} 积分</span></div>
              <div className="flex justify-between"><span className="text-gray-400">手续费 ({configs.transfer_fee_percent}%)</span><span className="text-yellow-500">{(transferForm.amount * configs.transfer_fee_percent / 100).toFixed(2)} 积分</span></div>
              <div className="flex justify-between border-t border-[#1e2a45] pt-1 mt-1"><span className="text-gray-400">到账金额</span><span className="text-green-500">{(transferForm.amount - transferForm.amount * configs.transfer_fee_percent / 100).toFixed(2)} 积分</span></div>
            </div>
          )}
          <Button className="mt-3 w-full" onClick={handleTransfer}>
            <Send size={16} /> 执行转账
          </Button>
        </Card>
      )}
    </div>
  );
}
