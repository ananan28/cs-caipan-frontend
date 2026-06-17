import { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/UI/Card';
import { format } from 'date-fns';

type LedgerEntry = {
  id: number;
  amount: number;
  balance_after: number;
  type: string;
  description: string;
  created_at: string;
};

export function Ledger() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLedger();
  }, [user?.id]);

  const fetchLedger = async () => {
    try {
      const { data, error } = await supabase
        .from('ledger')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Fetch ledger error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">流水账本</h1><p className="text-gray-400">所有积分变动记录</p></div>
      <Card className="bg-cs-card border-cs-border">
        {loading ? <div className="text-center py-8 text-gray-400">加载中...</div> :
        entries.length === 0 ? <div className="text-center py-8 text-gray-400">暂无记录</div> :
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cs-border">
                <th className="text-left py-3 text-gray-400 font-medium">时间</th>
                <th className="text-left py-3 text-gray-400 font-medium">类型</th>
                <th className="text-left py-3 text-gray-400 font-medium">描述</th>
                <th className="text-right py-3 text-gray-400 font-medium">金额</th>
                <th className="text-right py-3 text-gray-400 font-medium">余额</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-cs-border/50">
                  <td className="py-3 text-gray-400 text-sm">{format(new Date(entry.created_at), 'yyyy-MM-dd HH:mm:ss')}</td>
                  <td className="py-3 text-gray-400 text-sm">{entry.type}</td>
                  <td className="py-3 text-white text-sm">{entry.description}</td>
                  <td className={`py-3 text-right text-sm ${entry.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>{entry.amount >= 0 ? '+' : ''}{entry.amount.toFixed(2)}</td>
                  <td className="py-3 text-right text-white text-sm">{entry.balance_after.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </Card>
    </div>
  );
}
