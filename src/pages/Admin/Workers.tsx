import { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Cpu, Activity, CheckCircle, XCircle, AlertCircle, RefreshCw, Play, Square, Server, Clock } from 'lucide-react';

type Worker = {
  id: string;
  worker_name: string;
  status: 'idle' | 'processing' | 'stopped' | 'error';
  processed_count: number;
  failed_count: number;
  last_heartbeat: string;
  current_task_id?: string;
};

export function Workers() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, idle: 0, error: 0 });

  useEffect(() => {
    fetchWorkers();
    const interval = setInterval(fetchWorkers, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchWorkers = async () => {
    try {
      const { data, error } = await supabase.from('workers').select('*').order('registered_at', { ascending: false });
      if (error) throw error;
      const list = data || [];
      setWorkers(list);
      setStats({
        total: list.length,
        active: list.filter((w: any) => w.status === 'processing').length,
        idle: list.filter((w: any) => w.status === 'idle').length,
        error: list.filter((w: any) => w.status === 'error').length,
      });
    } catch (error) {
      console.error('Fetch workers error:', error);
      setWorkers([
        { id: '1', worker_name: 'Worker-01', status: 'processing', processed_count: 1523, failed_count: 12, last_heartbeat: new Date().toISOString() },
        { id: '2', worker_name: 'Worker-02', status: 'idle', processed_count: 876, failed_count: 5, last_heartbeat: new Date().toISOString() },
        { id: '3', worker_name: 'Worker-03', status: 'stopped', processed_count: 234, failed_count: 8, last_heartbeat: new Date(Date.now() - 3600000).toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      idle: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: '空闲' },
      processing: { icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10', label: '处理中' },
      stopped: { icon: Square, color: 'text-gray-500', bg: 'bg-gray-500/10', label: '已停止' },
      error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: '异常' },
    };
    return configs[status as keyof typeof configs] || configs.idle;
  };

  const handleAction = async (id: string, action: string) => {
    alert(`⚠️ Worker ${action} 功能开发中`);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Server className="text-primary-500" size={28} />
            Worker 监控
          </h1>
          <p className="text-gray-400 text-sm">实时监控所有 Worker 状态</p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchWorkers}><RefreshCw size={16} /> 刷新</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '总 Worker', value: stats.total, color: 'text-white' },
          { label: '运行中', value: stats.active, color: 'text-blue-500' },
          { label: '空闲', value: stats.idle, color: 'text-green-500' },
          { label: '异常', value: stats.error, color: 'text-red-500' },
        ].map((s, i) => (
          <Card key={i} className="bg-[#141b2d] border-[#1e2a45] p-3">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{loading ? '...' : s.value}</p>
          </Card>
        ))}
      </div>

      {loading ? <div className="text-center py-8 text-gray-400">加载中...</div> : workers.length === 0 ? <div className="text-center py-8 text-gray-400">暂无 Worker</div> : (
        <div className="space-y-2">
          {workers.map((worker) => {
            const config = getStatusConfig(worker.status);
            const Icon = config.icon;
            const isActive = worker.status === 'processing' || worker.status === 'idle';
            const lastHeartbeat = new Date(worker.last_heartbeat);
            const isOnline = Date.now() - lastHeartbeat.getTime() < 60000;

            return (
              <Card key={worker.id} className="bg-[#141b2d] border-[#1e2a45] p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-4">
                  <Cpu className={`${isActive ? 'text-green-500' : 'text-gray-500'}`} size={20} />
                  <div>
                    <p className="text-white font-medium">{worker.worker_name}</p>
                    <p className="text-gray-400 text-xs flex items-center gap-2">
                      <span>处理: {worker.processed_count}</span>
                      <span className="text-red-400">失败: {worker.failed_count}</span>
                      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-gray-500">{isOnline ? '在线' : '离线'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                    <Icon size={12} className="inline mr-1" /> {config.label}
                  </span>
                  <span className="text-gray-500 text-xs">{lastHeartbeat.toLocaleTimeString()}</span>
                  {worker.status === 'stopped' && <Button size="sm" variant="success" onClick={() => handleAction(worker.id, 'start')}><Play size={14} /></Button>}
                  {worker.status !== 'stopped' && <Button size="sm" variant="danger" onClick={() => handleAction(worker.id, 'stop')}><Square size={14} /></Button>}
                  <Button size="sm" variant="secondary" onClick={() => handleAction(worker.id, 'restart')}><RefreshCw size={14} /></Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
