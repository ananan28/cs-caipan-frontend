import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Plus, Edit, Trash2, Eye, EyeOff, RefreshCw, Search, Save, X } from 'lucide-react';

type Feature = {
  id: string;
  name: string;
  icon: string;
  path: string;
  description: string;
  category: string;
  price: number;
  is_active: boolean;
  sort_order: number;
};

export function FeatureManager() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: '📱', path: '', description: '', category: '通用', price: 0 });

  // 加载数据
  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setFeatures(data || []);
    } catch (error) {
      console.error('Fetch features error:', error);
      // 如果数据库没数据，用默认数据
      if (features.length === 0) {
        setFeatures([
          { id: '1', name: 'WhatsApp 检测', icon: '📱', path: '/detect/whatsapp', description: '检测号码是否注册WhatsApp', category: '即时通讯', price: 0.115, is_active: true, sort_order: 1 },
          { id: '2', name: 'WhatsApp 高级检测', icon: '💎', path: '/detect/whatsapp-advanced', description: '检测注册状态、头像、性别', category: '即时通讯', price: 6.429, is_active: true, sort_order: 2 },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeatures(); }, []);

  const handleSubmit = async () => {
    if (!formData.name) { alert('请输入功能名称'); return; }
    if (!formData.path) { alert('请输入路径'); return; }

    if (editingId) {
      await supabase
        .from('features')
        .update({ ...formData, updated_at: new Date().toISOString() })
        .eq('id', editingId);
      alert('✅ 功能已更新');
    } else {
      await supabase
        .from('features')
        .insert({ ...formData, is_active: true, sort_order: features.length + 1 });
      alert('✅ 功能已添加');
    }
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', icon: '📱', path: '', description: '', category: '通用', price: 0 });
    fetchFeatures();
  };

  const startEdit = (item: Feature) => {
    setFormData({ name: item.name, icon: item.icon, path: item.path, description: item.description, category: item.category, price: item.price });
    setEditingId(item.id);
    setShowForm(true);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('features').update({ is_active: !current }).eq('id', id);
    fetchFeatures();
  };

  const deleteItem = async (id: string) => {
    if (confirm('确定删除此功能吗？')) {
      await supabase.from('features').delete().eq('id', id);
      alert('✅ 已删除');
      fetchFeatures();
    }
  };

  const filtered = features.filter(f => f.name.includes(search) || f.description.includes(search));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">功能管理</h1>
          <p className="text-gray-400 text-sm">管理所有检测服务</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={fetchFeatures}><RefreshCw size={16} /></Button>
          <Button size="sm" onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ name: '', icon: '📱', path: '', description: '', category: '通用', price: 0 }); }}>
            <Plus size={16} /> 添加功能
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="bg-[#141b2d] border-[#1e2a45] p-4">
          <h3 className="text-white font-semibold mb-3">{editingId ? '✏️ 编辑功能' : '➕ 添加功能'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="名称" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm" />
            <input placeholder="图标(Emoji)" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm" />
            <input placeholder="路径 (如 /detect/whatsapp)" value={formData.path} onChange={(e) => setFormData({ ...formData, path: e.target.value })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm col-span-2" />
            <input placeholder="描述" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm col-span-2" />
            <input placeholder="分类" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm" />
            <input type="number" step="0.001" placeholder="价格" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm" />
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={handleSubmit}>{editingId ? '更新' : '保存'}</Button>
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>取消</Button>
          </div>
        </Card>
      )}

      <Card className="bg-[#141b2d] border-[#1e2a45] p-3">
        <div className="flex items-center gap-3">
          <Search className="text-gray-500" size={16} />
          <input placeholder="搜索功能..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none" />
          <span className="text-xs text-gray-400">{features.length} 个</span>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-8 text-gray-400">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-400">暂无功能</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((f) => (
            <div key={f.id} className="bg-[#141b2d] border border-[#1e2a45] rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{f.icon}</span>
                    <span className="text-white font-medium">{f.name}</span>
                  </div>
                  <p className="text-gray-400 text-xs">{f.description}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-gray-500">{f.category}</span>
                    <span className="text-amber-500 text-xs">{f.price} 积分/万次</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleActive(f.id, f.is_active)} className={`p-1 rounded ${f.is_active ? 'text-green-500 hover:text-green-400' : 'text-gray-500 hover:text-green-500'}`}>
                    {f.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => startEdit(f)} className="p-1 rounded text-blue-500 hover:text-blue-400"><Edit size={16} /></button>
                  <button onClick={() => deleteItem(f.id)} className="p-1 rounded text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
