import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Order {
  id: number;
  user_id: number;
  amount: number;
  credits: number;
  package_name: string;
  status: string;
  payer_name: string;
  phone: string;
  nickname: string;
  created_at: string;
  reviewed_at: string;
}

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  totalRevenue: number;
  totalUsers: number;
  todayChats: number;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待支付', color: '#6b7280', bg: '#f3f4f6' },
  submitted: { label: '待审核', color: '#f59e0b', bg: '#fef3c7' },
  approved: { label: '已通过', color: '#22c55e', bg: '#dcfce7' },
  rejected: { label: '已拒绝', color: '#ef4444', bg: '#fee2e2' },
};

const AdminPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState('');

  const headers = { 'Content-Type': 'application/json', 'x-admin-password': password };

  // 登录
  const handleLogin = async () => {
    try {
      const res = await fetch('/api/payment/admin/stats', { headers });
      const data = await res.json();
      if (data.success) {
        setIsAuthed(true);
        setStats(data.stats);
        loadPending();
      } else {
        setMessage('密码错误');
      }
    } catch {
      setMessage('连接失败');
    }
  };

  // 加载待审核
  const loadPending = async () => {
    const res = await fetch('/api/payment/admin/pending', { headers });
    const data = await res.json();
    if (data.success) setPendingOrders(data.orders);
  };

  // 加载全部订单
  const loadAll = async () => {
    const res = await fetch('/api/payment/admin/all', { headers });
    const data = await res.json();
    if (data.success) setAllOrders(data.orders);
  };

  // 切换 tab 时加载数据
  useEffect(() => {
    if (!isAuthed) return;
    if (tab === 'pending') loadPending();
    else loadAll();
  }, [tab, isAuthed]);

  // 刷新统计
  const refreshStats = async () => {
    const res = await fetch('/api/payment/admin/stats', { headers });
    const data = await res.json();
    if (data.success) setStats(data.stats);
  };

  // 批准单个
  const handleApprove = async (orderId: number) => {
    setLoading(true);
    const res = await fetch('/api/payment/admin/approve', {
      method: 'POST', headers, body: JSON.stringify({ orderId }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage(`✅ 订单 #${orderId} 已批准`);
      loadPending();
      refreshStats();
    } else {
      setMessage(`❌ ${data.message}`);
    }
    setLoading(false);
  };

  // 拒绝单个
  const handleReject = async (orderId: number) => {
    const reason = prompt('拒绝原因（可选）：');
    setLoading(true);
    const res = await fetch('/api/payment/admin/reject', {
      method: 'POST', headers, body: JSON.stringify({ orderId, reason }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage(`✅ 订单 #${orderId} 已拒绝`);
      loadPending();
      refreshStats();
    }
    setLoading(false);
  };

  // 批量批准
  const handleBatchApprove = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确认批准 ${selectedIds.size} 个订单？`)) return;
    setLoading(true);
    const res = await fetch('/api/payment/admin/approve-batch', {
      method: 'POST', headers,
      body: JSON.stringify({ orderIds: Array.from(selectedIds) }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage(`✅ ${data.message}`);
      setSelectedIds(new Set());
      loadPending();
      refreshStats();
    }
    setLoading(false);
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pendingOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingOrders.map(o => o.id)));
    }
  };

  // 登录页
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <motion.div
          className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🔐</div>
            <h1 className="text-xl font-extrabold text-gray-800">校园百晓生 · 管理后台</h1>
            <p className="text-xs text-gray-400 mt-1">请输入管理员密码</p>
          </div>
          {message && (
            <div className="mb-3 p-2 bg-red-50 text-red-500 text-xs rounded-xl text-center">{message}</div>
          )}
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="管理员密码"
            className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm focus:border-[#FF6B35] focus:outline-none mb-4"
          />
          <button
            onClick={handleLogin}
            className="w-full h-12 rounded-2xl text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}
          >
            登录
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部栏 */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-base font-extrabold text-gray-800">🎓 校园百晓生管理后台</h1>
        <button
          onClick={() => { refreshStats(); tab === 'pending' ? loadPending() : loadAll(); }}
          className="text-xs text-[#FF6B35] bg-orange-50 px-3 py-1.5 rounded-full font-bold"
        >
          🔄 刷新
        </button>
      </div>

      {/* 消息提示 */}
      <AnimatePresence>
        {message && (
          <motion.div
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm font-medium shadow-lg"
            style={{ background: message.startsWith('✅') ? '#dcfce7' : '#fee2e2', color: message.startsWith('✅') ? '#16a34a' : '#ef4444' }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onAnimationComplete={() => setTimeout(() => setMessage(''), 2000)}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 p-4">
          {[
            { label: '待审核', value: stats.pendingOrders, color: '#f59e0b' },
            { label: '总收入', value: `¥${stats.totalRevenue.toFixed(1)}`, color: '#22c55e' },
            { label: '总用户', value: stats.totalUsers, color: '#6366f1' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-3 text-center shadow-sm">
              <div className="text-xl font-extrabold" style={{ color: item.color }}>{item.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 切换 */}
      <div className="flex gap-2 px-4 mb-3">
        {(['pending', 'all'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
              tab === t
                ? 'text-white'
                : 'text-gray-500 bg-white'
            }`}
            style={tab === t ? { background: 'linear-gradient(135deg, #FF6B35, #F7931E)' } : {}}
          >
            {t === 'pending' ? `待审核 (${pendingOrders.length})` : '全部订单'}
          </button>
        ))}

        {/* 批量批准按钮 */}
        {tab === 'pending' && selectedIds.size > 0 && (
          <button
            onClick={handleBatchApprove}
            disabled={loading}
            className="ml-auto px-4 py-2 rounded-full text-xs font-bold text-white bg-green-500 disabled:opacity-50"
          >
            ✅ 批量批准 ({selectedIds.size})
          </button>
        )}
      </div>

      {/* 订单列表 */}
      <div className="px-4 pb-8 space-y-2">
        {/* 全选 */}
        {tab === 'pending' && pendingOrders.length > 0 && (
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer px-2">
            <input
              type="checkbox"
              checked={selectedIds.size === pendingOrders.length}
              onChange={toggleSelectAll}
              className="accent-[#FF6B35]"
            />
            全选
          </label>
        )}

        {(tab === 'pending' ? pendingOrders : allOrders).map(order => {
          const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
          return (
            <motion.div
              key={order.id}
              className="bg-white rounded-2xl p-4 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {tab === 'pending' && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(order.id)}
                      onChange={() => toggleSelect(order.id)}
                      className="accent-[#FF6B35]"
                    />
                  )}
                  <div>
                    <div className="font-bold text-sm text-gray-800">
                      #{order.id} · {order.package_name?.split('(')[0] || order.package_name}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {order.nickname} · {order.phone || '未绑定手机'} · {new Date(order.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ color: status.color, background: status.bg }}
                >
                  {status.label}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>💰 ¥{order.amount}</span>
                  <span>🪙 {order.credits}次</span>
                  {order.payer_name && <span>👤 {order.payer_name}</span>}
                </div>

                {order.status === 'submitted' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(order.id)}
                      disabled={loading}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-green-500 disabled:opacity-50"
                    >
                      ✅ 批准
                    </button>
                    <button
                      onClick={() => handleReject(order.id)}
                      disabled={loading}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-50 disabled:opacity-50"
                    >
                      ✕ 拒绝
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {(tab === 'pending' ? pendingOrders : allOrders).length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-3xl mb-2">🎉</div>
            <p className="text-sm">{tab === 'pending' ? '没有待审核的订单' : '暂无订单'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
