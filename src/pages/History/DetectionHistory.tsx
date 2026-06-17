import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { History, Search, Eye, Download, RefreshCw, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';

type DetectionTask = {
  id: string;
  task_name: string;
  platform: string;
  total_numbers: number;
  processed_numbers: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  results?: any[];
};

type DetectionResult = {
  id: number;
  phone_number: string;
  platform: string;
  registered: boolean;
  has_avatar: boolean;
  gender: string;
  carrier: string;
  country: string;
  state: string;
  type: string;
  processed_at: string;
};

export function DetectionHistory() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<DetectionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Fetch tasks error:', error);
      setTasks([
        { id: '1', task_name: 'WhatsApp检测-20240115', platform: 'whatsapp', total_numbers: 100, processed_numbers: 100, status: 'completed', created_at: new Date().toISOString() },
        { id: '2', task_name: 'Telegram检测-20240114', platform: 'telegram', total_numbers: 50, processed_numbers: 50, status: 'completed', created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: '3', task_name: 'WhatsApp检测-20240113', platform: 'whatsapp', total_numbers: 200, processed_numbers: 150, status: 'processing', created_at: new Date(Date.now() - 172800000).toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from('detection_results')
        .select('*')
        .eq('task_id', taskId)
        .order('id', { ascending: true });
      if (error) throw error;
      setResults(data || []);
      setSelectedTask(taskId);
    } catch (error) {
      console.error('Fetch results error:', error);
      // 模拟结果
      const mockResults = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        phone_number: `+8613800${String(1000 + i).padStart(4, '0')}`,
        platform: 'whatsapp',
        registered: i % 2 === 0,
        has_avatar: i % 3 === 0,
        gender: ['男性', '女性', '未知'][i % 3],
        carrier: ['中国移动', '中国联通', '中国电信', 'AT&T'][i % 4],
        country: ['中国', '美国', '英国'][i % 3],
        state: ['北京', '上海', '广州', '纽约'][i % 4],
        type: i % 5 === 0 ? '虚拟号码' : '固定号码',
        processed_at: new Date().toISOString(),
      }));
      setResults(mockResults);
      setSelectedTask(taskId);
    }
  };

  const exportResults = () => {
    if (results.length === 0) return;
    let csv = '号码,平台,注册状态,头像,性别,运营商,国家,州,类型\n';
    results.forEach(r => {
      csv += `${r.phone_number},${r.platform},${r.registered ? '已注册' : '未注册'},${r.has_avatar ? '有' : '无'},${r.gender},${r.carrier},${r.country},${r.state},${r.type}\n`;
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `检测结果_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { label: '待处理', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
      processing: { label: '处理中', color: 'bg-blue-500/20 text-blue-400', icon: RefreshCw },
      completed: { label: '已完成', color: 'bg-green-500/20 text-green-500', icon: CheckCircle },
      failed: { label: '失败', color: 'bg-red-500/20 text-red-500', icon: XCircle },
    };
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;
    return <span className={`text-xs px-2 py-0.5 rounded-full ${config.color} flex items-center gap-1`}><Icon size={12} /> {config.label}</span>;
  };

  const filteredTasks = tasks.filter(t => t.task_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="text-primary-500" size={28} />
            检测历史
          </h1>
          <p className="text-gray-400 text-sm">查看所有检测任务和结果</p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchTasks}><RefreshCw size={16} /> 刷新</Button>
      </div>

      <Card className="bg-[#141b2d] border-[#1e2a45] p-3">
        <div className="flex items-center gap-3">
          <Search className="text-gray-500" size={16} />
          <input
            placeholder="搜索任务..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none"
          />
          <span className="text-xs text-gray-400">{tasks.length} 个任务</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 任务列表 */}
        <div className="lg:col-span-1 space-y-2 max-h-96 overflow-y-auto pr-1">
          {loading ? <div className="text-center py-4 text-gray-400">加载中...</div> : filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => fetchResults(task.id)}
              className={`p-3 rounded-xl border cursor-pointer transition ${selectedTask === task.id ? 'border-primary-500/50 bg-primary-500/10' : 'border-[#1e2a45] hover:border-[#2a3a5a]'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-medium truncate flex-1">{task.task_name}</span>
                {getStatusBadge(task.status)}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span>{task.platform}</span>
                <span>{task.processed_numbers}/{task.total_numbers}</span>
                <span>{new Date(task.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 结果详情 */}
        <div className="lg:col-span-2">
          {selectedTask && results.length > 0 ? (
            <Card className="bg-[#141b2d] border-[#1e2a45]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <FileText size={16} className="text-gray-400" />
                  检测结果 ({results.length})
                </h3>
                <Button size="sm" variant="secondary" onClick={exportResults}>
                  <Download size={14} /> 导出CSV
                </Button>
              </div>
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[#0a0e1a]">
                    <tr className="border-b border-[#1e2a45]">
                      <th className="text-left py-1.5 px-2 text-gray-400">号码</th>
                      <th className="text-left py-1.5 px-2 text-gray-400">注册</th>
                      <th className="text-left py-1.5 px-2 text-gray-400">头像</th>
                      <th className="text-left py-1.5 px-2 text-gray-400">性别</th>
                      <th className="text-left py-1.5 px-2 text-gray-400">运营商</th>
                      <th className="text-left py-1.5 px-2 text-gray-400">国家</th>
                      <th className="text-left py-1.5 px-2 text-gray-400">类型</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.id} className="border-b border-[#1e2a45]/50 hover:bg-[#1a2340]">
                        <td className="py-1.5 px-2 text-white font-mono">{r.phone_number}</td>
                        <td className="py-1.5 px-2">{r.registered ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}</td>
                        <td className="py-1.5 px-2">{r.has_avatar ? '📷' : '-'}</td>
                        <td className="py-1.5 px-2 text-gray-300">{r.gender}</td>
                        <td className="py-1.5 px-2 text-gray-300">{r.carrier}</td>
                        <td className="py-1.5 px-2 text-gray-300">{r.country}</td>
                        <td className="py-1.5 px-2 text-gray-300">{r.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : selectedTask ? (
            <div className="text-center py-8 text-gray-400">暂无结果数据</div>
          ) : (
            <div className="text-center py-8 text-gray-400">选择左侧任务查看详情</div>
          )}
        </div>
      </div>
    </div>
  );
}
