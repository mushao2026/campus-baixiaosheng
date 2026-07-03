import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RechargeModalProps {
  visible: boolean;
  onClose: () => void;
  onRecharged: () => void;
  token: string;
}

interface Package {
  id: string;
  name: string;
  amount: string;
  credits: number;
  desc: string;
  tag?: string;
  color?: string;
}

interface Order {
  id: number;
  orderNo: string;
  amount: number;
  credits: number;
  packageName: string;
}

type Step = 'select' | 'pay' | 'submit' | 'done';

const COLORS: Record<string, string> = {
  trial: '#6366f1',
  monthly: '#F7931E',
  semester: '#FF6B35',
};

const RechargeModal: React.FC<RechargeModalProps> = ({ visible, onClose, onRecharged, token }) => {
  const [step, setStep] = useState<Step>('select');
  const [selected, setSelected] = useState('monthly');
  const [packages, setPackages] = useState<Package[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [payerName, setPayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 加载套餐
  useEffect(() => {
    if (!visible) return;
    fetch('/api/payment/packages')
      .then(r => r.json())
      .then(d => {
        if (d.success) setPackages(d.packages);
      })
      .catch(() => {});
    // 重置状态
    setStep('select');
    setSelected('monthly');
    setOrder(null);
    setPayerName('');
    setError('');
  }, [visible]);

  // 创建订单
  const handleCreateOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packageId: selected }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
        setStep('pay');
      } else {
        setError(data.message || '创建订单失败');
      }
    } catch {
      setError('网络错误，请重试');
    }
    setLoading(false);
  };

  // 提交付款信息
  const handleSubmit = async () => {
    if (!payerName.trim()) {
      setError('请填写支付宝付款姓名');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payment/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: order?.id, payerName: payerName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('done');
      } else {
        setError(data.message || '提交失败');
      }
    } catch {
      setError('网络错误，请重试');
    }
    setLoading(false);
  };

  const handleClose = () => {
    if (step === 'done') onRecharged();
    onClose();
  };

  const selectedPkg = packages.find(p => p.id === selected);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <motion.div
            className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 z-10 max-h-[95vh] overflow-y-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />

            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>

            {error && (
              <div className="mb-3 p-2.5 bg-red-50 text-red-600 text-xs rounded-xl text-center">
                {error}
              </div>
            )}

            {/* Step 1: 选择套餐 */}
            {step === 'select' && (
              <>
                <h2 className="text-lg font-extrabold text-gray-800 text-center mb-4">
                  🪙 充值提问次数
                </h2>
                <div className="space-y-2 mb-4">
                  {packages.map(pkg => {
                    const color = COLORS[pkg.id] || '#FF6B35';
                    return (
                      <motion.div
                        key={pkg.id}
                        className={`relative p-4 rounded-2xl cursor-pointer border-2 transition-colors ${
                          selected === pkg.id ? 'border-[#FF6B35] bg-orange-50' : 'border-gray-100 bg-white'
                        }`}
                        onClick={() => setSelected(pkg.id)}
                        whileTap={{ scale: 0.97 }}
                      >
                        {pkg.tag && (
                          <span
                            className="absolute -top-2 right-3 text-xs text-white px-2.5 py-0.5 rounded-full font-bold"
                            style={{ background: color }}
                          >
                            {pkg.tag}
                          </span>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-gray-800 text-sm">{pkg.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{pkg.desc}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-extrabold" style={{ color }}>
                              {pkg.credits}<span className="text-xs font-medium text-gray-400"> 次</span>
                            </div>
                            <div className="text-lg font-bold text-gray-800">¥{pkg.amount}</div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <button
                  onClick={handleCreateOrder}
                  disabled={loading}
                  className="w-full h-12 rounded-2xl text-white font-bold text-sm disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}
                >
                  {loading ? '创建中...' : `确认支付 ¥${selectedPkg?.amount || ''}`}
                </button>
              </>
            )}

            {/* Step 2: 扫码支付 */}
            {step === 'pay' && order && (
              <>
                <h2 className="text-lg font-extrabold text-gray-800 text-center mb-1">
                  扫码支付
                </h2>
                <p className="text-sm text-gray-500 text-center mb-3">
                  {selectedPkg?.name} · <span className="text-[#FF6B35] font-bold">¥{selectedPkg?.amount}</span> · {selectedPkg?.credits}次
                </p>

                {/* 订单号 - 醒目提示 */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-center">
                  <div className="text-xs text-amber-600 mb-1">📋 转账时请备注以下订单号</div>
                  <div className="text-lg font-mono font-extrabold text-amber-800 tracking-wider">
                    {order.orderNo}
                  </div>
                </div>

                {/* 收款码 */}
                <div className="w-52 h-52 mx-auto mb-2 rounded-2xl overflow-hidden bg-white border-2 border-gray-100">
                  <img
                    src="/pay-qr.png"
                    alt="支付宝收款码"
                    className="w-full h-full object-contain"
                  />
                </div>

                <p className="text-xs text-gray-400 text-center mb-4">
                  支付宝扫码付款<br />
                  <span className="text-[#FF6B35]">⚠️ 请务必在备注中填写上方订单号</span>
                </p>

                {/* 操作按钮 */}
                <div className="space-y-2">
                  <button
                    onClick={() => setStep('submit')}
                    className="w-full h-12 rounded-2xl text-white font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                  >
                    我已付款，下一步 →
                  </button>
                  <button
                    onClick={() => { setStep('select'); setOrder(null); }}
                    className="w-full text-xs text-gray-400 py-2 hover:text-[#FF6B35] bg-transparent border-none cursor-pointer"
                  >
                    ← 返回选择套餐
                  </button>
                </div>
              </>
            )}

            {/* Step 3: 填写付款信息 */}
            {step === 'submit' && order && (
              <>
                <h2 className="text-lg font-extrabold text-gray-800 text-center mb-1">
                  ✅ 填写付款信息
                </h2>
                <p className="text-xs text-gray-400 text-center mb-4">
                  用于核对你的付款，请如实填写
                </p>

                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1.5">
                      支付宝付款姓名 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={payerName}
                      onChange={e => setPayerName(e.target.value)}
                      placeholder="你在支付宝显示的真实姓名"
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:border-[#FF6B35] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1.5">
                      订单号（自动填入）
                    </label>
                    <div className="w-full h-11 px-4 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-500 flex items-center font-mono">
                      {order.orderNo}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1.5">
                      支付金额（自动填入）
                    </label>
                    <div className="w-full h-11 px-4 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-500 flex items-center">
                      ¥{order.amount}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !payerName.trim()}
                    className="w-full h-12 rounded-2xl text-white font-bold text-sm disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}
                  >
                    {loading ? '提交中...' : '提交审核'}
                  </button>
                  <button
                    onClick={() => setStep('pay')}
                    className="w-full text-xs text-gray-400 py-2 hover:text-[#FF6B35] bg-transparent border-none cursor-pointer"
                  >
                    ← 返回扫码
                  </button>
                </div>
              </>
            )}

            {/* Step 4: 提交成功 */}
            {step === 'done' && (
              <div className="text-center py-4">
                <motion.div
                  className="w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <span className="text-3xl">⏳</span>
                </motion.div>
                <h2 className="text-lg font-extrabold text-gray-800 mb-1">已提交审核</h2>
                <p className="text-sm text-gray-400 mb-1">
                  订单 <span className="font-mono text-gray-600">{order?.orderNo}</span>
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  学长会尽快审核，通常 <span className="text-[#FF6B35] font-bold">5 分钟内</span>到账～
                </p>
                <button
                  onClick={handleClose}
                  className="w-full h-12 rounded-2xl text-white font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                >
                  好的，我知道了
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RechargeModal;
