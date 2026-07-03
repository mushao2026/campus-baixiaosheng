const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { generateToken } = require('../middleware/auth');

// 生成 6 位随机验证码
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// 发送验证码
router.post('/send-code', (req, res) => {
  const { phone } = req.body;

  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return res.json({ success: false, message: '请输入正确的手机号' });
  }

  const db = getDb();
  const code = generateCode();

  // 验证码 5 分钟有效
  db.prepare("INSERT INTO verify_codes (phone, code, expires_at) VALUES (?, ?, datetime('now', '+5 minutes'))").run(phone, code);

  // TODO: 接入阿里云 SMS 发送短信
  // 开发阶段打印到控制台
  console.log(`[验证码] 手机号: ${phone}, 验证码: ${code}`);

  res.json({ success: true, message: '验证码已发送', devCode: code }); // 生产环境删除 devCode
});

// 验证码登录
router.post('/login', (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.json({ success: false, message: '请输入手机号和验证码' });
  }

  const db = getDb();

  // 验证码校验
  const record = db.prepare(
    'SELECT * FROM verify_codes WHERE phone = ? AND code = ? AND expires_at > datetime(\'now\') AND used = 0 ORDER BY id DESC LIMIT 1'
  ).get(phone, code);

  if (!record) {
    return res.json({ success: false, message: '验证码错误或已过期' });
  }

  // 标记验证码已使用
  db.prepare('UPDATE verify_codes SET used = 1 WHERE id = ?').run(record.id);

  // 查找或创建用户
  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (!user) {
    const result = db.prepare('INSERT INTO users (phone, credits) VALUES (?, 5)').run(phone);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
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
