const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const crypto = require('crypto');

// 充值套餐
const PACKAGES = [
  { id: 'trial', name: '体验包', amount: 1.00, credits: 10, desc: '10次提问，适合尝鲜' },
  { id: 'monthly', name: '月卡', amount: 9.90, credits: 200, desc: '200次提问，够用一个学期' },
  { id: 'semester', name: '学期卡', amount: 29.90, credits: 1000, desc: '1000次提问，学霸必备', tag: '最划算' },
];

// 管理员密码（从环境变量读取，默认值仅开发用）
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'campus2026';

// 管理员登录中间件
function adminAuth(req, res, next) {
  const pwd = req.headers['x-admin-password'] || req.query.password;
  if (pwd !== ADMIN_PASSWORD) {
    return res.status(403).json({ success: false, message: '管理员密码错误' });
  }
  next();
}

// ========== 用户接口 ==========

// 获取充值套餐
router.get('/packages', (req, res) => {
  res.json({ success: true, packages: PACKAGES });
});

// 创建充值订单（生成订单号，等用户扫码付款后提交）
router.post('/create-order', (req, res) => {
  const { packageId } = req.body;
  const userId = req.user.userId;

  const pkg = PACKAGES.find(p => p.id === packageId);
  if (!pkg) {
    return res.json({ success: false, message: '套餐不存在' });
  }

  const db = getDb();
  const orderNo = 'CBX' + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();

  const result = db.prepare(
    'INSERT INTO orders (user_id, amount, credits, package_name, status, pay_method) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(userId, pkg.amount, pkg.credits, pkg.name, 'pending', 'alipay');

  const orderId = result.lastInsertRowid;

  // 把订单号写到 package_name 里方便用户转账备注（或者单独字段）
  db.prepare('UPDATE orders SET package_name = ? WHERE id = ?').run(
    `${pkg.name}(${orderNo})`, orderId
  );

  res.json({
    success: true,
    order: {
      id: orderId,
      orderNo,
      amount: pkg.amount,
      credits: pkg.credits,
      packageName: pkg.name,
    },
  });
});

// 用户提交付款信息（扫码付完后，填写付款人姓名）
router.post('/submit', (req, res) => {
  const { orderId, payerName } = req.body;
  const userId = req.user.userId;

  if (!payerName || !payerName.trim()) {
    return res.json({ success: false, message: '请填写支付宝付款姓名，方便核对～' });
  }

  const db = getDb();
  const order = db.prepare(
    'SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = ?'
  ).get(orderId, userId, 'pending');

  if (!order) {
    return res.json({ success: false, message: '订单不存在或已处理' });
  }

  db.prepare(
    'UPDATE orders SET status = ?, payer_name = ? WHERE id = ?'
  ).run('submitted', payerName.trim(), orderId);

  console.log(`[支付] 订单 #${orderId} 已提交审核，付款人: ${payerName.trim()}`);

  res.json({
    success: true,
    message: '已提交！学长会尽快审核，通常 5 分钟内到账～',
  });
});

// 查询我的订单
router.get('/orders', (req, res) => {
  const db = getDb();
  const orders = db.prepare(
    'SELECT id, amount, credits, package_name, status, payer_name, created_at, reviewed_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
  ).all(req.user.userId);

  res.json({ success: true, orders });
});

// ========== 管理员接口 ==========

// 获取待审核订单列表
router.get('/admin/pending', adminAuth, (req, res) => {
  const db = getDb();
  const orders = db.prepare(`
    SELECT o.*, u.phone, u.nickname
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.status = 'submitted'
    ORDER BY o.created_at ASC
  `).all();

  res.json({ success: true, orders });
});

// 获取所有订单（管理用）
router.get('/admin/all', adminAuth, (req, res) => {
  const db = getDb();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  const orders = db.prepare(`
    SELECT o.*, u.phone, u.nickname
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  const total = db.prepare('SELECT COUNT(*) as cnt FROM orders').get().cnt;

  res.json({ success: true, orders, total, page, limit });
});

// 批准订单（充值积分）
router.post('/admin/approve', adminAuth, (req, res) => {
  const { orderId } = req.body;
  const db = getDb();

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND status = ?').get(orderId, 'submitted');
  if (!order) {
    return res.json({ success: false, message: '订单不存在或已处理' });
  }

  // 更新订单状态
  db.prepare('UPDATE orders SET status = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?').run('approved', orderId);

  // 充值积分
  db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?').run(order.credits, order.user_id);

  console.log(`[管理] 订单 #${orderId} 已批准，充值 ${order.credits} 积分给用户 ${order.user_id}`);

  res.json({ success: true, message: `已批准，充值 ${order.credits} 积分` });
});

// 拒绝订单
router.post('/admin/reject', adminAuth, (req, res) => {
  const { orderId, reason } = req.body;
  const db = getDb();

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND status = ?').get(orderId, 'submitted');
  if (!order) {
    return res.json({ success: false, message: '订单不存在或已处理' });
  }

  db.prepare('UPDATE orders SET status = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?').run('rejected', orderId);

  console.log(`[管理] 订单 #${orderId} 已拒绝，原因: ${reason || '未说明'}`);

  res.json({ success: true, message: '已拒绝' });
});

// 批量批准
router.post('/admin/approve-batch', adminAuth, (req, res) => {
  const { orderIds } = req.body;
  const db = getDb();

  if (!orderIds || !orderIds.length) {
    return res.json({ success: false, message: '没有选择订单' });
  }

  const approve = db.prepare('UPDATE orders SET status = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?');
  const addCredits = db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?');
  const getOrder = db.prepare('SELECT * FROM orders WHERE id = ?');

  const transaction = db.transaction((ids) => {
    let approved = 0;
    for (const id of ids) {
      const order = getOrder.get(id);
      if (order && order.status === 'submitted') {
        approve.run('approved', id, 'submitted');
        addCredits.run(order.credits, order.user_id);
        approved++;
      }
    }
    return approved;
  });

  const count = transaction(orderIds);
  console.log(`[管理] 批量批准 ${count} 个订单`);

  res.json({ success: true, message: `已批准 ${count} 个订单` });
});

// 管理后台统计
router.get('/admin/stats', adminAuth, (req, res) => {
  const db = getDb();

  const totalOrders = db.prepare('SELECT COUNT(*) as cnt FROM orders').get().cnt;
  const pendingOrders = db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE status = 'submitted'").get().cnt;
  const approvedOrders = db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE status = 'approved'").get().cnt;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status = 'approved'").get().total;
  const totalUsers = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  const todayChats = db.prepare("SELECT COUNT(*) as cnt FROM chat_logs WHERE created_at >= date('now')").get().cnt;

  res.json({
    success: true,
    stats: {
      totalOrders,
      pendingOrders,
      approvedOrders,
      totalRevenue,
      totalUsers,
      todayChats,
    },
  });
});

module.exports = router;
