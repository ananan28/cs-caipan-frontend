import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { ShoppingCart, Clock, RefreshCw, Gift } from 'lucide-react';

type Package = {
  id: string;
  name: string;
  price: number;
  points: number;
  bonus: number;
  is_active: boolean;
  description: string;
};

type Order = {
  id: string;
  package_name: string;
  amount: number;
  points: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
};

export function PurchasePackage() {
  const { user } = useAuthStore();
  const [packages, setPackages] = useState<Package[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pkgRes, orderRes] = await Promise.all([
        supabase.from('packages').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('package_orders').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(10),
      ]);
      if (pkgRes.data) setPackages(pkgRes.data);
      if (orderRes.data) setOrders(orderRes.data);
    } catch (error) {
      console.error('Fetch data error:', error);
      setPackages([
        { id: '1', name: '基础包', price: 10, points: 100, bonus: 0, is_active: true, description: '100积分' },
        { id: '2', name: '进阶包', price: 50, points: 550, bonus: 50, is_active: true, description: '550积分 + 50赠送' },
        { id: '3', name: '高级包', price: 100, points: 1200, bonus: 200, is_active: true, description: '1200积分 + 200赠送' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: Package) => {
    if (!confirm(`确认购买「${pkg.name}」？\n价格: $${pkg.price}\n获得: ${pkg.points} 积分${pkg.bonus > 0 ? ` + ${pkg.bonus} 赠送` : ''}`)) return;
    setProcessing(pkg.id);

    try {
      const { data: order, error: orderError } = await supabase
        .from('package_orders')
        .insert({
          user_id: user?.id,
          package_id: pkg.id,
          package_name: pkg.name,
          amount: pkg.price,
          points: pkg.points + pkg.bonus,
          status: 'completed',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const { data: account } = await supabase
        .from('points_accounts')
        .select('id, balance')
        .eq('user_id', user?.id)
        .single();

      if (account) {
        const totalPoints = pkg.points + pkg.bonus;
        const newBalance = account.balance + totalPoints;
        await supabase
          .from('points_accounts')
          .update({ balance: newBalance })
          .eq('user_id', user?.id);

        await supabase
          .from('points_ledger')
          .insert({
            user_id: user?.id,
            account_id: account.id,
            amount: totalPoints,
            balance_after: newBalance,
            type: 'recharge',
            ref_type: 'package',
            ref_id: order.id,
            description: `购买套餐「${pkg.name}」获得 ${totalPoints} 积分`,
          });
      }

      alert(`✅ 购买成功！获得 ${pkg.points + pkg.bonus} 积分`);
      fetchData();
    } catch (error: any) {
      alert('购买失败：' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="text-primary-500" size={28} />
            购买套餐
          </h1>
          <p className="text-gray-400 text-sm">选择套餐购买积分</p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchData}><RefreshCw size={16} /> 刷新</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="bg-[#141b2d] border-[#1e2a45] hover:border-amber-500/30 transition p-4 text-center">
            <div className="text-4xl mb-2">🎁</div>
            <h3 className="text-white font-bold text-lg">{pkg.name}</h3>
            <p className="text-amber-500 text-2xl font-bold mt-1">${pkg.price}</p>
            <p className="text-gray-400 text-sm mt-2">{pkg.points} 积分</p>
            {pkg.bonus > 0 && <p className="text-green-500 text-sm">+{pkg.bonus} 赠送</p>}
            <p className="text-gray-500 text-xs mt-1">{pkg.description}</p>
            <Button className="mt-3 w-full" onClick={() => handlePurchase(pkg)} loading={processing === pkg.id}>
              <ShoppingCart size={16} /> 立即购买
            </Button>
          </Card>
        ))}
      </div>

      <Card className="bg-[#141b2d] border-[#1e2a45]">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          购买记录
        </h3>
        {orders.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">暂无购买记录</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-2 bg-[#0a0e1a] rounded-lg">
                <div>
                  <span className="text-white text-sm">{order.package_name}</span>
                  <p className="text-gray-500 text-xs">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-amber-500 text-sm font-medium">${order.amount}</span>
                  <p className="text-green-500 text-xs">+{order.points} 积分</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
