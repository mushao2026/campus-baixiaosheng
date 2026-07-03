import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WelcomeScreen from './components/WelcomeScreen';
import ChatInterface from './components/ChatInterface';
import KnowledgeBase from './pages/KnowledgeBase';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import BottomNav from './components/BottomNav';

type Tab = 'chat' | 'knowledge' | 'profile';

const App: React.FC = () => {
  // 管理后台独立页面
  if (window.location.pathname === '/admin') {
    return <AdminPage />;
  }

  const [showWelcome, setShowWelcome] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  if (showWelcome) {
    return <WelcomeScreen onStart={() => setShowWelcome(false)} />;
  }

  return (
    <div className="relative h-screen overflow-hidden max-w-[480px] mx-auto bg-[#FFFAF5]"
      style={{
        boxShadow: '0 0 60px rgba(0,0,0,0.08)',
      }}
    >
      {/* 顶部标题栏 */}
      <div className="relative z-10 px-4 pt-4 pb-2 bg-gradient-to-b from-[#FFFAF5] via-[#FFFAF5] to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}
            >
              <span className="text-white text-sm">🎓</span>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-gray-800">
                知新学长
              </h1>
              <p className="text-[10px] text-gray-400">懂你的大学通关指南</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <span className="text-sm">🔔</span>
          </div>
        </div>
      </div>

      {/* 页面内容 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          className="h-full"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {activeTab === 'chat' && <ChatInterface />}
          {activeTab === 'knowledge' && <KnowledgeBase />}
          {activeTab === 'profile' && <ProfilePage />}
        </motion.div>
      </AnimatePresence>

      {/* 底部导航 */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default App;
