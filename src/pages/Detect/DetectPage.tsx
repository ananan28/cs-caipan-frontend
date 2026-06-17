import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

// 功能映射
const featureMap: Record<string, any> = {
  'whatsapp': { name: 'WhatsApp 检测', icon: '📱', color: 'text-green-500' },
  'whatsapp-advanced': { name: 'WhatsApp 高级检测', icon: '💎', color: 'text-purple-500' },
  'telegram': { name: 'Telegram 检测', icon: '✈️', color: 'text-blue-500' },
  'signal': { name: 'Signal 检测', icon: '🔒', color: 'text-blue-400' },
  'line': { name: 'LINE 检测', icon: '💬', color: 'text-green-400' },
  'viber': { name: 'Viber 检测', icon: '📞', color: 'text-purple-400' },
  'zalo': { name: 'Zalo 检测', icon: '🇻🇳', color: 'text-red-400' },
  'zalo-advanced': { name: 'Zalo 高级检测', icon: '👑', color: 'text-yellow-500' },
  'facebook': { name: 'Facebook 检测', icon: '👍', color: 'text-blue-600' },
  'facebook-email': { name: 'Facebook 邮件检测', icon: '📧', color: 'text-blue-400' },
  'ios': { name: 'iOS 检测', icon: '🍎', color: 'text-gray-400' },
  'rcs': { name: 'RCS 检测', icon: '📨', color: 'text-cyan-400' },
  'line-status': { name: '线路检测', icon: '🔌', color: 'text-yellow-400' },
  'number-lookup': { name: '号码归属检测', icon: '🌍', color: 'text-green-400' },
};

