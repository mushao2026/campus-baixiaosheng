import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthModal from './AuthModal';
import RechargeModal from './RechargeModal';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

const quickQuestions = [
  { emoji: '📚', text: '怎么选课？' },
  { emoji: '🏆', text: '有哪些竞赛？' },
  { emoji: '💰', text: '拿奖学金难吗？' },
  { emoji: '📝', text: '论文怎么写？' },
  { emoji: '💼', text: '实习去哪找？' },
  { emoji: '💕', text: '大学该谈恋爱吗？' },
];

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      text: '嗨！我是知新学长 🎓\n\n选课、考试、论文、求职、社团、恋爱……大学里的事儿我都懂！\n\n点击下方快捷提问，或者直接输入你的问题吧～',
      sender: 'bot',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string; content: string}>>([]);
  const [freeRemaining, setFreeRemaining] = useState(10);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credits, setCredits] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [showRecharge, setShowRecharge] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // 获取最新积分
  const refreshCredits = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/user/info', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setCredits(data.user.credits);
        setIsLoggedIn(true);
      }
    } catch {}
  };

  const callDeepSeekAPI = async (userMessage: string): Promise<any> => {
    const token = localStorage.getItem('token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: userMessage, history: conversationHistory }),
    });
    const data = await res.json();
    return data;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const data = await callDeepSeekAPI(text);

      if (data.success) {
        const botMsg: Message = { id: (Date.now() + 1).toString(), text: data.message, sender: 'bot' };
        setMessages(prev => [...prev, botMsg]);
        setConversationHistory(prev => [
          ...prev.slice(-18),
          { role: 'user', content: text },
          { role: 'assistant', content: data.message },
        ]);
        if (data.freeRemaining !== undefined) setFreeRemaining(data.freeRemaining);
        if (data.credits !== undefined) setCredits(data.credits);
      } else if (data.code === 'FREE_LIMIT' || data.code === 'INSUFFICIENT_CREDITS' || data.message?.includes('免费次数用完')) {
        // 免费次数用完 → 引导登录/充值
        if (!isLoggedIn) {
          const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: '😅 今天的免费次数用完啦～\n\n🆓 **注册登录即送 20 次免费提问！**\n\n点击下方按钮立即注册，继续向知新学长提问 👇',
            sender: 'bot',
          };
          setMessages(prev => [...prev, botMsg]);
          setShowAuth(true);
        } else {
          // 已登录但积分用完
          const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: `😅 你的提问次数用完啦！\n\n🪙 **充值继续畅聊**：\n• 体验包：¥1 / 10次\n• 月卡：¥9.9 / 200次\n• 学期卡：¥29.9 / 1000次\n\n点击下方按钮立即充值 👇`,
            sender: 'bot',
          };
          setMessages(prev => [...prev, botMsg]);
          setShowRecharge(true);
        }
      } else {
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: data.message || '抱歉，服务暂时不可用～',
          sender: 'bot',
        };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: '😵 网络出问题了，请稍后再试～',
        sender: 'bot',
      };
      setMessages(prev => [...prev, botMsg]);
    }

    setIsTyping(false);
  };

  const handleLogin = (user: { phone: string; credits: number; token: string }) => {
    setIsLoggedIn(true);
    setCredits(user.credits);
    setFreeRemaining(0);
    setShowAuth(false);
    // 登录成功后直接充值引导
    if (user.credits <= 0) {
      setShowRecharge(true);
    }
  };

  const handleRecharged = () => {
    refreshCredits();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 积分/免费次数指示器 */}
      <div className="flex items-center justify-end gap-2 px-4 py-2">
        {isLoggedIn ? (
          <>
            <span className="text-xs text-gray-400">剩余次数</span>
            <span className={`text-sm font-extrabold ${credits <= 3 ? 'text-red-500' : 'text-[#FF6B35]'}`}>
              {credits}
            </span>
            <button
              onClick={() => setShowRecharge(true)}
              className="text-[10px] text-white bg-[#FF6B35] px-2.5 py-1 rounded-full font-bold cursor-pointer border-none"
            >
              + 充值
            </button>
          </>
        ) : (
          <>
            <span className="text-xs text-gray-400">今日免费</span>
            <span className={`text-sm font-extrabold ${freeRemaining <= 2 ? 'text-red-500' : 'text-[#FF6B35]'}`}>
              {freeRemaining}
            </span>
            <span className="text-xs text-gray-400">次</span>
            <button
              onClick={() => setShowAuth(true)}
              className="text-[10px] text-[#FF6B35] bg-orange-50 px-2.5 py-1 rounded-full font-bold cursor-pointer border-none"
            >
              注册送20次
            </button>
          </>
        )}
      </div>

      {/* 聊天消息区 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ paddingBottom: '180px' }}>
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
              layout
            >
              {msg.sender === 'bot' && (
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
                  style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <circle cx="12" cy="10" r="5" />
                    <ellipse cx="12" cy="22" rx="8" ry="5" />
                  </svg>
                </div>
              )}

              <div
                className={`max-w-[78%] px-4 py-3 rounded-[22px] text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'text-white rounded-br-md'
                    : 'bg-white/80 backdrop-blur-sm text-gray-700 rounded-bl-md'
                }`}
                style={
                  msg.sender === 'user'
                    ? { background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)' }
                    : {
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
                      }
                }
              >
                {msg.text.split('\n').map((line, i) => {
                  const bolded = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                  return <div key={i} dangerouslySetInnerHTML={{ __html: bolded || '&nbsp;' }} />;
                })}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-sm">
                  🧑
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 正在输入... */}
        <AnimatePresence>
          {isTyping && (
            <motion.div className="flex items-end gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <circle cx="12" cy="10" r="5" /><ellipse cx="12" cy="22" rx="8" ry="5" />
                </svg>
              </div>
              <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-[22px] rounded-bl-md"
                style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                <div className="flex gap-1.5 py-1">
                  {[0, 1, 2].map(i => (
                    <motion.span key={i} className="w-2 h-2 rounded-full bg-orange-400 inline-block"
                      animate={{ y: [0, -6, 0] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* 快捷提问 */}
      <div className="absolute bottom-[72px] left-0 right-0 px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none' }}>
          {quickQuestions.map((q, i) => (
            <motion.button
              key={i}
              onClick={() => sendMessage(q.text)}
              className="flex-shrink-0 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-600 border border-gray-100 whitespace-nowrap cursor-pointer"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.04, borderColor: '#FF6B35', color: '#FF6B35' }}
            >
              {q.emoji} {q.text}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 输入框 */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-3 bg-white/70 backdrop-blur-xl border-t border-gray-100"
        style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2">
          <motion.button
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl flex-shrink-0 cursor-pointer"
            whileTap={{ scale: 0.9 }}
            whileHover={{ backgroundColor: '#f0f0f0' }}
          >
            +
          </motion.button>
          <input ref={inputRef} type="text" value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的问题..."
            className="flex-1 h-10 px-4 bg-[#f5f5f5] rounded-full text-sm outline-none border-none text-gray-700 placeholder-gray-400" />
          <motion.button
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: inputValue.trim() ? 'linear-gradient(135deg, #FF6B35, #F7931E)' : '#e5e5e5' }}
            whileTap={{ scale: inputValue.trim() ? 0.85 : 1 }}
            whileHover={{ scale: inputValue.trim() ? 1.08 : 1 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* 登录弹窗 */}
      <AuthModal visible={showAuth} onClose={() => setShowAuth(false)} onLogin={handleLogin} />

      {/* 充值弹窗 */}
      <RechargeModal visible={showRecharge} onClose={() => setShowRecharge(false)} onRecharged={handleRecharged} token={localStorage.getItem('token') || ''} />
    </div>
  );
};

export default ChatInterface;
