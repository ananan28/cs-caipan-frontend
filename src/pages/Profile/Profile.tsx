import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { User, Mail, Phone, Camera, Save, Lock, Key, RefreshCw, Check, X } from 'lucide-react';

export function Profile() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    phone: '',
    avatar_url: '',
  });
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, email, phone, avatar_url')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      if (data) setProfile(data);
    } catch (error) {
      console.error('Fetch profile error:', error);
    }
  };

  // ====== 更新个人资料 ======
  const updateProfile = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
        })
        .eq('id', user?.id);
      if (error) throw error;
      setMessage({ type: 'success', text: '✅ 个人资料已更新' });
      // 更新 store
      setUser({ ...user, username: profile.username });
    } catch (error: any) {
      setMessage({ type: 'error', text: '❌ 更新失败：' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // ====== 修改密码 ======
  const updatePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: '❌ 两次输入的新密码不一致' });
      return;
    }
    if (passwordData.new_password.length < 6) {
      setMessage({ type: 'error', text: '❌ 新密码至少6位' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password,
      });
      if (error) throw error;
      setMessage({ type: 'success', text: '✅ 密码已修改' });
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (error: any) {
      setMessage({ type: 'error', text: '❌ 修改失败：' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // ====== 管理员重置用户密码 ======
  const [resetTarget, setResetTarget] = useState('');
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const resetUserPassword = async () => {
    if (!resetTarget) {
      setResetMessage({ type: 'error', text: '❌ 请输入用户邮箱' });
      return;
    }
    if (!confirm(`确定要重置 ${resetTarget} 的密码吗？`)) return;

    setLoading(true);
    setResetMessage(null);
    try {
      // 查找用户
      const { data: userData, error: findError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', resetTarget)
        .single();
      if (findError || !userData) {
        setResetMessage({ type: 'error', text: '❌ 用户不存在' });
        setLoading(false);
        return;
      }

      // 重置密码（通过 Supabase Admin API）
      const newPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
      const { error } = await supabase.auth.admin.updateUserById(
        userData.id,
        { password: newPassword }
      );
      if (error) throw error;

      setResetMessage({ type: 'success', text: `✅ 密码已重置为: ${newPassword}` });
      setResetTarget('');
    } catch (error: any) {
      setResetMessage({ type: 'error', text: '❌ 重置失败：' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const userRole = user?.role || 'user';
  const isAdmin = userRole === 'owner' || userRole === 'gm';

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="text-primary-500" size={28} />
            个人中心
          </h1>
          <p className="text-gray-400 text-sm">修改个人资料和密码</p>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ====== 个人资料 ====== */}
        <Card className="bg-[#141b2d] border-[#1e2a45]">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <User size={18} className="text-blue-500" />
            个人资料
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-sm">用户名</label>
              <input
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">邮箱</label>
              <input
                value={profile.email}
                disabled
                className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-gray-500 text-sm mt-1 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">手机号</label>
              <input
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="请输入手机号"
                className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">头像地址</label>
              <input
                value={profile.avatar_url || ''}
                onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                placeholder="头像图片URL"
                className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm mt-1"
              />
            </div>
            <Button onClick={updateProfile} loading={loading} className="w-full">
              <Save size={16} /> 保存资料
            </Button>
          </div>
        </Card>

        {/* ====== 修改密码 ====== */}
        <Card className="bg-[#141b2d] border-[#1e2a45]">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Lock size={18} className="text-amber-500" />
            修改密码
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-sm">旧密码</label>
              <input
                type="password"
                value={passwordData.old_password}
                onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">新密码</label>
              <input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">确认新密码</label>
              <input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm mt-1"
              />
            </div>
            <Button variant="secondary" onClick={updatePassword} loading={loading} className="w-full">
              <Key size={16} /> 修改密码
            </Button>
          </div>
        </Card>
      </div>

      {/* ====== 管理员重置密码 ====== */}
      {isAdmin && (
        <Card className="bg-[#141b2d] border-[#1e2a45]">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <RefreshCw size={18} className="text-red-500" />
            管理员重置用户密码
          </h3>
          {resetMessage && (
            <div className={`p-2 rounded-lg mb-3 text-sm ${resetMessage.type === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
              {resetMessage.text}
            </div>
          )}
          <div className="flex gap-3">
            <input
              value={resetTarget}
              onChange={(e) => setResetTarget(e.target.value)}
              placeholder="输入用户邮箱"
              className="flex-1 bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm"
            />
            <Button variant="danger" onClick={resetUserPassword} loading={loading}>
              <Key size={16} /> 重置密码
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">⚠️ 重置后新密码会显示在页面上，请及时告知用户</p>
        </Card>
      )}
    </div>
  );
}
