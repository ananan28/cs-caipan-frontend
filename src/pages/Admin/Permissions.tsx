import { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Shield, Plus, Edit, Trash2, RefreshCw, Check, X, Search } from 'lucide-react';

type Permission = {
  id: number;
  user_id: string;
  module: string;
  action: string;
  scope: string;
  is_active: boolean;
  created_at: string;
  username?: string;
};

type Role = {
  id: string;
  username: string;
  email: string;
  role: string;
};

export function Permissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    module: 'task',
    action: 'view',
    scope: 'own',
  });

  const modules = ['wallet', 'task', 'user', 'risk', 'system', 'audit', 'message', 'detect'];
  const actions = ['view', 'create', 'edit', 'delete', 'approve', 'execute'];
  const scopes = ['own', 'dept', 'all'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [permsRes, usersRes] = await Promise.all([
        supabase.from('permissions').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, username, email, role'),
      ]);

      if (permsRes.data) {
        const perms = permsRes.data.map((p: any) => ({
          ...p,
          username: usersRes.data?.find((u: any) => u.id === p.user_id)?.username || '未知',
        }));
        setPermissions(perms);
      }
      if (usersRes.data) setUsers(usersRes.data);
    } catch (error) {
      console.error('Fetch permissions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPermission = async () => {
    if (!formData.user_id) { alert('请选择用户'); return; }
    try {
      await supabase.from('permissions').insert({
        user_id: formData.user_id,
        module: formData.module,
        action: formData.action,
        scope: formData.scope,
        is_active: true,
      });
      alert('✅ 权限已添加');
      setShowForm(false);
      fetchData();
    } catch (error) {
      alert('添加失败');
    }
  };

  const togglePermission = async (id: number, current: boolean) => {
    try {
      await supabase.from('permissions').update({ is_active: !current }).eq('id', id);
      fetchData();
    } catch (error) {
      alert('操作失败');
    }
  };

  const deletePermission = async (id: number) => {
    if (!confirm('确定删除此权限？')) return;
    try {
      await supabase.from('permissions').delete().eq('id', id);
      alert('✅ 已删除');
      fetchData();
    } catch (error) {
      alert('删除失败');
    }
  };

  const filtered = permissions.filter(p =>
    p.username?.includes(search) || p.module.includes(search) || p.action.includes(search)
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-primary-500" size={28} />
            权限管理
          </h1>
          <p className="text-gray-400 text-sm">管理用户权限</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={fetchData}>
            <RefreshCw size={16} />
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> 添加权限
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="bg-[#141b2d] border-[#1e2a45] p-4">
          <h3 className="text-white font-semibold mb-3">➕ 添加权限</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">选择用户</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
              ))}
            </select>
            <select
              value={formData.module}
              onChange={(e) => setFormData({ ...formData, module: e.target.value })}
              className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-2 text-white text-sm"
            >
              {modules.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select
              value={formData.action}
              onChange={(e) => setFormData({ ...formData, action: e.target.value })}
              className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-2 text-white text-sm"
            >
              {actions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-2 text-white text-sm"
            >
              {scopes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Button className="mt-3" onClick={handleAddPermission}>添加权限</Button>
        </Card>
      )}

      <Card className="bg-[#141b2d] border-[#1e2a45] p-3">
        <div className="flex items-center gap-3">
          <Search className="text-gray-500" size={16} />
          <input
            placeholder="搜索权限..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none"
          />
          <span className="text-xs text-gray-400">{permissions.length} 条</span>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-8 text-gray-400">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-400">暂无权限记录</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0a0e1a]">
              <tr className="border-b border-[#1e2a45]">
                <th className="text-left py-2 px-3 text-gray-400">用户</th>
                <th className="text-left py-2 px-3 text-gray-400">模块</th>
                <th className="text-left py-2 px-3 text-gray-400">操作</th>
                <th className="text-left py-2 px-3 text-gray-400">范围</th>
                <th className="text-left py-2 px-3 text-gray-400">状态</th>
                <th className="text-right py-2 px-3 text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-[#1e2a45]/50 hover:bg-[#1a2340]">
                  <td className="py-2 px-3 text-white">{p.username}</td>
                  <td className="py-2 px-3 text-gray-400">{p.module}</td>
                  <td className="py-2 px-3 text-gray-400">{p.action}</td>
                  <td className="py-2 px-3 text-gray-400">{p.scope}</td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {p.is_active ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => togglePermission(p.id, p.is_active)} className="p-1 rounded hover:bg-blue-500/10 text-gray-500 hover:text-blue-400">
                        {p.is_active ? <X size={14} /> : <Check size={14} />}
                      </button>
                      <button onClick={() => deletePermission(p.id)} className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
