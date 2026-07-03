const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// 查询用户信息
router.get('/info', (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, phone, nickname, credits, created_at FROM users WHERE id = ?').get(req.user.userId);

  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  res.json({ success: true, user });
});

module.exports = router;
