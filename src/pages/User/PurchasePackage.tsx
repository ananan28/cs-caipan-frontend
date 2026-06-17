import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { ShoppingCart, Clock, RefreshCw, Gift, Wallet, Copy, Check, ExternalLink } from 'lucide-react';

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
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [address, setAddress] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
    generateAddress();
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

  const generateAddress = () => {
    const chars = '0123456789abcdef';
    let addr = '0x';
    for (let i = 0; i < 40; i++) {
      addr += chars[Math.floor(Math.random() * 16)];
    }
    setAddress(addr);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePurchaseClick = (pkg: Package) => {
    setSelectedPackage(pkg);
    generateAddress();
    setShowRechargeModal(true);
  };

  const handleConfirmRecharge = async () => {
    if (!selectedPackage) return;
    setShowRechargeModal(false);
    setProcessing(selectedPackage.id);

    try {
      // 记录充值申请（等待审核）
      const { data: topup, error: topupError } = await supabase
        .from('topup_requests')
        .insert({
          user_id: user?.id,
          amount: selectedPackage.price,
          currency: 'USDT',
          to_address: address,
          status: 'pending',
          note: `购买套餐「${selectedPackage.name}」- ${selectedPackage.price} USDT`,
        })
        .select()
        .single();

      if (topupError) throw topupError;

      // 创建工单
      await supabase
        .from('tickets')
        .insert({
          user_id: user?.id,
          title: `充值审核 - ${selectedPackage.price} USDT`,
          content: `用户 ${user?.email} 申请充值 ${selectedPackage.price} USDT 购买「${selectedPackage.name}」\n\n充值地址: ${address}\n\n请审核该充值申请。`,
          category: '充值',
          priority: 'high',
          status: 'open',
        });

      alert(`✅ 充值申请已提交！\n\n金额: ${selectedPackage.price} USDT\n套餐: ${selectedPackage.name}\n地址: ${address}\n\n请等待 GM 审核，审核通过后积分自动到账。`);
      fetchData();
    } catch (error: any) {
      alert('提交失败：' + error.message);
    } finally {
      setProcessing(null);
      setSelectedPackage(null);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* 充值弹窗 */}
      {showRechargeModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#141b2d] border border-amber-500/30 rounded-2xl p-6 max-w-md w-full">
            <div className="text-center">
              <Wallet className="mx-auto text-amber-500" size={48} />
              <h2 className="text-xl font-bold text-white mt-3">充值 USDT</h2>
              <p className="text-gray-400 mt-2 text-sm">
                购买 <span className="text-amber-500 font-bold">{selectedPackage.name}</span>
                <br />
                金额: <span className="text-amber-500 font-bold">${selectedPackage.price} USDT</span>
              </p>
              
              <div className="mt-4 p-3 bg-[#0a0e1a] rounded-lg border border-amber-500/20">
                <p className="text-gray-400 text-xs mb-1">💳 请转账到以下 USDT (TRC20) 地址：</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-white text-xs font-mono break-all bg-[#141b2d] p-2 rounded">
                    {address}
                  </code>
                  <button
                    onClick={copyAddress}
                    className="p-2 rounded hover:bg-blue-500/10 text-gray-400 hover:text-blue-400 transition flex-shrink-0"
                  >
                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>金额: {selectedPackage.price} USDT</span>
                  <span>获得: {selectedPackage.points + selectedPackage.bonus} 积分</span>
                </div>
              </div>

              <p className="text-gray-500 text-xs mt-2">⚠️ 请确认已转账后再点击「我已转账」</p>
              
              <div className="flex gap-3 mt-4">
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleConfirmRecharge}>
                  ✅ 我已转账
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => { setShowRechargeModal(false); setSelectedPackage(null); }}>
                  ❌ 取消
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="text-primary-500" size={28} />
            购买套餐
          </h1>
          <p className="text-gray-400 text-sm">选择套餐，生成充值地址，USDT 到账后自动获得积分</p>
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
            <Button className="mt-3 w-full" onClick={() => handlePurchaseClick(pkg)} loading={processing === pkg.id}>
              <Wallet size={16} /> 充值购买
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
