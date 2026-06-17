import { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { 
  Users, Search, UserX, UserCheck, Trash2, RefreshCw, 
  Plus, UserPlus, X, Check, Mail, Lock, User 
} from 'lucide-react';

type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  balance: number;
  created_at: string;
};

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    username: '',
    role: 'user',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_list')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Fetch users error:', error);
      setUsers([
        { id: '1', username: 'admin', email: 'admin@caisheng.com', role: 'owner', status: 'active', balance: 1000, created_at: new Date().toISOString() },
        { id: '2', username: 'test', email: 'test@test.com', role: 'user', status: 'active', balance: 100, created_at: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 创建用户
  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password) {
      alert('请填写邮箱和密码');
      return;
    }
    if (createForm.password.length < 6) {
      alert('密码至少6位');
      return;
    }

    setCreating(true);
    try {
      // 1. 在 Supabase Auth 创建用户
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: createForm.email,
        password: createForm.password,
        email_confirm: true,
        user_metadata: { username: createForm.username || createForm.email.split('@')[0] },
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. 在 profiles 表创建记录
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            username: createForm.username || createForm.email.split('@')[0],
            email: createForm.email,
            role: createForm.role,
            status: 'active',
            is_root_holder: false,
          });

        if (profileError) throw profileError;

        // 3. 创建钱包
        await supabase
          .from('points_accounts')
          .insert({
            user_id: authData.user.id,
            balance: 0,
            total_recharged: 0,
            total_consumed: 0,
          });

        alert(`✅ 用户 ${createForm.email} 创建成功！`);
        setShowCreateForm(false);
        setCreateForm({ email: '', password: '', username: '', role: 'user' });
        fetchUsers();
      }
    } catch (error: any) {
      alert('创建失败：' + error.message);
    } finally {
      setCreating(false);
    }
  };

  // 冻结/激活用户
  const toggleUserStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'frozen' : 'active';
    if (!confirm(`确定${newStatus === 'active' ? '激活' : '冻结'}此用户吗？`)) return;
    try {
      await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
      alert(`✅ 用户已${newStatus === 'active' ? '激活' : '冻结'}`);
      fetchUsers();
    } catch (error) {
      alert('操作失败');
    }
  };

  // 删除用户
  const deleteUser = async (id: string) => {
    if (!confirm('⚠️ 确定要删除此用户吗？此操作不可恢复！')) return;
    try {
      // 先删除 profiles（级联删除 points_accounts 和 ledger）
      await supabase.from('profiles').delete().eq('id', id);
      // 再删除 auth 用户
      await supabase.auth.admin.deleteUser(id);
      alert('✅ 用户已删除');
      fetchUsers();
    } catch (error) {
      alert('删除失败：' + error);
    }
  };

  const filtered = users.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-primary-500" size={28} />
            用户中心
          </h1>
          <p className="text-gray-400 text-sm">管理所有平台用户 · 创建/冻结/删除</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={fetchUsers}>
            <RefreshCw size={16} />
          </Button>
          <Button size="sm" onClick={() => setShowCreateForm(!showCreateForm)}>
            <UserPlus size={16} /> 创建用户
          </Button>
        </div>
      </div>

      {/* 创建用户表单 */}
      {showCreateForm && (
        <Card className="bg-[#141b2d] border-[#1e2a45] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <UserPlus size={18} className="text-green-500" />
              创建新用户
            </h3>
            <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-sm">邮箱 *</label>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-2 text-white text-sm mt-1"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">密码 * (至少6位)</label>
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-2 text-white text-sm mt-1"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">用户名</label>
              <input
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-2 text-white text-sm mt-1"
                placeholder="用户名（可选）"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">角色</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-2 text-white text-sm mt-1"
              >
                <option value="user">普通用户</option>
                <option value="agent">代理</option>
                <option value="gm">GM</option>
              </select>
            </div>
          </div>
          <Button className="mt-3" onClick={handleCreateUser} loading={creating}>
            <UserPlus size={16} /> 创建用户
          </Button>
        </Card>
      )}

      {/* 搜索 */}
      <Card className="bg-[#141b2d] border-[#1e2a45] p-3">
        <div className="flex items-center gap-3">
          <Search className="text-gray-500" size={16} />
          <input
            placeholder="搜索用户..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none"
          />
          <span className="text-xs text-gray-400">{users.length} 个用户</span>
        </div>
      </Card>

      {/* 用户列表 */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-400">暂无用户</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0a0e1a]">
              <tr className="border-b border-[#1e2a45]">
                <th className="text-left py-3 px-3 text-gray-400 font-medium">用户</th>
                <th className="text-left py-3 px-3 text-gray-400 font-medium">角色</th>
                <th className="text-left py-3 px-3 text-gray-400 font-medium">积分</th>
                <th className="text-left py-3 px-3 text-gray-400 font-medium">状态</th>
                <th className="text-left py-3 px-3 text-gray-400 font-medium">注册时间</th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-[#1e2a45]/50 hover:bg-[#1a2340] transition">
                  <td className="py-3 px-3">
                    <div>
                      <p className="text-white font-medium text-sm">{user.username || '未设置'}</p>
                      <p className="text-gray-400 text-xs">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.role === 'owner' ? 'bg-amber-500/20 text-amber-500' : 
                      user.role === 'gm' ? 'bg-purple-500/20 text-purple-500' : 
                      user.role === 'agent' ? 'bg-blue-500/20 text-blue-500' : 
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-amber-500 font-medium">{user.balance?.toFixed(2) || '0.00'}</td>
                  <td className="py-3 px-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${user.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {user.status === 'active' ? '✅ 正常' : '❄️ 冻结'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-400 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex justify-end gap-1">
                      {user.role !== 'owner' && (
                        <>
                          {user.status === 'active' ? (
                            <button 
                              onClick={() => toggleUserStatus(user.id, user.status)} 
                              className="p-1.5 rounded hover:bg-yellow-500/10 text-yellow-500 hover:text-yellow-400 transition" 
                              title="冻结"
                            >
                              <UserX size={15} />
                            </button>
                          ) : (
                            <button 
                              onClick={() => toggleUserStatus(user.id, user.status)} 
                              className="p-1.5 rounded hover:bg-green-500/10 text-green-500 hover:text-green-400 transition" 
                              title="激活"
                            >
                              <UserCheck size={15} />
                            </button>
                          )}
                          <button 
                            onClick={() => deleteUser(user.id)} 
                            className="p-1.5 rounded hover:bg-red-500/10 text-red-500 hover:text-red-400 transition" 
                            title="删除"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                      {user.role === 'owner' && (
                        <span className="text-xs text-amber-500">👑 所有者</span>
                      )}
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
