import React from 'react';
import { motion } from 'framer-motion';

const ProfilePage: React.FC = () => {
  const stats = [
    { label: '提问次数', value: '36', icon: '💬' },
    { label: '收藏文章', value: '12', icon: '⭐' },
    { label: '学习天数', value: '28', icon: '🔥' },
  ];

  const menuItems = [
    { icon: '📋', label: '我的提问记录', desc: '查看历史对话' },
    { icon: '📥', label: '我的收藏', desc: '12 篇知识库文章' },
    { icon: '🎯', label: '我的专业', desc: '计算机科学与技术 · 大一' },
    { icon: '⚙️', label: '设置', desc: '通知、隐私、关于' },
    { icon: '💡', label: '意见反馈', desc: '帮助我们做得更好' },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24">
      {/* 头像区 */}
      <div className="px-4 pt-6 pb-4">
        <motion.div
          className="bg-white rounded-[28px] p-6 text-center"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* 头像 */}
          <div className="w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}
          >
            <span className="text-3xl">🧑</span>
          </div>
          <h2 className="text-lg font-bold text-gray-800">小明同学</h2>
          <p className="text-xs text-gray-400 mt-1">计算机科学与技术 · 2025级</p>

          {/* 统计数据 */}
          <div className="flex justify-center gap-8 mt-5 pt-4 border-t border-gray-50">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <span className="text-lg">{s.icon}</span>
                <span className="text-lg font-extrabold text-gray-800">{s.value}</span>
                <span className="text-[10px] text-gray-400">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 菜单列表 */}
      <div className="px-4 space-y-2">
        {menuItems.map((item, i) => (
          <motion.div
            key={i}
            className="bg-white rounded-[18px] p-4 flex items-center gap-3 cursor-pointer"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i }}
            whileTap={{ scale: 0.98 }}
            whileHover={{ x: 4 }}
          >
            <span className="text-xl">{item.icon}</span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-700">{item.label}</div>
              <div className="text-xs text-gray-400">{item.desc}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </motion.div>
        ))}
      </div>

      {/* 版本信息 */}
      <p className="text-center text-xs text-gray-300 mt-6">知新学长 v1.0.0 · Made with ❤️</p>
    </div>
  );
};

export default ProfilePage;
