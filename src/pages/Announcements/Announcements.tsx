import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Megaphone, Plus, Edit, Trash2, Eye, EyeOff, Check, X, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

type Announcement = {
  id: string;
  title: string;
  content: string;
  type: 'normal' | 'important' | 'emergency';
  is_active: boolean;
  is_popup: boolean;
  created_at: string;
  is_read?: boolean;
};

export function Announcements() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', type: 'normal' as any, is_popup: false });

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    try {
      // 获取公告
      const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      if (data) {
        // 检查已读状态
        const { data: reads } = await supabase.from('announcement_reads').select('announcement_id').eq('user_id', user?.id);
        const readIds = new Set(reads?.map((r: any) => r.announcement_id) || []);
        setAnnouncements(data.map((a: any) => ({ ...a, is_read: readIds.has(a.id) })));
      }
    } catch (error) {
      console.error('Fetch announcements error:', error);
    }
  };

  // 标记公告已读
  const markAsRead = async (id: string) => {
    try {
      await supabase.from('announcement_reads').insert({ announcement_id: id, user_id: user?.id });
      fetchAnnouncements();
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) { alert('请填写标题和内容'); return; }
    try {
      if (editingId) {
        await supabase.from('announcements').update(formData).eq('id', editingId);
        alert('✅ 公告已更新');
      } else {
        await supabase.from('announcements').insert({ ...formData, created_by: user?.id, is_active: true });
        alert('✅ 公告已发布');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ title: '', content: '', type: 'normal', is_popup: false });
      fetchAnnouncements();
    } catch (error: any) {
      alert('操作失败：' + error.message);
    }
  };

  const startEdit = (item: Announcement) => {
    setFormData({ title: item.title, content: item.content, type: item.type, is_popup: item.is_popup });
    setEditingId(item.id);
    setShowForm(true);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('announcements').update({ is_active: !current }).eq('id', id);
    fetchAnnouncements();
  };

  const deleteItem = async (id: string) => {
    if (!confirm('确定删除此公告吗？')) return;
    await supabase.from('announcements').delete().eq('id', id);
    alert('✅ 已删除');
    fetchAnnouncements();
  };

  const getTypeStyle = (type: string) => {
    const map = {
      normal: 'bg-blue-500/20 text-blue-400',
      important: 'bg-yellow-500/20 text-yellow-400',
      emergency: 'bg-red-500/20 text-red-400',
    };
    return map[type as keyof typeof map] || map.normal;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="text-primary-500" size={28} />
            公告系统
          </h1>
          <p className="text-gray-400 text-sm">发布和管理公告 · 弹窗通知</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ title: '', content: '', type: 'normal', is_popup: false }); }}>
          <Plus size={16} /> 发布公告
        </Button>
      </div>

      {showForm && (
        <Card className="bg-[#141b2d] border-[#1e2a45] p-4">
          <h3 className="text-white font-semibold mb-3">{editingId ? '✏️ 编辑公告' : '📝 发布新公告'}</h3>
          <div className="space-y-3">
            <input placeholder="标题" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm" />
            <textarea placeholder="内容" rows={3} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm" />
            <div className="flex gap-4">
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm">
                <option value="normal">普通</option><option value="important">重要</option><option value="emergency">紧急</option>
              </select>
              <label className="flex items-center gap-2 text-gray-400 text-sm">
                <input type="checkbox" checked={formData.is_popup} onChange={(e) => setFormData({ ...formData, is_popup: e.target.checked })} /> 弹窗显示
              </label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>{editingId ? '更新' : '发布'}</Button>
              <Button variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>取消</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {announcements.map((a) => (
          <div key={a.id} className="bg-[#141b2d] border border-[#1e2a45] rounded-xl p-4 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeStyle(a.type)}`}>{a.type}</span>
                <h3 className="text-white font-semibold">{a.title}</h3>
                {a.is_popup && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">🔔 弹窗</span>}
                <span className={`text-xs ${a.is_active ? 'text-green-500' : 'text-gray-500'}`}>{a.is_active ? '✅ 已发布' : '⛔ 已下架'}</span>
                {a.is_read !== undefined && (
                  <span className={`text-xs ${a.is_read ? 'text-gray-500' : 'text-blue-400'}`}>
                    {a.is_read ? '已读' : '未读'}
                  </span>
                )}
                {!a.is_read && a.is_active && (
                  <button onClick={() => markAsRead(a.id)} className="text-xs text-blue-400 hover:text-blue-300">标记已读</button>
                )}
              </div>
              <p className="text-gray-400 text-sm mt-1">{a.content}</p>
              <p className="text-gray-500 text-xs mt-1">{new Date(a.created_at).toLocaleString()}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => toggleActive(a.id, a.is_active)} className="p-1 rounded hover:bg-blue-500/10 text-gray-500 hover:text-blue-400">
                {a.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button onClick={() => startEdit(a)} className="p-1 rounded hover:bg-blue-500/10 text-gray-500 hover:text-blue-400"><Edit size={16} /></button>
              <button onClick={() => deleteItem(a.id)} className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
