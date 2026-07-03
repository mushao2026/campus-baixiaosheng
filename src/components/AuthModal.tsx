import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onLogin: (user: { phone: string; credits: number; token: string }) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose, onLogin }) => {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        setDevCode(data.devCode || '');
        setStep('code');
      } else {
        setError(data.message || '发送失败');
      }
    } catch {
      setError('网络错误，请重试');
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (code.length !== 6) {
      setError('请输入6位验证码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        onLogin({ phone: data.user.phone, credits: data.user.credits, token: data.token });
        onClose();
      } else {
        setError(data.message || '登录失败');
      }
    } catch {
      setError('网络错误，请重试');
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* 遮罩 */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* 弹窗 */}
          <motion.div
            className="relative w-full max-w-sm bg-white rounded-3xl p-6 z-10"
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            onClick={e => e.stopPropagation()}
          >
            {/* 顶部图标 */}
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
                <span className="text-3xl">🎓</span>
              </div>
              <h2 className="text-lg font-extrabold text-gray-800">注册/登录</h2>
              <p className="text-xs text-gray-400 mt-1">新用户注册即送 <span className="text-[#FF6B35] font-bold">20 次</span> 免费提问</p>
            </div>

            {error && (
              <div className="mb-3 p-2.5 bg-red-50 text-red-500 text-xs text-center rounded-xl">{error}</div>
            )}

            {step === 'phone' ? (
              <>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">手机号</label>
                <input
                  type="tel"
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  maxLength={11}
                  className="w-full h-12 px-4 bg-gray-50 rounded-2xl text-sm outline-none border-none mb-3"
                />
                <button
                  onClick={handleSendCode}
                  disabled={loading}
                  className="w-full h-12 rounded-2xl text-white font-bold text-sm cursor-pointer disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}
                >
                  {loading ? '发送中...' : '获取验证码'}
                </button>
              </>
            ) : (
              <>
                <div className="text-center mb-3">
                  <span className="text-xs text-gray-400">验证码已发送至 </span>
                  <span className="text-sm font-semibold text-gray-700">{phone}</span>
                  {devCode && <div className="mt-1 text-xs text-orange-400">（开发模式：{devCode}）</div>}
                </div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">验证码</label>
                <input
                  type="text"
                  placeholder="请输入6位验证码"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="w-full h-12 px-4 bg-gray-50 rounded-2xl text-sm outline-none border-none mb-3 text-center tracking-[0.3em] text-lg"
                />
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full h-12 rounded-2xl text-white font-bold text-sm cursor-pointer disabled:opacity-50 mb-2"
                  style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}
                >
                  {loading ? '登录中...' : '登录'}
                </button>
                <button
                  onClick={() => { setStep('phone'); setError(''); }}
                  className="w-full text-center text-xs text-gray-400 hover:text-[#FF6B35] cursor-pointer bg-transparent border-none"
                >
                  ← 更换手机号
                </button>
              </>
            )}

            <p className="text-center text-[10px] text-gray-300 mt-4">
              登录即同意《用户协议》和《隐私政策》
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
