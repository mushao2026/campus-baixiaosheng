const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// 查询用户信息
router.get('/info', async (req, res) => {
  const db = getDb();
  const { rows } = await db.query(
    'SELECT id, phone, nickname, credits, created_at FROM users WHERE id = $1',
    [req.user.userId]
  );

  const user = rows[0];
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  res.json({ success: true, user });
});

module.exports = router;
