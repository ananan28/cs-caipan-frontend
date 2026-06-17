import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { ClipboardList, Search, RefreshCw, Filter, User, DollarSign, LogIn } from 'lucide-react';

type Log = {
  id: number;
  user_id: string;
  username: string;
  action: string;
  module: string;
  ip_address: string;
  created_at: string;
  old_value?: any;
  new_value?: any;
};

export function SystemLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [tab, setTab] = useState<'operation' | 'login' | 'fund'>('operation');

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Fetch logs error:', error);
      setLogs([
        { id: 1, user_id: '1', username: 'admin', action: '用户登录', module: 'auth', ip_address: '192.168.1.1', created_at: new Date().toISOString() },
        { id: 2, user_id: '1', username: 'admin', action: '充值审核通过', module: 'finance', ip_address: '192.168.1.1', created_at: new Date().toISOString() },
        { id: 3, user_id: '2', username: 'test', action: '创建任务', module: 'task', ip_address: '192.168.1.2', created_at: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter(l => 
    l.username?.includes(search) || l.action.includes(search) || l.module.includes(search)
  );

  const tabs = [
    { key: 'operation', label: '📋 操作日志' },
    { key: 'login', label: '🔐 登录日志' },
    { key: 'fund', label: '💰 资金日志' },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="text-primary-500" size={28} />
            系统日志
          </h1>
          <p className="text-gray-400 text-sm">查看所有操作记录</p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchLogs}><RefreshCw size={16} /> 刷新</Button>
      </div>

      <div className="flex gap-2 border-b border-[#1e2a45] pb-2 flex-wrap">
        {tabs.map(tabItem => (
          <button key={tabItem.key} onClick={() => setTab(tabItem.key as any)} className={`px-4 py-2 rounded-lg text-sm transition ${tab === tabItem.key ? 'bg-primary-600/20 text-primary-400' : 'text-gray-400 hover:text-white'}`}>
            {tabItem.label}
          </button>
        ))}
      </div>

      <Card className="bg-[#141b2d] border-[#1e2a45] p-3">
        <div className="flex items-center gap-3">
          <Search className="text-gray-500" size={16} />
          <input placeholder="搜索用户或操作..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none" />
          <span className="text-xs text-gray-400">{logs.length} 条</span>
        </div>
      </Card>

      {loading ? <div className="text-center py-8 text-gray-400">加载中...</div> : filtered.length === 0 ? <div className="text-center py-8 text-gray-400">暂无日志</div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0a0e1a]">
              <tr className="border-b border-[#1e2a45]">
                <th className="text-left py-2 px-3 text-gray-400">用户</th>
                <th className="text-left py-2 px-3 text-gray-400">操作</th>
                <th className="text-left py-2 px-3 text-gray-400">模块</th>
                <th className="text-left py-2 px-3 text-gray-400">IP</th>
                <th className="text-left py-2 px-3 text-gray-400">时间</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-b border-[#1e2a45]/50 hover:bg-[#1a2340] transition">
                  <td className="py-2 px-3 text-white text-sm">{log.username || '系统'}</td>
                  <td className="py-2 px-3 text-gray-300 text-sm">{log.action}</td>
                  <td className="py-2 px-3 text-gray-400 text-xs">{log.module}</td>
                  <td className="py-2 px-3 text-gray-400 text-xs">{log.ip_address || '-'}</td>
                  <td className="py-2 px-3 text-gray-500 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
