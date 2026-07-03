import React from 'react';
import { motion } from 'framer-motion';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 25%, #FF8C69 50%, #E8D5F5 80%, #C4B5FD 100%)' }}
    >
      {/* 动态光晕背景 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)' }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
      </div>

      {/* 内容区 */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* SVG 学长头像 */}
        <motion.div
          className="mb-6"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* 光晕 */}
          <div className="absolute inset-0 w-32 h-32 rounded-full bg-white/30 blur-2xl" style={{ margin: 'auto' }} />
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* 光晕脉冲 */}
            <motion.circle
              cx="70" cy="70" r="68" fill="rgba(255,255,255,0.15)"
              animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* 脸 */}
            <circle cx="70" cy="72" r="52" fill="white" />
            {/* 头发 */}
            <ellipse cx="70" cy="38" rx="48" ry="22" fill="#3D3D3D" />
            <rect x="22" y="45" width="96" height="12" rx="6" fill="#3D3D3D" />
            {/* 眼镜 */}
            <rect x="36" y="62" width="28" height="18" rx="5" fill="none" stroke="#333" strokeWidth="2.5" />
            <rect x="76" y="62" width="28" height="18" rx="5" fill="none" stroke="#333" strokeWidth="2.5" />
            <line x1="64" y1="70" x2="76" y2="70" stroke="#333" strokeWidth="2" />
            {/* 眼睛 */}
            <circle cx="50" cy="71" r="4" fill="#333" />
            <circle cx="90" cy="71" r="4" fill="#333" />
            <circle cx="52" cy="70" r="1.5" fill="white" />
            <circle cx="92" cy="70" r="1.5" fill="white" />
            {/* 微笑 */}
            <path d="M 55 88 Q 70 100 85 88" stroke="#FF6B35" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* 腮红 */}
            <ellipse cx="42" cy="84" rx="10" ry="6" fill="#FFB5A7" opacity="0.5" />
            <ellipse cx="98" cy="84" rx="10" ry="6" fill="#FFB5A7" opacity="0.5" />
          </svg>
        </motion.div>

        {/* 标题 */}
        <motion.h1
          className="text-3xl font-extrabold text-white mb-2 tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          嗨，我是 <span className="text-white drop-shadow-lg">知新学长</span> 👋
        </motion.h1>

        <motion.p
          className="text-white/80 text-base font-medium mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          懂你的大学通关指南
        </motion.p>

        {/* 开始按钮 */}
        <motion.button
          onClick={onStart}
          className="px-12 py-4 bg-white text-[#FF6B35] font-bold text-lg rounded-full shadow-xl cursor-pointer select-none"
          style={{ boxShadow: '0 8px 32px rgba(255,107,53,0.35)' }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05, boxShadow: '0 12px 40px rgba(255,107,53,0.5)' }}
        >
          开始咨询
        </motion.button>
      </motion.div>

      {/* 底部免责声明 */}
      <motion.p
        className="absolute bottom-8 text-white/50 text-xs text-center px-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        信息仅供参考，请以本校官网为准
      </motion.p>
    </div>
  );
};

export default WelcomeScreen;
