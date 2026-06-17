import { useState } from 'react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Server, Plus, Edit, Trash2, Eye, EyeOff, RefreshCw, Save, X } from 'lucide-react';

type Provider = {
  id: string;
  name: string;
  platform: string;
  endpoint: string;
  apiKey: string;
  priority: number;
  costPerRequest: number;
  status: 'active' | 'inactive' | 'maintenance';
  successRate: number;
};

export function Providers() {
  const [providers, setProviders] = useState<Provider[]>([
    { id: '1', name: 'WhatsApp API', platform: 'whatsapp', endpoint: 'https://api.whatsapp.com/check', apiKey: 'sk-***', priority: 1, costPerRequest: 0.01, status: 'active', successRate: 98.5 },
    { id: '2', name: 'Telegram API', platform: 'telegram', endpoint: 'https://api.telegram.com/check', apiKey: 'sk-***', priority: 2, costPerRequest: 0.015, status: 'active', successRate: 97.2 },
    { id: '3', name: 'Signal API', platform: 'signal', endpoint: 'https://api.signal.com/check', apiKey: 'sk-***', priority: 3, costPerRequest: 0.02, status: 'inactive', successRate: 0 },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', platform: 'whatsapp', endpoint: '', apiKey: '', priority: 1, costPerRequest: 0.01, status: 'active' as any });

  const handleSubmit = () => {
    if (!formData.name || !formData.endpoint) { alert('请填写名称和Endpoint'); return; }
    if (editingId) {
      setProviders(providers.map(p => p.id === editingId ? { ...p, ...formData } : p));
      alert('✅ 接口已更新');
    } else {
      const newProvider: Provider = {
        id: Date.now().toString(),
        ...formData,
        successRate: 0,
      };
      setProviders([newProvider, ...providers]);
      alert('✅ 接口已添加');
    }
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', platform: 'whatsapp', endpoint: '', apiKey: '', priority: 1, costPerRequest: 0.01, status: 'active' });
  };

  const startEdit = (item: Provider) => {
    setFormData({ name: item.name, platform: item.platform, endpoint: item.endpoint, apiKey: item.apiKey, priority: item.priority, costPerRequest: item.costPerRequest, status: item.status });
    setEditingId(item.id);
    setShowForm(true);
  };

  const toggleStatus = (id: string) => {
    setProviders(providers.map(p => p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p));
  };

  const deleteItem = (id: string) => {
    if (confirm('确定要删除此接口吗？')) {
      setProviders(providers.filter(p => p.id !== id));
      alert('✅ 已删除');
    }
  };

  const statusLabels = { active: '启用', inactive: '停用', maintenance: '维护中' };
  const statusColors = { active: 'bg-green-500/20 text-green-500', inactive: 'bg-red-500/20 text-red-500', maintenance: 'bg-yellow-500/20 text-yellow-400' };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Server className="text-primary-500" size={28} />
            接口中心
          </h1>
          <p className="text-gray-400 text-sm">管理API供应商</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => {}}><RefreshCw size={16} /></Button>
          <Button size="sm" onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ name: '', platform: 'whatsapp', endpoint: '', apiKey: '', priority: 1, costPerRequest: 0.01, status: 'active' }); }}>
            <Plus size={16} /> 添加接口
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="bg-[#141b2d] border-[#1e2a45] p-4">
          <h3 className="text-white font-semibold mb-3">{editingId ? '✏️ 编辑接口' : '➕ 添加接口'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="名称" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm" />
            <select value={formData.platform} onChange={(e) => setFormData({ ...formData, platform: e.target.value })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm">
              <option>whatsapp</option><option>telegram</option><option>signal</option><option>line</option><option>universal</option>
            </select>
            <input placeholder="Endpoint URL" value={formData.endpoint} onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm col-span-2" />
            <input placeholder="API Key" value={formData.apiKey} onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm" />
            <input type="number" placeholder="优先级" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm" />
            <input type="number" step="0.001" placeholder="单次成本" value={formData.costPerRequest} onChange={(e) => setFormData({ ...formData, costPerRequest: parseFloat(e.target.value) || 0 })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm" />
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm">
              <option value="active">启用</option><option value="inactive">停用</option><option value="maintenance">维护中</option>
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={handleSubmit}>{editingId ? '更新' : '保存'}</Button>
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>取消</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {providers.map((p) => (
          <div key={p.id} className="bg-[#141b2d] border border-[#1e2a45] rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-semibold">{p.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[p.status]}`}>
                    {statusLabels[p.status]}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{p.platform}</p>
                <p className="text-gray-500 text-xs mt-1 font-mono">{p.endpoint}</p>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-gray-400">优先级: <span className="text-white">{p.priority}</span></span>
                  <span className="text-gray-400">成本: <span className="text-amber-500">{p.costPerRequest}</span></span>
                  <span className="text-gray-400">成功率: <span className="text-green-500">{p.successRate}%</span></span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => toggleStatus(p.id)} className={`p-1 rounded hover:bg-blue-500/10 ${p.status === 'active' ? 'text-green-500' : 'text-gray-500'}`}>
                  {p.status === 'active' ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button onClick={() => startEdit(p)} className="p-1 rounded hover:bg-blue-500/10 text-gray-500 hover:text-blue-400"><Edit size={16} /></button>
                <button onClick={() => deleteItem(p.id)} className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
