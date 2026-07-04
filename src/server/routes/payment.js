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

// 管理员密码
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

// 创建充值订单
router.post('/create-order', async (req, res) => {
  const { packageId } = req.body;
  const userId = req.user.userId;

  const pkg = PACKAGES.find(p => p.id === packageId);
  if (!pkg) {
    return res.json({ success: false, message: '套餐不存在' });
  }

  const db = getDb();
  const orderNo = 'CBX' + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();

  const { rows } = await db.query(
    'INSERT INTO orders (user_id, amount, credits, package_name, status, pay_method) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
    [userId, pkg.amount, pkg.credits, `${pkg.name}(${orderNo})`, 'pending', 'alipay']
  );

  const orderId = rows[0].id;

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

// 用户提交付款信息
router.post('/submit', async (req, res) => {
  const { orderId, payerName } = req.body;
  const userId = req.user.userId;

  if (!payerName || !payerName.trim()) {
    return res.json({ success: false, message: '请填写支付宝付款姓名，方便核对～' });
  }

  const db = getDb();
  const { rows: orders } = await db.query(
    'SELECT * FROM orders WHERE id = $1 AND user_id = $2 AND status = $3',
    [orderId, userId, 'pending']
  );

  if (!orders.length) {
    return res.json({ success: false, message: '订单不存在或已处理' });
  }

  await db.query(
    'UPDATE orders SET status = $1, payer_name = $2 WHERE id = $3',
    ['submitted', payerName.trim(), orderId]
  );

  console.log(`[支付] 订单 #${orderId} 已提交审核，付款人: ${payerName.trim()}`);

  res.json({
    success: true,
    message: '已提交！学长会尽快审核，通常 5 分钟内到账～',
  });
});

// 查询我的订单
router.get('/orders', async (req, res) => {
  const db = getDb();
  const { rows: orders } = await db.query(
    'SELECT id, amount, credits, package_name, status, payer_name, created_at, reviewed_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
    [req.user.userId]
  );

  res.json({ success: true, orders });
});

// ========== 管理员接口 ==========

// 获取待审核订单列表
router.get('/admin/pending', adminAuth, async (req, res) => {
  const db = getDb();
  const { rows: orders } = await db.query(`
    SELECT o.*, u.phone, u.nickname
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.status = 'submitted'
    ORDER BY o.created_at ASC
  `);

  res.json({ success: true, orders });
});

// 获取所有订单
router.get('/admin/all', adminAuth, async (req, res) => {
  const db = getDb();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  const { rows: orders } = await db.query(`
    SELECT o.*, u.phone, u.nickname
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  const { rows: countRows } = await db.query('SELECT COUNT(*)::int as cnt FROM orders');
  const total = countRows[0].cnt;

  res.json({ success: true, orders, total, page, limit });
});

// 批准订单（充值积分）
router.post('/admin/approve', adminAuth, async (req, res) => {
  const { orderId } = req.body;
  const db = getDb();

  const { rows: orders } = await db.query(
    "SELECT * FROM orders WHERE id = $1 AND status = 'submitted'",
    [orderId]
  );

  if (!orders.length) {
    return res.json({ success: false, message: '订单不存在或已处理' });
  }

  const order = orders[0];

  await db.query(
    "UPDATE orders SET status = 'approved', reviewed_at = NOW() WHERE id = $1",
    [orderId]
  );
  await db.query(
    'UPDATE users SET credits = credits + $1 WHERE id = $2',
    [order.credits, order.user_id]
  );

  console.log(`[管理] 订单 #${orderId} 已批准，充值 ${order.credits} 积分给用户 ${order.user_id}`);

  res.json({ success: true, message: `已批准，充值 ${order.credits} 积分` });
});

// 拒绝订单
router.post('/admin/reject', adminAuth, async (req, res) => {
  const { orderId, reason } = req.body;
  const db = getDb();

  const { rows: orders } = await db.query(
    "SELECT * FROM orders WHERE id = $1 AND status = 'submitted'",
    [orderId]
  );

  if (!orders.length) {
    return res.json({ success: false, message: '订单不存在或已处理' });
  }

  await db.query(
    "UPDATE orders SET status = 'rejected', reviewed_at = NOW() WHERE id = $1",
    [orderId]
  );

  console.log(`[管理] 订单 #${orderId} 已拒绝，原因: ${reason || '未说明'}`);

  res.json({ success: true, message: '已拒绝' });
});

// 批量批准
router.post('/admin/approve-batch', adminAuth, async (req, res) => {
  const { orderIds } = req.body;
  const db = getDb();

  if (!orderIds || !orderIds.length) {
    return res.json({ success: false, message: '没有选择订单' });
  }

  // 用事务处理
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    let approved = 0;

    for (const id of orderIds) {
      const { rows: orders } = await client.query(
        "SELECT * FROM orders WHERE id = $1 AND status = 'submitted'",
        [id]
      );
      if (orders.length) {
        const order = orders[0];
        await client.query(
          "UPDATE orders SET status = 'approved', reviewed_at = NOW() WHERE id = $1",
          [id]
        );
        await client.query(
          'UPDATE users SET credits = credits + $1 WHERE id = $2',
          [order.credits, order.user_id]
        );
        approved++;
      }
    }

    await client.query('COMMIT');
    console.log(`[管理] 批量批准 ${approved} 个订单`);
    res.json({ success: true, message: `已批准 ${approved} 个订单` });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// 管理后台统计
router.get('/admin/stats', adminAuth, async (req, res) => {
  const db = getDb();

  const [totalRes, pendingRes, approvedRes, revenueRes, usersRes, chatsRes] = await Promise.all([
    db.query('SELECT COUNT(*)::int as cnt FROM orders'),
    db.query("SELECT COUNT(*)::int as cnt FROM orders WHERE status = 'submitted'"),
    db.query("SELECT COUNT(*)::int as cnt FROM orders WHERE status = 'approved'"),
    db.query("SELECT COALESCE(SUM(amount), 0)::float as total FROM orders WHERE status = 'approved'"),
    db.query('SELECT COUNT(*)::int as cnt FROM users'),
    db.query("SELECT COUNT(*)::int as cnt FROM chat_logs WHERE created_at >= CURRENT_DATE"),
  ]);

  res.json({
    success: true,
    stats: {
      totalOrders: totalRes.rows[0].cnt,
      pendingOrders: pendingRes.rows[0].cnt,
      approvedOrders: approvedRes.rows[0].cnt,
      totalRevenue: revenueRes.rows[0].total,
      totalUsers: usersRes.rows[0].cnt,
      todayChats: chatsRes.rows[0].cnt,
    },
  });
});

module.exports = router;
