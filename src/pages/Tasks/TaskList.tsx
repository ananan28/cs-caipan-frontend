import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Save, X, Trash2, Eye, EyeOff } from 'lucide-react';

const initialFeatures = [
  { id: '1', name: 'WhatsApp 检测', icon: '📱', path: '/detect/whatsapp', description: '检测号码是否注册WhatsApp、是否有头像', category: '即时通讯', price: 0.115, isActive: true },
  { id: '2', name: 'WhatsApp 高级检测', icon: '💎', path: '/detect/whatsapp-advanced', description: '检测注册状态、头像、头像性别识别', category: '即时通讯', price: 6.429, isActive: true },
  { id: '3', name: 'Telegram 检测', icon: '✈️', path: '/detect/telegram', description: '检测号码是否注册Telegram、是否有头像', category: '即时通讯', price: 4.286, isActive: true },
  { id: '4', name: 'Signal 检测', icon: '🔒', path: '/detect/signal', description: '检测号码是否注册Signal', category: '即时通讯', price: 0, isActive: true },
  { id: '5', name: 'LINE 检测', icon: '💬', path: '/detect/line', description: '检测号码是否注册LINE', category: '即时通讯', price: 0, isActive: true },
  { id: '6', name: 'Viber 检测', icon: '📞', path: '/detect/viber', description: '检测号码是否注册Viber', category: '即时通讯', price: 1.429, isActive: true },
  { id: '7', name: 'Zalo 检测', icon: '🇻🇳', path: '/detect/zalo', description: '检测号码是否注册Zalo', category: '即时通讯', price: 2.143, isActive: true },
  { id: '8', name: 'Zalo 高级检测', icon: '👑', path: '/detect/zalo-advanced', description: 'Zalo深度信息检测', category: '即时通讯', price: 11.429, isActive: true },
  { id: '9', name: 'Facebook 检测', icon: '👍', path: '/detect/facebook', description: '检测Facebook账号状态', category: '社交媒体', price: 0.714, isActive: true },
  { id: '10', name: 'Facebook 邮件检测', icon: '📧', path: '/detect/facebook-email', description: '检测Facebook邮件状态', category: '社交媒体', price: 0.714, isActive: true },
  { id: '11', name: 'iOS 检测', icon: '🍎', path: '/detect/ios', description: '检测iOS状态', category: '其他', price: 2.857, isActive: true },
  { id: '12', name: 'RCS 检测', icon: '📨', path: '/detect/rcs', description: '检测RCS状态', category: '其他', price: 2.143, isActive: true },
  { id: '13', name: '线路检测', icon: '🔌', path: '/detect/line-status', description: '检测线路状态', category: '其他', price: 6.429, isActive: true },
  { id: '14', name: '号码归属检测', icon: '🌍', path: '/detect/number-lookup', description: '检测号码国家/运营商/虚拟号码', category: '其他', price: 0, isActive: true },
];

export function TaskList() {
  const navigate = useNavigate();
  const [features, setFeatures] = useState(initialFeatures);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);

  const startEdit = (id: string) => {
    const feature = features.find(f => f.id === id);
    if (feature) {
      setEditingId(id);
      setEditData({ ...feature });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const saveEdit = () => {
    if (editData) {
      setFeatures(features.map(f => f.id === editData.id ? editData : f));
      setEditingId(null);
      setEditData(null);
      alert(`✅ 已更新「${editData.name}」`);
    }
  };

  const handleChange = (field: string, value: any) => {
    setEditData({ ...editData, [field]: value });
  };

  const toggleActive = (id: string) => {
    setFeatures(features.map(f => {
      if (f.id === id) {
        const newStatus = !f.isActive;
        alert(newStatus ? `✅「${f.name}」已上架` : `📴「${f.name}」已下架`);
        return { ...f, isActive: newStatus };
      }
      return f;
    }));
  };

  const deleteFeature = (id: string) => {
    const feature = features.find(f => f.id === id);
    if (!feature) return;
    if (confirm(`⚠️ 确定要删除「${feature.name}」吗？`)) {
      setFeatures(features.map(f => {
        if (f.id === id) {
          return { ...f, isDeleted: true, isActive: false };
        }
        return f;
      }));
      alert(`🗑️「${feature.name}」已移至回收站`);
    }
  };

  const visibleFeatures = features.filter(f => !f.isDeleted);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            功能中心
            <span className="text-xs text-gray-500 font-normal">(所有者管理)</span>
          </h1>
          <p className="text-gray-400 text-xs">✏️编辑 · 👁️上架/下架 · 🗑️删除 · 点击卡片进入</p>
        </div>
        <div className="text-sm text-gray-400">{visibleFeatures.length} 个服务</div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {visibleFeatures.map((item) => {
          const isEditing = editingId === item.id;
          const data = isEditing ? editData : item;
          const isActive = item.isActive !== false;

          return (
            <div
              key={item.id}
              onClick={() => {
                if (!isEditing && isActive) {
                  navigate(item.path);
                }
              }}
              className={`bg-[#141b2d] border rounded-xl p-3 transition-all cursor-pointer ${
                isEditing 
                  ? 'border-blue-500/50 ring-1 ring-blue-500/30 cursor-default' 
                  : isActive 
                    ? 'border-[#1e2a45] hover:border-blue-500/50 hover:bg-[#1a2340]' 
                    : 'border-[#1e2a45] opacity-50 cursor-not-allowed'
              }`}
            >
              {isEditing ? (
                <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                  <input value={data.icon} onChange={(e) => handleChange('icon', e.target.value)} className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded px-2 py-1 text-white text-sm" />
                  <input value={data.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded px-2 py-1 text-white text-sm" />
                  <input value={data.description} onChange={(e) => handleChange('description', e.target.value)} className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded px-2 py-1 text-gray-300 text-xs" />
                  <div className="flex items-center gap-2">
                    <input type="number" step="0.001" value={data.price} onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)} className="w-20 bg-[#0a0e1a] border border-[#1e2a45] rounded px-2 py-1 text-amber-500 text-xs" />
                    <span className="text-gray-400 text-xs">积分/万次</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={saveEdit} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-1.5 rounded flex items-center justify-center gap-1">
                      <Save size={14} /> 保存
                    </button>
                    <button onClick={cancelEdit} className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm py-1.5 rounded flex items-center justify-center gap-1">
                      <X size={14} /> 取消
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="text-3xl">{item.icon}</div>
                    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleActive(item.id)}
                        className={`p-1 rounded hover:bg-blue-500/10 transition ${isActive ? 'text-green-500' : 'text-gray-500'}`}
                        title={isActive ? '下架' : '上架'}
                      >
                        {isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button
                        onClick={() => startEdit(item.id)}
                        className="p-1 rounded hover:bg-blue-500/10 text-gray-500 hover:text-blue-400 transition"
                        title="编辑"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => deleteFeature(item.id)}
                        className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition"
                        title="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-white font-semibold text-sm mt-1">{item.name}</h3>
                  <p className="text-gray-400 text-xs mt-0.5 leading-tight line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1e2a45]">
                    <span className="text-amber-500 text-xs font-medium">{item.price} 积分/万次</span>
                    <span className={`text-xs ${isActive ? 'text-blue-400' : 'text-gray-500'}`}>
                      {isActive ? '进入 →' : '已下架'}
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {visibleFeatures.length === 0 && (
        <div className="text-center py-12 text-gray-400">暂无可用服务</div>
      )}
    </div>
  );
}
