import { useState, useEffect } from 'react';
import { supabase } from '../../../api/supabase';
import { Card } from '../../../components/UI/Card';
import { Button } from '../../../components/UI/Button';
import { Percent, Save, RefreshCw, Edit, X } from 'lucide-react';

type FeeSettings = {
  id: number;
  enabled: boolean;
  transfer_rate: number;
  recycle_rate: number;
  min_fee: number;
  max_fee: number;
  payer: 'sender' | 'receiver' | 'shared' | 'platform';
};

export function FeeManager() {
  const [settings, setSettings] = useState<FeeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<FeeSettings | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fee_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setSettings(data);
        setFormData(data);
      } else {
        // 如果没有数据，创建默认
        const { data: newData, error: insertError } = await supabase
          .from('fee_settings')
          .insert({
            enabled: true,
            transfer_rate: 0.1,
            recycle_rate: 0.1,
            min_fee: 0,
            max_fee: 999999,
            payer: 'receiver',
          })
          .select()
          .single();
        if (insertError) throw insertError;
        setSettings(newData);
        setFormData(newData);
      }
    } catch (error) {
      console.error('Fetch fee settings error:', error);
      // 使用默认值
      const defaultData: FeeSettings = {
        id: 1,
        enabled: true,
        transfer_rate: 0.1,
        recycle_rate: 0.1,
        min_fee: 0,
        max_fee: 999999,
        payer: 'receiver',
      };
      setSettings(defaultData);
      setFormData(defaultData);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!formData) return;
    try {
      await supabase
        .from('fee_settings')
        .upsert({
          id: formData.id || 1,
          enabled: formData.enabled,
          transfer_rate: formData.transfer_rate,
          recycle_rate: formData.recycle_rate,
          min_fee: formData.min_fee,
          max_fee: formData.max_fee,
          payer: formData.payer,
          updated_at: new Date().toISOString(),
        })
        .eq('id', formData.id || 1);
      alert('✅ 手续费设置已保存');
      setEditing(false);
      fetchSettings();
    } catch (error: any) {
      alert('保存失败：' + error.message);
    }
  };

  const payerLabels = {
    sender: '发送方承担',
    receiver: '接收方承担',
    shared: '双方分摊',
    platform: '平台承担',
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400">加载中...</div>;
  }

  const data = editing ? formData : settings;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Percent className="text-amber-500" size={28} />
            手续费管理
          </h1>
          <p className="text-gray-400 text-sm">管理积分转账/回收的费率</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={fetchSettings}>
            <RefreshCw size={16} />
          </Button>
          {!editing && (
            <Button size="sm" onClick={() => { setEditing(true); setFormData(settings ? { ...settings } : null); }}>
              <Edit size={16} /> 编辑
            </Button>
          )}
        </div>
      </div>

      {data && (
        <Card className="bg-[#141b2d] border-[#1e2a45] p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm">手续费开关</span>
              <button
                onClick={() => {
                  if (editing && formData) {
                    setFormData({ ...formData, enabled: !formData.enabled });
                  }
                }}
                className={`w-12 h-6 rounded-full transition ${editing && formData?.enabled ? 'bg-green-500' : editing && !formData?.enabled ? 'bg-gray-500' : data.enabled ? 'bg-green-500' : 'bg-gray-500'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition transform ${editing ? (formData?.enabled ? 'translate-x-6' : 'translate-x-0.5') : (data.enabled ? 'translate-x-6' : 'translate-x-0.5')}`} />
              </button>
              <span className={`text-sm ${editing ? (formData?.enabled ? 'text-green-500' : 'text-red-500') : (data.enabled ? 'text-green-500' : 'text-red-500')}`}>
                {editing ? (formData?.enabled ? '已启用' : '已关闭') : (data.enabled ? '已启用' : '已关闭')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm">转账费率 (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={data.transfer_rate || 0}
                  disabled={!editing}
                  onChange={(e) => editing && formData && setFormData({ ...formData, transfer_rate: parseFloat(e.target.value) || 0 })}
                  className={`w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm ${!editing ? 'opacity-60' : 'focus:border-primary-500'}`}
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm">回收费率 (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={data.recycle_rate || 0}
                  disabled={!editing}
                  onChange={(e) => editing && formData && setFormData({ ...formData, recycle_rate: parseFloat(e.target.value) || 0 })}
                  className={`w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm ${!editing ? 'opacity-60' : 'focus:border-primary-500'}`}
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm">最低手续费</label>
                <input
                  type="number"
                  step="0.01"
                  value={data.min_fee || 0}
                  disabled={!editing}
                  onChange={(e) => editing && formData && setFormData({ ...formData, min_fee: parseFloat(e.target.value) || 0 })}
                  className={`w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm ${!editing ? 'opacity-60' : 'focus:border-primary-500'}`}
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm">最高手续费</label>
                <input
                  type="number"
                  step="0.01"
                  value={data.max_fee || 0}
                  disabled={!editing}
                  onChange={(e) => editing && formData && setFormData({ ...formData, max_fee: parseFloat(e.target.value) || 0 })}
                  className={`w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm ${!editing ? 'opacity-60' : 'focus:border-primary-500'}`}
                />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-sm">手续费承担方</label>
              <select
                value={data.payer || 'receiver'}
                disabled={!editing}
                onChange={(e) => editing && formData && setFormData({ ...formData, payer: e.target.value as any })}
                className={`w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm ${!editing ? 'opacity-60' : 'focus:border-primary-500'}`}
              >
                <option value="sender">发送方承担</option>
                <option value="receiver">接收方承担</option>
                <option value="shared">双方分摊</option>
                <option value="platform">平台承担</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">当前：{payerLabels[data.payer || 'receiver']}</p>
            </div>

            {editing && (
              <div className="flex gap-2 mt-4">
                <Button onClick={saveSettings}>
                  <Save size={16} /> 保存
                </Button>
                <Button variant="secondary" onClick={() => { setEditing(false); setFormData(null); }}>
                  <X size={16} /> 取消
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
