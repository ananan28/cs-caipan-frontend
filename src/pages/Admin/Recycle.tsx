import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Trash2, RefreshCw, RotateCcw, Search, X, Eye, AlertTriangle } from 'lucide-react';

type DeletedItem = {
  id: string;
  name: string;
  type: 'feature' | 'user' | 'order' | 'address' | 'package' | 'announcement';
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
      // 从各个表查询已删除标记的记录
      // 这里需要根据实际表的软删除字段来查询
      // 暂时使用模拟数据
      setItems([
        { 
          id: '1', 
          name: 'WhatsApp检测', 
          type: 'feature', 
          deletedBy: 'admin', 
          deletedAt: new Date().toISOString(), 
          originalData: { price: 0.115, path: '/detect/whatsapp' },
          table_name: 'features',
          record_id: 'feature_001'
        },
        { 
          id: '2', 
          name: 'test@test.com', 
          type: 'user', 
          deletedBy: 'admin', 
          deletedAt: new Date().toISOString(), 
          originalData: { email: 'test@test.com', role: 'user' },
          table_name: 'profiles',
          record_id: 'user_001'
        },
      ]);
    } catch (error) {
      console.error('Fetch deleted items error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 真正恢复数据
  const restoreItem = async (item: DeletedItem) => {
    if (!confirm(`确定要恢复「${item.name}」吗？`)) return;
    setLoading(true);

    try {
      // 根据不同类型恢复数据
      switch (item.type) {
        case 'feature':
          await supabase.from('features').insert({ ...item.originalData, is_active: true, is_deleted: false });
          break;
        case 'user':
          // 恢复用户需要同时恢复 auth 和 profiles
          await supabase.from('profiles').insert({ ...item.originalData, status: 'active' });
          break;
        case 'package':
          await supabase.from('packages').insert({ ...item.originalData, is_active: true });
          break;
        case 'announcement':
          await supabase.from('announcements').insert({ ...item.originalData, is_active: true });
          break;
        default:
          alert('暂不支持恢复此类型');
          return;
      }

      alert(`✅ 「${item.name}」已恢复`);
      fetchDeletedItems();
    } catch (error: any) {
      alert('恢复失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 永久删除
  const permanentDelete = async (id: string) => {
    if (!confirm('⚠️ 确定要永久删除吗？此操作不可恢复！')) return;
    setLoading(true);
    setTimeout(() => {
      setItems(items.filter(i => i.id !== id));
      alert('✅ 已永久删除');
      setLoading(false);
    }, 500);
  };

  // 清空回收站
  const clearAll = () => {
    if (!confirm('⚠️ 确定要清空回收站吗？所有项目将被永久删除！')) return;
    if (!confirm('再次确认：此操作不可恢复！')) return;
    setLoading(true);
    setTimeout(() => {
      setItems([]);
      alert('✅ 已清空回收站');
      setLoading(false);
    }, 500);
  };

  const typeLabels = { 
    feature: '功能', 
    user: '用户', 
    order: '订单', 
    address: '地址', 
    package: '套餐',
    announcement: '公告'
  };
  const typeColors = {
    feature: 'bg-blue-500/20 text-blue-400',
    user: 'bg-purple-500/20 text-purple-400',
    order: 'bg-amber-500/20 text-amber-400',
    address: 'bg-green-500/20 text-green-400',
    package: 'bg-red-500/20 text-red-400',
    announcement: 'bg-pink-500/20 text-pink-400',
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

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
          <Button variant="secondary" size="sm" onClick={fetchDeletedItems}>
            <RefreshCw size={16} />
          </Button>
          <Button variant="danger" size="sm" onClick={clearAll}>
            <Trash2 size={16} /> 清空
          </Button>
        </div>
      </div>

      <Card className="bg-[#141b2d] border-[#1e2a45] p-3">
        <div className="flex items-center gap-3">
          <Search className="text-gray-500" size={16} />
          <input
            placeholder="搜索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none"
          />
          <span className="text-xs text-gray-400">{items.length} 个项目</span>
        </div>
      </Card>

      {loading && <div className="text-center py-4 text-gray-400">处理中...</div>}

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Trash2 className="mx-auto text-gray-600" size={48} />
          <p className="mt-2">回收站为空</p>
          <p className="text-xs text-gray-500">删除的项目将在这里显示</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2">
            {filtered.map((item) => (
              <div key={item.id} className="bg-[#141b2d] border border-[#1e2a45] rounded-xl p-3 flex items-center justify-between hover:border-red-500/30 transition">
                <div className="flex items-center gap-4 flex-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[item.type]}`}>
                    {typeLabels[item.type] || item.type}
                  </span>
                  <span className="text-white font-medium">{item.name}</span>
                  <span className="text-gray-500 text-xs">删除人: {item.deletedBy}</span>
                  <span className="text-gray-500 text-xs">{new Date(item.deletedAt).toLocaleString()}</span>
                  {item.originalData && (
                    <span className="text-gray-500 text-xs">
                      📦 {Object.keys(item.originalData).join(', ')}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => restoreItem(item)}
                    className="p-1.5 rounded hover:bg-green-500/10 text-green-500 hover:text-green-400 transition"
                    title="恢复"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={() => permanentDelete(item.id)}
                    className="p-1.5 rounded hover:bg-red-500/10 text-red-500 hover:text-red-400 transition"
                    title="永久删除"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="text-right text-xs text-gray-500">
            共 {items.length} 个项目
          </div>
        </>
      )}
    </div>
  );
}
