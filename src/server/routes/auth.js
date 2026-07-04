const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { generateToken } = require('../middleware/auth');

// 生成 6 位随机验证码
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// 发送验证码
router.post('/send-code', async (req, res) => {
  const { phone } = req.body;

  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return res.json({ success: false, message: '请输入正确的手机号' });
  }

  const db = getDb();
  const code = generateCode();

  // 验证码 5 分钟有效
  await db.query(
    "INSERT INTO verify_codes (phone, code, expires_at) VALUES ($1, $2, NOW() + INTERVAL '5 minutes')",
    [phone, code]
  );

  // TODO: 接入阿里云 SMS 发送短信
  console.log(`[验证码] 手机号: ${phone}, 验证码: ${code}`);

  res.json({ success: true, message: '验证码已发送', devCode: code });
});

// 验证码登录
router.post('/login', async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.json({ success: false, message: '请输入手机号和验证码' });
  }

  const db = getDb();

  // 验证码校验
  const { rows: records } = await db.query(
    'SELECT * FROM verify_codes WHERE phone = $1 AND code = $2 AND expires_at > NOW() AND used = 0 ORDER BY id DESC LIMIT 1',
    [phone, code]
  );

  if (!records.length) {
    return res.json({ success: false, message: '验证码错误或已过期' });
  }

  const record = records[0];

  // 标记验证码已使用
  await db.query('UPDATE verify_codes SET used = 1 WHERE id = $1', [record.id]);

  // 查找或创建用户
  let { rows: users } = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
  let user = users[0];

  if (!user) {
    const { rows: inserted } = await db.query(
      'INSERT INTO users (phone, credits) VALUES ($1, 5) RETURNING *',
      [phone]
    );
    user = inserted[0];
  }

  // 生成 JWT
  const token = generateToken({ userId: user.id, phone: user.phone });

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      credits: user.credits,
    },
  });
});

module.exports = router;
