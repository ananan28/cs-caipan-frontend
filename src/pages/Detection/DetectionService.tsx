import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { 
  Phone, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Download,
  Eye,
  Trash2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

type DetectionResult = {
  id: number;
  phone_number: string;
  country_code: string;
  platform: string;
  registered: boolean;
  has_avatar: boolean;
  real_mobile: boolean;
  voip: boolean;
  carrier: string;
  processed_at: string;
};

type Task = {
  id: string;
  task_name: string;
  status: string;
  total_numbers: number;
  processed_numbers: number;
  created_at: string;
};

export function DetectionService() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [platform, setPlatform] = useState('whatsapp');
  const [stats, setStats] = useState({
    total: 0,
    registered: 0,
    notRegistered: 0,
    hasAvatar: 0,
    realMobile: 0,
    voip: 0,
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userData.user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Fetch tasks error:', error);
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
      updateStats(data || []);
    } catch (error) {
      console.error('Fetch results error:', error);
    }
  };

  const updateStats = (data: DetectionResult[]) => {
    setStats({
      total: data.length,
      registered: data.filter(r => r.registered).length,
      notRegistered: data.filter(r => !r.registered).length,
      hasAvatar: data.filter(r => r.has_avatar).length,
      realMobile: data.filter(r => r.real_mobile).length,
      voip: data.filter(r => r.voip).length,
    });
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTask(taskId);
    fetchResults(taskId);
  };

  const handleDetect = async () => {
    if (!phoneInput.trim()) {
      alert('请输入手机号');
      return;
    }

    const phones = phoneInput.split('\n').filter(p => p.trim());
    if (phones.length === 0) {
      alert('请输入有效的手机号');
      return;
    }

    setDetecting(true);
    try {
      // 1. 获取当前用户
      const { data: userData } = await supabase.auth.getUser();
      
      // 2. 创建任务
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          user_id: userData.user?.id,
          task_name: `检测任务_${new Date().toISOString().slice(0,10)}`,
          total_numbers: phones.length,
          status: 'processing',
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // 3. 模拟检测（实际调用接口）
      const results = phones.map(phone => ({
        task_id: task.id,
        phone_number: phone.trim(),
        country_code: '+86',
        platform: platform,
        registered: Math.random() > 0.5,
        has_avatar: Math.random() > 0.7,
        real_mobile: Math.random() > 0.3,
        voip: Math.random() > 0.8,
        carrier: ['中国移动', '中国联通', '中国电信', 'Unknown'][Math.floor(Math.random() * 4)],
      }));

      // 4. 保存结果
      const { error: insertError } = await supabase
        .from('detection_results')
        .insert(results);
      if (insertError) throw insertError;

      // 5. 更新任务状态
      await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          processed_numbers: phones.length 
        })
        .eq('id', task.id);

      alert(`✅ 检测完成！共 ${phones.length} 个号码`);
      fetchTasks();
      if (selectedTask) fetchResults(selectedTask);
      setPhoneInput('');
    } catch (error: any) {
      alert('检测失败：' + error.message);
    } finally {
      setDetecting(false);
    }
  };

  const exportResults = () => {
    if (results.length === 0) {
      alert('暂无结果可导出');
      return;
    }

    let csv = '手机号,平台,已注册,有头像,真实手机,VoIP,运营商\n';
    results.forEach(r => {
      csv += `${r.phone_number},${r.platform},${r.registered},${r.has_avatar},${r.real_mobile},${r.voip},${r.carrier}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `检测结果_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { label: '待处理', color: 'bg-yellow-500/20 text-yellow-400' },
      processing: { label: '处理中', color: 'bg-blue-500/20 text-blue-400' },
      completed: { label: '已完成', color: 'bg-green-500/20 text-green-500' },
      failed: { label: '失败', color: 'bg-red-500/20 text-red-500' },
    };
    const config = configs[status as keyof typeof configs] || configs.pending;
    return <span className={`text-xs px-2 py-1 rounded-full ${config.color}`}>{config.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Phone className="text-primary-500" size={28} />
            号码检测服务
          </h1>
          <p className="text-gray-400">上传号码或输入检测，支持 WhatsApp/Telegram</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="bg-cs-dark border border-cs-border rounded-lg px-4 py-2.5 text-white text-sm"
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="telegram">Telegram</option>
            <option value="signal">Signal</option>
          </select>
          <Button variant="secondary" onClick={fetchTasks}>
            <RefreshCw size={18} /> 刷新
          </Button>
        </div>
      </div>

      {/* 输入区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-cs-card border-cs-border lg:col-span-2">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Upload size={18} className="text-primary-500" />
            输入号码
          </h3>
          <textarea
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="每行一个号码，例如：&#10;+8613800138000&#10;+8613900139000&#10;+8613600136000"
            className="w-full bg-cs-dark border border-cs-border rounded-lg px-4 py-3 text-white text-sm h-32 placeholder-gray-500 focus:outline-none focus:border-primary-500"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-400">
              已输入 {phoneInput.split('\n').filter(p => p.trim()).length} 个号码
            </span>
            <Button onClick={handleDetect} loading={detecting}>
              <Phone size={18} /> 开始检测
            </Button>
          </div>
        </Card>

        <Card className="bg-cs-card border-cs-border">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-500" />
            统计概览
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">总数</span>
              <span className="text-white">{stats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">已注册</span>
              <span className="text-green-500">{stats.registered}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">未注册</span>
              <span className="text-red-500">{stats.notRegistered}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">有头像</span>
              <span className="text-blue-500">{stats.hasAvatar}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">真实手机</span>
              <span className="text-green-500">{stats.realMobile}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">VoIP</span>
              <span className="text-yellow-500">{stats.voip}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 历史任务 */}
      <Card className="bg-cs-card border-cs-border">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          📋 历史任务
        </h3>
        {loading ? (
          <div className="text-center py-4 text-gray-400">加载中...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-4 text-gray-400">暂无任务</div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between p-3 bg-cs-dark rounded-lg cursor-pointer hover:bg-cs-card transition-colors ${
                  selectedTask === task.id ? 'border border-primary-500/30' : ''
                }`}
                onClick={() => handleTaskClick(task.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  {selectedTask === task.id ? <ChevronDown size={16} className="text-primary-500" /> : <ChevronRight size={16} className="text-gray-500" />}
                  <div>
                    <p className="text-white text-sm">{task.task_name}</p>
                    <p className="text-gray-400 text-xs">
                      {task.total_numbers} 个号码 · {new Date(task.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(task.status)}
                  {task.status === 'completed' && (
                    <span className="text-xs text-green-500">{task.processed_numbers || task.total_numbers} 已处理</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 检测结果 */}
      {selectedTask && results.length > 0 && (
        <Card className="bg-cs-card border-cs-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              📊 检测结果
              <span className="text-xs text-gray-400">({results.length})</span>
            </h3>
            <Button size="sm" variant="secondary" onClick={exportResults}>
              <Download size={14} /> 导出 CSV
            </Button>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-cs-card">
                <tr className="border-b border-cs-border">
                  <th className="text-left py-2 text-gray-400 font-medium">手机号</th>
                  <th className="text-left py-2 text-gray-400 font-medium">平台</th>
                  <th className="text-left py-2 text-gray-400 font-medium">已注册</th>
                  <th className="text-left py-2 text-gray-400 font-medium">头像</th>
                  <th className="text-left py-2 text-gray-400 font-medium">真实手机</th>
                  <th className="text-left py-2 text-gray-400 font-medium">VoIP</th>
                  <th className="text-left py-2 text-gray-400 font-medium">运营商</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b border-cs-border/50 hover:bg-cs-card/50">
                    <td className="py-2 text-white">{r.phone_number}</td>
                    <td className="py-2 text-gray-400">{r.platform}</td>
                    <td className="py-2">
                      {r.registered ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
                    </td>
                    <td className="py-2">
                      {r.has_avatar ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
                    </td>
                    <td className="py-2">
                      {r.real_mobile ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
                    </td>
                    <td className="py-2">
                      {r.voip ? <CheckCircle size={16} className="text-yellow-500" /> : <XCircle size={16} className="text-red-500" />}
                    </td>
                    <td className="py-2 text-gray-400">{r.carrier || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
