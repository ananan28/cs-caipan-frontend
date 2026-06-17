import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../api/supabase';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Shield, Sparkles, Mail, Lock, User, Gift } from 'lucide-react';

export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite') || '';
  
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    invite_code: inviteCode,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!form.email || !form.password) {
      setError('请填写邮箱和密码');
      return;
    }
    if (form.password.length < 6) {
      setError('密码至少6位');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('两次密码不一致');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // 注册用户
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            username: form.username || form.email.split('@')[0],
            invite_code: form.invite_code,
          },
        },
      });

      if (error) throw error;

      alert('✅ 注册成功！请查收邮箱验证邮件后登录。');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-tech-gradient relative overflow-hidden">
      <div className="absolute left-5 top-1/4 text-8xl opacity-10 pointer-events-none">🐉</div>
      <div className="absolute right-5 top-1/4 text-8xl opacity-10 pointer-events-none">🐲</div>
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card rounded-2xl p-8 border-neon">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/20">CS</div>
              <div className="text-left">
                <h1 className="text-xl font-bold text-white tracking-tight">财盛集团</h1>
                <p className="text-[10px] text-primary-400/60 tracking-widest">博亿研发中心 · V2.8</p>
              </div>
            </div>
            <h2 className="text-lg font-semibold text-white mt-4">注册账号</h2>
            <p className="text-xs text-gray-300 mt-1">加入企业级数据服务平台</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <Shield size={16} /> {error}
              </div>
            )}
            <Input label="邮箱" type="email" placeholder="your@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-primary-900/20 border-primary-700/20" />
            <Input label="用户名" placeholder="用户名（可选）" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="bg-primary-900/20 border-primary-700/20" />
            <Input label="密码 (至少6位)" type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="bg-primary-900/20 border-primary-700/20" />
            <Input label="确认密码" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="bg-primary-900/20 border-primary-700/20" />
            <Input label="邀请码 (可选)" placeholder="输入邀请码" value={form.invite_code} onChange={(e) => setForm({ ...form, invite_code: e.target.value })} className="bg-primary-900/20 border-primary-700/20" />
            <Button type="submit" loading={loading} className="w-full btn-tech text-white font-medium py-2.5">
              <Sparkles size={16} /> 立即注册
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-300">
              已有账号？<Link to="/login" className="text-primary-400 hover:text-primary-300 transition-colors">返回登录</Link>
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-primary-700/10 text-center">
            <p className="text-[9px] text-primary-300/50 font-mono">CS 财盛集团 · 博亿研发中心 V2.8</p>
          </div>
        </div>
      </div>
    </div>
  );
}
