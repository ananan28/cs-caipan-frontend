import { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Key, Plus, Edit, Trash2, RefreshCw, Check, X, Search, Clock } from 'lucide-react';

type Delegation = {
  id: number;
  user_id: string;
  module: string;
  action: string;
  scope: string;
  granted_by: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  username?: string;
  granted_by_name?: string;
};

export function RootDelegation() {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    module: 'task',
    action: 'view',
    scope: 'all',
    expires_at: '',
  });

  const modules = ['wallet', 'task', 'user', 'risk', 'system', 'audit', 'message', 'detect'];
  const actions = ['view', 'create', 'edit', 'delete', 'approve', 'execute'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [delegationsRes, usersRes] = await Promise.all([
        supabase.from('permissions').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, username, email, role'),
      ]);

      if (delegationsRes.data) {
        const deps = delegationsRes.data.map((d: any) => ({
          ...d,
          username: usersRes.data?.find((u: any) => u.id === d.user_id)?.username || '未知',
          granted_by_name: usersRes.data?.find((u: any) => u.id === d.granted_by)?.username || '系统',
        }));
        setDelegations(deps);
      }
      if (usersRes.data) {
        setUsers(usersRes.data.filter((u: any) => u.role !== 'owner'));
      }
    } catch (error) {
      console.error('Fetch delegations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDelegation = async () => {
    if (!formData.user_id) { alert('请选择用户'); return; }
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      await supabase.from('permissions').insert({
        user_id: formData.user_id,
        module: formData.module,
        action: formData.action,
        scope: formData.scope,
        granted_by: currentUser.user?.id,
        expires_at: formData.expires_at || null,
        is_active: true,
      });
      alert('✅ Root授权已添加');
      setShowForm(false);
      setFormData({ user_id: '', module: 'task', action: 'view', scope: 'all', expires_at: '' });
      fetchData();
    } catch (error) {
      alert('添加失败');
    }
  };

  const toggleDelegation = async (id: number, current: boolean) => {
    try {
      await supabase.from('permissions').update({ is_active: !current }).eq('id', id);
      fetchData();
    } catch (error) {
      alert('操作失败');
    }
  };

  const deleteDelegation = async (id: number) => {
    if (!confirm('确定删除此授权？')) return;
    try {
      await supabase.from('permissions').delete().eq('id', id);
      alert('✅ 已删除');
      fetchData();
    } catch (error) {
      alert('删除失败');
    }
  };

  const filtered = delegations.filter(d =>
    d.username?.includes(search) || d.module.includes(search) || d.action.includes(search)
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Key className="text-amber-500" size={28} />
            Root Delegation
          </h1>
          <p className="text-gray-400 text-sm">Owner 授权 GM 超级权限</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={fetchData}><RefreshCw size={16} /></Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus size={16} /> 授权</Button>
        </div>
      </div>

      {showForm && (
        <Card className="bg-[#141b2d] border-[#1e2a45] p-4">
          <h3 className="text-white font-semibold mb-3">🔑 授予Root权限</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select value={formData.user_id} onChange={(e) => setFormData({ ...formData, user_id: e.target.value })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-2 text-white text-sm">
              <option value="">选择GM</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.role})</option>)}
            </select>
            <select value={formData.module} onChange={(e) => setFormData({ ...formData, module: e.target.value })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-2 text-white text-sm">
              {modules.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={formData.action} onChange={(e) => setFormData({ ...formData, action: e.target.value })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-2 text-white text-sm">
              {actions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={formData.scope} onChange={(e) => setFormData({ ...formData, scope: e.target.value })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-2 text-white text-sm">
              <option value="own">自己</option><option value="dept">部门</option><option value="all">全部</option>
            </select>
            <input type="datetime-local" value={formData.expires_at} onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <Button className="mt-3" onClick={handleAddDelegation}>授予权限</Button>
        </Card>
      )}

      <Card className="bg-[#141b2d] border-[#1e2a45] p-3">
        <div className="flex items-center gap-3">
          <Search className="text-gray-500" size={16} />
          <input placeholder="搜索授权..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none" />
          <span className="text-xs text-gray-400">{delegations.length} 条</span>
        </div>
      </Card>

      {loading ? <div className="text-center py-8 text-gray-400">加载中...</div> : filtered.length === 0 ? <div className="text-center py-8 text-gray-400">暂无授权记录</div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0a0e1a]">
              <tr className="border-b border-[#1e2a45]">
                <th className="text-left py-2 px-3 text-gray-400">用户</th>
                <th className="text-left py-2 px-3 text-gray-400">模块</th>
                <th className="text-left py-2 px-3 text-gray-400">操作</th>
                <th className="text-left py-2 px-3 text-gray-400">范围</th>
                <th className="text-left py-2 px-3 text-gray-400">授权人</th>
                <th className="text-left py-2 px-3 text-gray-400">到期</th>
                <th className="text-left py-2 px-3 text-gray-400">状态</th>
                <th className="text-right py-2 px-3 text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-b border-[#1e2a45]/50 hover:bg-[#1a2340]">
                  <td className="py-2 px-3 text-white">{d.username}</td>
                  <td className="py-2 px-3 text-gray-400">{d.module}</td>
                  <td className="py-2 px-3 text-gray-400">{d.action}</td>
                  <td className="py-2 px-3 text-gray-400">{d.scope}</td>
                  <td className="py-2 px-3 text-gray-400">{d.granted_by_name}</td>
                  <td className="py-2 px-3 text-gray-400 text-xs">{d.expires_at ? new Date(d.expires_at).toLocaleDateString() : '永久'}</td>
                  <td className="py-2 px-3"><span className={`text-xs px-2 py-0.5 rounded-full ${d.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{d.is_active ? '启用' : '禁用'}</span></td>
                  <td className="py-2 px-3 text-right"><div className="flex justify-end gap-1">
                    <button onClick={() => toggleDelegation(d.id, d.is_active)} className="p-1 rounded hover:bg-blue-500/10 text-gray-500 hover:text-blue-400">{d.is_active ? <X size={14} /> : <Check size={14} />}</button>
                    <button onClick={() => deleteDelegation(d.id)} className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