export function DetectPage() {
  const { platform } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [numbers, setNumbers] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [exportFormat, setExportFormat] = useState('csv');

  const feature = featureMap[platform || ''] || { name: '检测', icon: '📱', color: 'text-blue-500' };

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let extractedNumbers: string[] = [];

        if (file.name.endsWith('.txt')) {
          const text = e.target?.result as string;
          extractedNumbers = text.split('\n').filter(n => n.trim());
        } else if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          jsonData.forEach((row: any) => {
            if (Array.isArray(row)) {
              row.forEach((cell: any) => {
                if (cell && typeof cell === 'string' && cell.match(/^\+?[0-9]{10,15}$/)) {
                  extractedNumbers.push(cell);
                } else if (typeof cell === 'number') {
                  const numStr = cell.toString();
                  if (numStr.match(/^\+?[0-9]{10,15}$/)) {
                    extractedNumbers.push(numStr);
                  }
                }
              });
            }
          });
        }

        extractedNumbers = [...new Set(extractedNumbers)];
        setNumbers(extractedNumbers.join('\n'));
        alert(`✅ 成功提取 ${extractedNumbers.length} 个号码`);
      } catch (error) {
        alert('文件解析失败，请检查文件格式');
      }
    };

    if (file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDetect = async () => {
    const phoneList = numbers.split('\n').filter(n => n.trim());
    if (phoneList.length === 0) {
      alert('请至少输入一个号码或上传文件');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const mockResults = phoneList.map((phone, i) => ({
        id: i + 1,
        phone: phone.trim(),
        registered: Math.random() > 0.4,
        hasAvatar: Math.random() > 0.6,
        gender: ['男性', '女性', '未知'][Math.floor(Math.random() * 3)],
        carrier: ['中国移动', '中国联通', '中国电信', 'AT&T', 'Verizon', 'T-Mobile'][Math.floor(Math.random() * 6)],
        country: ['中国', '美国', '英国', '加拿大', '澳大利亚'][Math.floor(Math.random() * 5)],
        state: ['北京', '上海', '广州', '纽约', '伦敦', '悉尼'][Math.floor(Math.random() * 6)],
        type: Math.random() > 0.7 ? '虚拟号码' : '固定号码',
      }));
      setResults(mockResults);
      setLoading(false);
    }, 1500);
  };

  // 导出结果 - 支持多种格式
  const exportResults = async () => {
    if (results.length === 0) {
      alert('没有结果可导出');
      return;
    }

    const headers = ['号码', '注册状态', '头像', '性别', '运营商', '国家', '州', '类型'];
    const rows = results.map(r => [
      r.phone,
      r.registered ? '已注册' : '未注册',
      r.hasAvatar ? '有头像' : '无头像',
      r.gender,
      r.carrier,
      r.country,
      r.state,
      r.type,
    ]);

    const filename = `检测结果_${new Date().toISOString().slice(0,10)}`;

    try {
      switch (exportFormat) {
        case 'csv': {
          let csv = headers.join(',') + '\n';
          rows.forEach(row => {
            csv += row.join(',') + '\n';
          });
          const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
          downloadBlob(blob, `${filename}.csv`);
          break;
        }

        case 'xlsx': {
          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
          XLSX.utils.book_append_sheet(wb, ws, '检测结果');
          const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          downloadBlob(new Blob([wbout], { type: 'application/octet-stream' }), `${filename}.xlsx`);
          break;
        }

        case 'txt': {
          let txt = '号码\t注册状态\t头像\t性别\t运营商\t国家\t州\t类型\n';
          rows.forEach(row => {
            txt += row.join('\t') + '\n';
          });
          const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
          downloadBlob(blob, `${filename}.txt`);
          break;
        }

        case 'json': {
          const json = JSON.stringify(results, null, 2);
          const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
          downloadBlob(blob, `${filename}.json`);
          break;
        }

        case 'zip': {
          const zip = new JSZip();
          let csv = headers.join(',') + '\n';
          rows.forEach(row => { csv += row.join(',') + '\n'; });
          zip.file(`${filename}.csv`, csv);

          let txt = '号码\t注册状态\t头像\t性别\t运营商\t国家\t州\t类型\n';
          rows.forEach(row => { txt += row.join('\t') + '\n'; });
          zip.file(`${filename}.txt`, txt);

          zip.file(`${filename}.json`, JSON.stringify(results, null, 2));

          const content = await zip.generateAsync({ type: 'blob' });
          downloadBlob(content, `${filename}.zip`);
          break;
        }

        default:
          alert('不支持的格式');
      }
    } catch (error) {
      alert('导出失败：' + error);
    }
  };

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const phoneCount = numbers.split('\n').filter(n => n.trim()).length;

  return (
    <div className="p-4 space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.csv,.xlsx,.xls"
        onChange={handleFileUpload}
        className="hidden"
      />

      <button onClick={() => navigate('/tasks')} className="text-gray-400 hover:text-white text-sm flex items-center gap-1">
        ← 返回功能中心
      </button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{feature.icon}</span>
          <div>
            <h1 className={`text-2xl font-bold ${feature.color}`}>{feature.name}</h1>
            <p className="text-gray-400 text-sm">输入号码或上传文件进行检测</p>
          </div>
        </div>
        {fileName && (
          <span className="text-xs text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
            📎 {fileName}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-[#141b2d] border-[#1e2a45] lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">📝 输入号码</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={triggerFileUpload}>
                📤 上传文件
              </Button>
              <Button size="sm" variant="secondary" onClick={() => { setNumbers(''); setFileName(''); }}>
                🗑️ 清空
              </Button>
            </div>
          </div>
          <textarea
            value={numbers}
            onChange={(e) => setNumbers(e.target.value)}
            placeholder="每行一个号码&#10;+8613800138000&#10;+8613900139000&#10;或点击「上传文件」导入"
            className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-3 text-white text-sm h-40 focus:outline-none focus:border-blue-500"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-400">
              已输入 {phoneCount} 个号码
              {fileName && <span className="ml-2 text-green-500"> | 📎 {fileName}</span>}
            </span>
            <Button onClick={handleDetect} loading={loading}>
              🚀 开始检测
            </Button>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            支持格式：TXT、CSV、XLSX、XLS（自动识别号码列）
          </div>
        </Card>

        <Card className="bg-[#141b2d] border-[#1e2a45]">
          <h3 className="text-white font-semibold mb-3">📊 统计</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">总数</span><span className="text-white">{results.length}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">已注册</span><span className="text-green-500">{results.filter(r => r.registered).length}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">未注册</span><span className="text-red-500">{results.filter(r => !r.registered).length}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">有头像</span><span className="text-blue-500">{results.filter(r => r.hasAvatar).length}</span></div>
          </div>

          {results.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="flex-1 bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel (XLSX)</option>
                  <option value="txt">TXT</option>
                  <option value="json">JSON</option>
                  <option value="zip">ZIP (全部)</option>
                </select>
                <button
                  onClick={exportResults}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-lg transition whitespace-nowrap"
                >
                  📥 下载
                </button>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span>支持导出：CSV、Excel、TXT、JSON、ZIP</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {results.length > 0 && (
        <Card className="bg-[#141b2d] border-[#1e2a45]">
          <h3 className="text-white font-semibold mb-3">📋 检测结果 ({results.length})</h3>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#141b2d]">
                <tr className="border-b border-[#1e2a45]">
                  <th className="text-left py-2 text-gray-400">号码</th>
                  <th className="text-left py-2 text-gray-400">注册</th>
                  <th className="text-left py-2 text-gray-400">头像</th>
                  <th className="text-left py-2 text-gray-400">性别</th>
                  <th className="text-left py-2 text-gray-400">运营商</th>
                  <th className="text-left py-2 text-gray-400">国家</th>
                  <th className="text-left py-2 text-gray-400">类型</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b border-[#1e2a45]/50">
                    <td className="py-2 text-white">{r.phone}</td>
                    <td className="py-2">{r.registered ? <span className="text-green-500">✅</span> : <span className="text-red-500">❌</span>}</td>
                    <td className="py-2">{r.hasAvatar ? <span className="text-blue-500">📷</span> : <span className="text-gray-500">-</span>}</td>
                    <td className="py-2 text-gray-300">{r.gender}</td>
                    <td className="py-2 text-gray-300">{r.carrier}</td>
                    <td className="py-2 text-gray-300">{r.country}</td>
                    <td className="py-2 text-gray-300">{r.type}</td>
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
