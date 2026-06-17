import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Gift, Plus, Edit, Trash2, Eye, EyeOff, Save, X, RefreshCw } from 'lucide-react';

type PackageItem = {
  id: string;
  name: string;
  price: number;
  points: number;
  bonus: number;
  is_active: boolean;
  description: string;
  sort_order: number;
};

export function Packages() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    points: 0,
    bonus: 0,
    description: '',
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Fetch packages error:', error);
      // 模拟数据
      setPackages([
        { id: '1', name: '基础包', price: 10, points: 100, bonus: 0, is_active: true, description: '100积分', sort_order: 1 },
        { id: '2', name: '进阶包', price: 50, points: 550, bonus: 50, is_active: true, description: '550积分 + 50赠送', sort_order: 2 },
        { id: '3', name: '高级包', price: 100, points: 1200, bonus: 200, is_active: true, description: '1200积分 + 200赠送', sort_order: 3 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.points) {
      alert('请填写名称、价格和积分数量');
      return;
    }

    try {
      if (editingId) {
        await supabase
          .from('packages')
          .update({
            name: formData.name,
            price: formData.price,
            points: formData.points,
            bonus: formData.bonus || 0,
            description: formData.description,
            is_active: formData.is_active,
          })
          .eq('id', editingId);
        alert('✅ 套餐已更新');
      } else {
        await supabase
          .from('packages')
          .insert({
            name: formData.name,
            price: formData.price,
            points: formData.points,
            bonus: formData.bonus || 0,
            description: formData.description,
            is_active: true,
            sort_order: packages.length + 1,
          });
        alert('✅ 套餐已添加');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', price: 0, points: 0, bonus: 0, description: '', is_active: true, sort_order: 0 });
      fetchPackages();
    } catch (error: any) {
      alert('操作失败：' + error.message);
    }
  };

  const startEdit = (item: PackageItem) => {
    setFormData({
      name: item.name,
      price: item.price,
      points: item.points,
      bonus: item.bonus || 0,
      description: item.description || '',
      is_active: item.is_active,
      sort_order: item.sort_order || 0,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await supabase.from('packages').update({ is_active: !current }).eq('id', id);
      fetchPackages();
    } catch (error) {
      alert('操作失败');
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('确定要删除此套餐吗？')) return;
    try {
      await supabase.from('packages').delete().eq('id', id);
      alert('✅ 已删除');
      fetchPackages();
    } catch (error) {
      alert('删除失败');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Gift className="text-primary-500" size={28} />
            套餐中心
          </h1>
          <p className="text-gray-400 text-sm">积分套餐管理</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={fetchPackages}>
            <RefreshCw size={16} />
          </Button>
          <Button size="sm" onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ name: '', price: 0, points: 0, bonus: 0, description: '', is_active: true, sort_order: 0 }); }}>
            <Plus size={16} /> 添加套餐
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="bg-[#141b2d] border-[#1e2a45] p-4">
          <h3 className="text-white font-semibold mb-3">{editingId ? '✏️ 编辑套餐' : '➕ 添加套餐'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              placeholder="名称"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm"
            />
            <input
              type="number"
              placeholder="价格(USD)"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm"
            />
            <input
              type="number"
              placeholder="积分数量"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseFloat(e.target.value) || 0 })}
              className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm"
            />
            <input
              type="number"
              placeholder="赠送积分"
              value={formData.bonus}
              onChange={(e) => setFormData({ ...formData, bonus: parseFloat(e.target.value) || 0 })}
              className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm"
            />
            <input
              placeholder="描述"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm col-span-2"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={handleSubmit}>{editingId ? '更新' : '保存'}</Button>
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>取消</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400">加载中...</div>
      ) : packages.length === 0 ? (
        <div className="text-center py-8 text-gray-400">暂无套餐</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {packages.map((p) => (
            <div key={p.id} className={`bg-[#141b2d] border rounded-xl p-4 ${p.is_active ? 'border-[#1e2a45]' : 'border-[#1e2a45] opacity-50'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-semibold">{p.name}</h3>
                  <p className="text-amber-500 text-xl font-bold">${p.price}</p>
                  <p className="text-gray-400 text-sm">{p.points} 积分</p>
                  {p.bonus > 0 && <p className="text-green-500 text-xs">+{p.bonus} 赠送</p>}
                  <p className="text-gray-500 text-xs mt-1">{p.description}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleActive(p.id, p.is_active)} className={`p-1 rounded hover:bg-blue-500/10 ${p.is_active ? 'text-green-500' : 'text-gray-500'}`}>
                    {p.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => startEdit(p)} className="p-1 rounded hover:bg-blue-500/10 text-gray-500 hover:text-blue-400"><Edit size={14} /></button>
                  <button onClick={() => deleteItem(p.id)} className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'}`}>
                {p.is_active ? '已上架' : '已下架'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
