import { useState } from 'react';
import { Card } from '../../../components/UI/Card';
import { Button } from '../../../components/UI/Button';
import { Shield, Power, RefreshCw, Database, FileCode, Download, Clock, AlertTriangle } from 'lucide-react';

export function SystemMaintenance() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [backupRunning, setBackupRunning] = useState(false);
  const [backupHistory, setBackupHistory] = useState([
    { id: 1, name: 'backup_20240115.sql', size: '2.3 MB', time: '2024-01-15 03:00:00' },
    { id: 2, name: 'backup_20240114.sql', size: '2.1 MB', time: '2024-01-14 03:00:00' },
    { id: 3, name: 'backup_20240113.sql', size: '2.0 MB', time: '2024-01-13 03:00:00' },
  ]);

  const toggleMaintenance = () => {
    if (!maintenanceMode) {
      if (!confirm('开启维护模式后，所有用户将无法访问系统。确定开启吗？')) return;
    } else {
      if (!confirm('关闭维护模式，系统恢复正常访问。确定关闭吗？')) return;
    }
    setMaintenanceMode(!maintenanceMode);
    alert(maintenanceMode ? '✅ 维护模式已关闭' : '🔧 维护模式已开启');
  };

  const runBackup = () => {
    if (!confirm('执行数据库备份？')) return;
    setBackupRunning(true);
    setTimeout(() => {
      setBackupRunning(false);
      alert('✅ 备份完成：backup_' + new Date().toISOString().slice(0,10) + '.sql');
      setBackupHistory([
        { id: Date.now(), name: `backup_${new Date().toISOString().slice(0,10)}.sql`, size: '2.3 MB', time: new Date().toISOString().replace('T', ' ').slice(0,19) },
        ...backupHistory,
      ]);
    }, 2000);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-primary-500" size={28} />
            系统维护
          </h1>
          <p className="text-gray-400 text-sm">维护模式 · 数据备份 · API文档</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 维护模式 */}
        <Card className="bg-[#141b2d] border-[#1e2a45]">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Power size={18} className={maintenanceMode ? 'text-red-500' : 'text-green-500'} />
            维护模式
          </h3>
          <div className={`p-3 rounded-lg ${maintenanceMode ? 'bg-red-500/20 border border-red-500/30' : 'bg-green-500/20 border border-green-500/30'}`}>
            <p className={`font-medium ${maintenanceMode ? 'text-red-400' : 'text-green-400'}`}>
              {maintenanceMode ? '🔴 维护模式已开启' : '🟢 系统运行正常'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {maintenanceMode ? '用户无法访问系统' : '所有用户可正常访问'}
            </p>
          </div>
          <Button onClick={toggleMaintenance} className="w-full mt-3" variant={maintenanceMode ? 'success' : 'danger'}>
            {maintenanceMode ? '关闭维护模式' : '开启维护模式'}
          </Button>
          {maintenanceMode && (
            <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-400 flex items-center gap-2">
              <AlertTriangle size={14} /> 维护期间所有操作将被暂停
            </div>
          )}
        </Card>

        {/* 数据备份 */}
        <Card className="bg-[#141b2d] border-[#1e2a45]">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Database size={18} className="text-blue-500" />
            数据备份
          </h3>
          <Button onClick={runBackup} loading={backupRunning} className="w-full">
            <Download size={16} /> 立即备份
          </Button>
          <div className="mt-3 max-h-32 overflow-y-auto space-y-1">
            {backupHistory.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-1.5 bg-[#0a0e1a] rounded text-xs">
                <span className="text-gray-300">{b.name}</span>
                <span className="text-gray-500">{b.size}</span>
                <span className="text-gray-500">{b.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* API文档 */}
      <Card className="bg-[#141b2d] border-[#1e2a45]">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <FileCode size={18} className="text-purple-500" />
          API文档
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            { method: 'GET', path: '/api/detect/whatsapp', desc: 'WhatsApp号码检测' },
            { method: 'GET', path: '/api/detect/telegram', desc: 'Telegram号码检测' },
            { method: 'GET', path: '/api/detect/signal', desc: 'Signal号码检测' },
            { method: 'POST', path: '/api/tasks', desc: '创建检测任务' },
            { method: 'GET', path: '/api/tasks/:id', desc: '查看任务详情' },
            { method: 'GET', path: '/api/wallet', desc: '获取钱包余额' },
          ].map((api, i) => (
            <div key={i} className="bg-[#0a0e1a] border border-[#1e2a45] rounded-lg p-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded ${api.method === 'GET' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {api.method}
                </span>
                <span className="text-white text-xs font-mono">{api.path}</span>
              </div>
              <p className="text-gray-500 text-xs mt-0.5">{api.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">📝 所有API需要Bearer Token认证</p>
      </Card>
    </div>
  );
}
