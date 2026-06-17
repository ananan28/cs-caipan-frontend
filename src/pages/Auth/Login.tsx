import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../api/supabase';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Shield, Sparkles } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('请输入有效邮箱'),
  password: z.string().min(6, '密码至少6位'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError('');
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      
      if (authData.user) {
        // 获取 profile 信息
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (profileError) {
          console.error('Profile error:', profileError);
        }

        // 合并用户信息，确保 role 正确
        const userData = {
          ...authData.user,
          role: profile?.role || 'user',
          is_root_holder: profile?.is_root_holder || false,
          username: profile?.username || authData.user.email?.split('@')[0],
        };
        
        console.log('✅ 登录用户信息:', userData);
        setUser(userData);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(/login-bg.jpg)`,
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card rounded-2xl p-8 border-neon">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary-500/20 relative">
                CS
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold text-white tracking-tight">财盛集团</h1>
                <p className="text-[10px] text-primary-400/60 tracking-widest">博亿研发中心 · V2.8</p>
              </div>
            </div>
            <h2 className="text-lg font-semibold text-white mt-4">系统登录</h2>
            <p className="text-xs text-gray-300 mt-1">企业级数据服务平台，仅限授权账号登录</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <Shield size={16} /> {error}
              </div>
            )}
            <Input label="邮箱" type="email" placeholder="admin@caisheng.com" {...register('email')} error={errors.email?.message} className="bg-primary-900/20 border-primary-700/20 focus:border-primary-500" />
            <Input label="登录密码" type="password" placeholder="••••••••" {...register('password')} error={errors.password?.message} className="bg-primary-900/20 border-primary-700/20 focus:border-primary-500" />
            <Button type="submit" loading={loading} className="w-full btn-tech text-white font-medium py-2.5 relative">
              <Sparkles size={16} /> 进入系统
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-300">没有账号？<span className="text-primary-400 cursor-pointer hover:text-primary-300 transition-colors">立即注册</span></p>
          </div>

          <div className="mt-4 pt-4 border-t border-primary-700/20 text-center">
            <p className="text-[9px] text-primary-300/50 font-mono">
              CS 财盛集团 · 博亿研发中心<br />
              商业正式版 V2.8 · 全球化权限融合版
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
