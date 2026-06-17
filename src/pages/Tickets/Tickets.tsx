import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Ticket, Plus, CheckCircle, Trash2, Edit, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

type TicketItem = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  assigned_to?: string;
  username?: string;
  email?: string;
};

export function Tickets() {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', category: '充值', priority: 'medium' as any });
  const userRole = user?.role || 'user';
  const isGM = userRole === 'owner' || userRole === 'gm';

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const query = supabase.from('tickets').select(`*, profiles:user_id (username, email)`).order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      const formatted = data?.map((item: any) => ({
        ...item,
        username: item.profiles?.username,
        email: item.profiles?.email,
      })) || [];
      setTickets(formatted);
    } catch (error) {
      console.error('Fetch tickets error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) { alert('请填写标题和内容'); return; }
    try {
      if (editingId) {
        await supabase.from('tickets').update({ title: formData.title, content: formData.content, category: formData.category, priority: formData.priority }).eq('id', editingId);
        alert('✅ 工单已更新');
      } else {
        await supabase.from('tickets').insert({ user_id: user?.id, title: formData.title, content: formData.content, category: formData.category, priority: formData.priority, status: 'open' });
        alert('✅ 工单已提交');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ title: '', content: '', category: '充值', priority: 'medium' });
      fetchTickets();
    } catch (error: any) {
      alert('操作失败：' + error.message);
    }
  };

  const startEdit = (item: TicketItem) => {
    setFormData({ title: item.title, content: item.content, category: item.category, priority: item.priority });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleResolve = async (id: string) => {
    if (!confirm('确认将此工单标记为已解决？')) return;
    try {
      await supabase.from('tickets').update({ status: 'resolved' }).eq('id', id);
      alert('✅ 工单已解决');
      fetchTickets();
    } catch (error: any) {
      alert('操作失败：' + error.message);
    }
  };

  const handleRejectTicket = async (id: string) => {
    const reason = prompt('请输入拒绝/关闭原因：');
    if (reason === null) return;
    try {
      await supabase.from('tickets').update({ status: 'closed' }).eq('id', id);
      const { data: ticket } = await supabase.from('tickets').select('user_id').eq('id', id).single();
      if (ticket) {
        await supabase.from('messages').insert({
          receiver_id: ticket.user_id,
          subject: '📋 工单已关闭',
          content: `您的工单已关闭。\n原因：${reason}`,
          type: 'direct',
          sender_id: user?.id,
        });
      }
      alert('✅ 工单已关闭，用户已收到通知');
      fetchTickets();
    } catch (error: any) {
      alert('操作失败：' + error.message);
    }
  };

  const deleteTicket = async (id: string) => {
    if (!confirm('确定删除此工单吗？')) return;
    try {
      await supabase.from('tickets').delete().eq('id', id);
      alert('✅ 已删除');
      fetchTickets();
    } catch (error: any) {
      alert('删除失败：' + error.message);
    }
  };

  const statusColors = {
    open: 'bg-yellow-500/20 text-yellow-400',
    in_progress: 'bg-blue-500/20 text-blue-400',
    resolved: 'bg-green-500/20 text-green-400',
    closed: 'bg-gray-500/20 text-gray-400',
  };
  const statusLabels = { open: '待处理', in_progress: '处理中', resolved: '已解决', closed: '已关闭' };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Ticket className="text-primary-500" size={28} />
            工单系统
          </h1>
          <p className="text-gray-400 text-sm">
            {isGM ? '管理所有工单 · 处理充值审核' : '创建和查看工单'}
          </p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ title: '', content: '', category: '充值', priority: 'medium' }); }}>
          <Plus size={16} /> {isGM ? '新建工单' : '提交工单'}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-[#141b2d] border-[#1e2a45] p-4">
          <h3 className="text-white font-semibold mb-3">{editingId ? '✏️ 编辑工单' : '📝 新建工单'}</h3>
          <div className="space-y-3">
            <input placeholder="标题" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm" />
            <textarea placeholder="描述" rows={3} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm" />
            <div className="flex gap-4">
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="flex-1 bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm">
                <option>充值</option><option>检测</option><option>账号</option><option>系统</option><option>其他</option>
              </select>
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })} className="flex-1 bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm">
                <option value="low">低</option><option value="medium">中</option><option value="high">高</option><option value="urgent">紧急</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>{editingId ? '更新' : '提交'}</Button>
              <Button variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>取消</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {loading ? <div className="text-center py-8 text-gray-400">加载中...</div> : tickets.length === 0 ? <div className="text-center py-8 text-gray-400">暂无工单</div> : tickets.map((t) => (
          <div key={t.id} className="bg-[#141b2d] border border-[#1e2a45] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[t.status]}`}>{statusLabels[t.status]}</span>
                <span className={`text-xs font-medium ${t.priority === 'urgent' ? 'text-red-400' : t.priority === 'high' ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {t.priority === 'urgent' ? '🔥' : t.priority === 'high' ? '⬆️' : '➡️'} {t.priority}
                </span>
                <h3 className="text-white font-semibold">{t.title}</h3>
                <span className="text-xs text-gray-500">{t.category}</span>
                {t.username && <span className="text-xs text-gray-400">👤 {t.username}</span>}
              </div>
              <div className="flex gap-1">
                {isGM && t.status === 'open' && (
                  <>
                    <button onClick={() => handleResolve(t.id)} className="p-1 rounded hover:bg-green-500/10 text-green-500 hover:text-green-400" title="解决"><CheckCircle size={16} /></button>
                    <button onClick={() => handleRejectTicket(t.id)} className="p-1 rounded hover:bg-red-500/10 text-red-500 hover:text-red-400" title="关闭"><X size={16} /></button>
                  </>
                )}
                {(t.user_id === user?.id || isGM) && t.status !== 'closed' && (
                  <button onClick={() => startEdit(t)} className="p-1 rounded hover:bg-blue-500/10 text-gray-500 hover:text-blue-400"><Edit size={14} /></button>
                )}
                {(t.user_id === user?.id || isGM) && (
                  <button onClick={() => deleteTicket(t.id)} className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
                )}
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-1">{t.content}</p>
            <p className="text-gray-500 text-xs mt-1">{new Date(t.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
