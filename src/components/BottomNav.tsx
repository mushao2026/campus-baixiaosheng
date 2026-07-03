import React from 'react';
import { motion } from 'framer-motion';

interface BottomNavProps {
  activeTab: 'chat' | 'knowledge' | 'profile';
  onTabChange: (tab: 'chat' | 'knowledge' | 'profile') => void;
}

const tabs = [
  { key: 'chat' as const, icon: '💬', label: '问答' },
  { key: 'knowledge' as const, icon: '📚', label: '知识库' },
  { key: 'profile' as const, icon: '👤', label: '我的' },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 px-4 py-2"
      style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.04)' }}
    >
      <div className="flex justify-around max-w-[480px] mx-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className="flex flex-col items-center gap-0.5 py-1 px-6 rounded-xl transition-colors cursor-pointer bg-transparent border-none relative"
          >
            <span className="text-xl">{tab.icon}</span>
            <span
              className={`text-[11px] font-medium ${activeTab === tab.key ? 'text-[#FF6B35]' : 'text-gray-400'}`}
            >
              {tab.label}
            </span>
            {activeTab === tab.key && (
              <motion.div
                className="absolute -bottom-2 w-8 h-0.5 rounded-full"
                style={{ background: 'linear-gradient(to right, #FF6B35, #F7931E)' }}
                layoutId="navIndicator"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
