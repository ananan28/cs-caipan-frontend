import { useState } from 'react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Wallet, Plus, Edit, Trash2, Copy, RefreshCw, Check, X } from 'lucide-react';

type Address = {
  id: string;
  address: string;
  chain: 'TRC20' | 'ERC20' | 'BEP20';
  status: 'active' | 'inactive' | 'risk';
  totalReceived: number;
  createdAt: string;
};

export function AddressPool() {
  const [addresses, setAddresses] = useState<Address[]>([
    { id: '1', address: '0x1234abcd5678efgh', chain: 'TRC20', status: 'active', totalReceived: 1250, createdAt: new Date().toISOString() },
    { id: '2', address: '0x8765efgh4321ijkl', chain: 'ERC20', status: 'active', totalReceived: 3200, createdAt: new Date().toISOString() },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ address: '', chain: 'TRC20' as any, status: 'active' as any });

  const handleSubmit = () => {
    if (!formData.address) { alert('请输入钱包地址'); return; }
    if (editingId) {
      setAddresses(addresses.map(a => a.id === editingId ? { ...a, ...formData } : a));
      alert('✅ 地址已更新');
    } else {
      const newAddress: Address = { id: Date.now().toString(), ...formData, totalReceived: 0, createdAt: new Date().toISOString() };
      setAddresses([newAddress, ...addresses]);
      alert('✅ 地址已添加');
    }
    setShowForm(false);
    setEditingId(null);
    setFormData({ address: '', chain: 'TRC20', status: 'active' });
  };

  const startEdit = (id: string) => {
    const item = addresses.find(a => a.id === id);
    if (item) {
      setFormData({ address: item.address, chain: item.chain, status: item.status });
      setEditingId(id);
      setShowForm(true);
    }
  };

  const deleteItem = (id: string) => {
    if (confirm('确定要删除此地址吗？')) {
      setAddresses(addresses.filter(a => a.id !== id));
      alert('✅ 已删除');
    }
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    alert('✅ 地址已复制');
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="text-primary-500" size={28} />
            地址池管理
          </h1>
          <p className="text-gray-400 text-sm">管理USDT充值地址</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ address: '', chain: 'TRC20', status: 'active' }); }}>
          <Plus size={16} /> 添加地址
        </Button>
      </div>

      {showForm && (
        <Card className="bg-[#141b2d] border-[#1e2a45] p-4">
          <h3 className="text-white font-semibold mb-3">{editingId ? '✏️ 编辑地址' : '➕ 添加地址'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="钱包地址"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm col-span-2"
            />
            <select
              value={formData.chain}
              onChange={(e) => setFormData({ ...formData, chain: e.target.value as any })}
              className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm"
            >
              <option>TRC20</option><option>ERC20</option><option>BEP20</option>
            </select>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm"
            >
              <option value="active">启用</option><option value="inactive">停用</option><option value="risk">风险</option>
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={handleSubmit}>{editingId ? '更新' : '保存'}</Button>
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>取消</Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {addresses.map((addr) => (
          <div key={addr.id} className="bg-[#141b2d] border border-[#1e2a45] rounded-xl p-4 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <code className="text-white text-sm font-mono">{addr.address}</code>
                <button onClick={() => copyAddress(addr.address)} className="p-1 rounded hover:bg-blue-500/10 text-gray-500 hover:text-blue-400"><Copy size={14} /></button>
              </div>
              <div className="flex gap-4 mt-1 text-xs">
                <span className={`px-2 py-0.5 rounded-full ${addr.status === 'active' ? 'bg-green-500/20 text-green-500' : addr.status === 'risk' ? 'bg-red-500/20 text-red-500' : 'bg-gray-500/20 text-gray-400'}`}>
                  {addr.status}
                </span>
                <span className="text-gray-400">链: {addr.chain}</span>
                <span className="text-gray-400">累计: <span className="text-amber-500">{addr.totalReceived} USDT</span></span>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => startEdit(addr.id)} className="p-1 rounded hover:bg-blue-500/10 text-gray-500 hover:text-blue-400"><Edit size={14} /></button>
              <button onClick={() => deleteItem(addr.id)} className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
