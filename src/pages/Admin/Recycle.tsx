import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Trash2, RefreshCw, RotateCcw, Search, X, Eye } from 'lucide-react';

type DeletedItem = {
  id: string;
  name: string;
  type: 'user' | 'api' | 'feature' | 'package' | 'order';
  deletedBy: string;
  deletedAt: string;
  originalData: any;
  table_name: string;
  record_id: string;
};

export function Recycle() {
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDeletedItems();
  }, []);

  const fetchDeletedItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recycle_bin')
        .select('*')
        .order('deleted_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Fetch deleted items error:', error);
    } finally {
      setLoading(false);
    }
  };

  const restoreItem = async (id: string) => {
    if (!confirm('确定要恢复此项目吗？')) return;
    setLoading(true);
    try {
      await supabase.from('recycle_bin').update({ restore_status: 'restored', restored_at: new Date().toISOString() }).eq('id', id);
      alert('✅ 已恢复');
      fetchDeletedItems();
    } catch (error) {
      alert('恢复失败');
    } finally {
      setLoading(false);
    }
  };

  const permanentDelete = async (id: string) => {
    if (!confirm('⚠️ 确定要永久删除吗？此操作不可恢复！')) return;
    setLoading(true);
    try {
      await supabase.from('recycle_bin').delete().eq('id', id);
      alert('✅ 已永久删除');
      fetchDeletedItems();
    } catch (error) {
      alert('删除失败');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = async () => {
    if (!confirm('⚠️ 确定要清空回收站吗？所有项目将被永久删除！')) return;
    setLoading(true);
    try {
      await supabase.from('recycle_bin').delete().neq('id', '');
      alert('✅ 已清空回收站');
      fetchDeletedItems();
    } catch (error) {
      alert('清空失败');
    } finally {
      setLoading(false);
    }
  };

  const typeLabels: Record<string, string> = {
    user: '用户',
    api: '接口',
    feature: '功能',
    package: '套餐',
    order: '订单',
  };

  const typeColors: Record<string, string> = {
    user: 'bg-purple-500/20 text-purple-400',
    api: 'bg-blue-500/20 text-blue-400',
    feature: 'bg-amber-500/20 text-amber-400',
    package: 'bg-red-500/20 text-red-400',
    order: 'bg-green-500/20 text-green-400',
  };

  const filtered = items.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trash2 className="text-red-500" size={28} />
            软删除中心
          </h1>
          <p className="text-gray-400 text-sm">回收站 - 恢复或永久删除</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={fetchDeletedItems}><RefreshCw size={16} /></Button>
          <Button variant="danger" size="sm" onClick={clearAll}><Trash2 size={16} /> 清空</Button>
        </div>
      </div>

      <Card className="bg-[#141b2d] border-[#1e2a45] p-3">
        <div className="flex items-center gap-3">
          <Search className="text-gray-500" size={16} />
          <input placeholder="搜索..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none" />
          <span className="text-xs text-gray-400">{items.length} 个项目</span>
        </div>
      </Card>

      {loading && <div className="text-center py-4 text-gray-400">处理中...</div>}

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Trash2 className="mx-auto text-gray-600" size={48} />
          <p className="mt-2">回收站为空</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div key={item.id} className="bg-[#141b2d] border border-[#1e2a45] rounded-xl p-3 flex items-center justify-between hover:border-red-500/30 transition">
              <div className="flex items-center gap-4 flex-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[item.type] || 'bg-gray-500/20 text-gray-400'}`}>
                  {typeLabels[item.type] || item.type}
                </span>
                <span className="text-white font-medium">{item.name || '未命名'}</span>
                <span className="text-gray-500 text-xs">删除人: {item.deleted_by || '-'}</span>
                <span className="text-gray-500 text-xs">{new Date(item.deleted_at).toLocaleString()}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => restoreItem(item.id)} className="p-1.5 rounded hover:bg-green-500/10 text-green-500 hover:text-green-400 transition" title="恢复">
                  <RotateCcw size={16} />
                </button>
                <button onClick={() => permanentDelete(item.id)} className="p-1.5 rounded hover:bg-red-500/10 text-red-500 hover:text-red-400 transition" title="永久删除">
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
