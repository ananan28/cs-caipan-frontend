import { Card } from '../../components/UI/Card';
import { Crown, Shield, Sparkles, Gift } from 'lucide-react';

export function VIPCenter() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Crown className="text-yellow-500" size={28} />
            VIP 会员中心
          </h1>
          <p className="text-gray-400">享受专属特权与优惠</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-primary-400 bg-primary-500/10 px-4 py-2 rounded-full border border-primary-500/20">
          <Sparkles size={16} /> 累计消费: 0 积分
        </div>
      </div>

      <Card className="bg-gradient-to-r from-cs-card to-cs-dark border-2 border-yellow-500/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-5xl">⭐</div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-400">普通会员</h2>
                <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">Lv.0</span>
              </div>
              <p className="text-gray-400 text-sm flex items-center gap-2">
                <Shield size={14} /> 折扣: 0% <span className="text-gray-600 mx-1">|</span>
                <Gift size={14} /> 积分: 0
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">当前等级权益</p>
            <div className="flex items-center gap-1 text-xs text-gray-300">
              <span className="bg-primary-900/30 px-2 py-0.5 rounded-full">基础功能</span>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-cs-border">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-gray-400">升级进度</span>
            <span className="text-gray-300">0 / 1000 积分</span>
          </div>
          <div className="w-full h-2 bg-cs-dark rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-yellow-500 transition-all duration-1000" style={{ width: '0%' }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">🎯 再消费 1000 积分即可升级为 白银会员</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '💰', label: '消费折扣', value: '0%', desc: '任务消费享折扣' },
          { icon: '⚡', label: '优先队列', value: '✓', desc: '任务优先处理' },
          { icon: '🎯', label: '专属功能', value: '✗', desc: '高级功能开放' },
          { icon: '👨‍💼', label: '专属客服', value: '✗', desc: '24/7 专属支持' },
        ].map((item, i) => (
          <Card key={i} className="bg-cs-card border-cs-border hover:border-primary-500/30 transition-all">
            <div className="text-center">
              <div className="text-3xl mb-2">{item.icon}</div>
              <p className="text-white font-medium">{item.label}</p>
              <p className={`text-xl font-bold ${item.value === '✓' ? 'text-green-500' : item.value === '✗' ? 'text-gray-500' : 'text-primary-400'}`}>
                {item.value}
              </p>
              <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
