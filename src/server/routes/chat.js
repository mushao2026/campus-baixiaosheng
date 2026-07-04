const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authMiddleware, optionalAuth, generateToken } = require('../middleware/auth');
const { chat: aiChat } = require('../services/ai');

// 发送消息（可选登录：有 token 就扣积分，没 token 也能用但限制次数）
router.post('/', optionalAuth, async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || !message.trim()) {
    return res.json({ success: false, message: '请输入你的问题' });
  }

  const db = getDb();

  // 未登录用户：检查 IP 每日免费次数
  if (!req.user) {
    const ip = req.ip || req.connection.remoteAddress;
    const today = new Date().toISOString().slice(0, 10);

    const { rows: freeRows } = await db.query(
      "SELECT COUNT(*)::int as cnt FROM chat_logs WHERE user_id = -1 AND created_at >= $1",
      [today]
    );
    const freeCount = freeRows[0];

    // 每天免费 10 次
    if (freeCount.cnt >= 10) {
      return res.json({
        success: false,
        message: '今日免费次数用完啦～注册登录后畅享更多提问！',
        code: 'FREE_LIMIT',
      });
    }

    try {
      const result = await aiChat(message, history);
      await db.query(
        'INSERT INTO chat_logs (user_id, question, answer, tokens_used) VALUES ($1, $2, $3, $4)',
        [-1, message, result.content, result.tokensUsed]
      );

      return res.json({
        success: true,
        message: result.content,
        tokensUsed: result.tokensUsed,
        isGuest: true,
        freeRemaining: 9 - freeCount.cnt,
      });
    } catch (error) {
      console.error('AI 调用失败:', error);
      return res.status(500).json({ success: false, message: '服务暂时不可用，请稍后再试～' });
    }
  }

  // 已登录用户：检查积分
  const userId = req.user.userId;
  const { rows: userRows } = await db.query('SELECT credits FROM users WHERE id = $1', [userId]);
  const user = userRows[0];

  if (!user || user.credits <= 0) {
    return res.json({
      success: false,
      message: '积分不足，请先充值～',
      code: 'INSUFFICIENT_CREDITS',
      credits: user?.credits || 0,
    });
  }

  try {
    const result = await aiChat(message, history);
    await db.query('UPDATE users SET credits = credits - 1 WHERE id = $1 AND credits > 0', [userId]);
    await db.query(
      'INSERT INTO chat_logs (user_id, question, answer, tokens_used) VALUES ($1, $2, $3, $4)',
      [userId, message, result.content, result.tokensUsed]
    );

    const { rows: updatedRows } = await db.query('SELECT credits FROM users WHERE id = $1', [userId]);
    const updatedUser = updatedRows[0];

    res.json({
      success: true,
      message: result.content,
      tokensUsed: result.tokensUsed,
      credits: updatedUser.credits,
    });
  } catch (error) {
    console.error('AI 调用失败:', error);
    res.status(500).json({ success: false, message: '服务暂时不可用，请稍后再试～' });
  }
});

// 获取对话历史
router.get('/history', authMiddleware, async (req, res) => {
  const db = getDb();
  const userId = req.user.userId;

  const { rows: logs } = await db.query(
    'SELECT question, answer, created_at FROM chat_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
    [userId]
  );

  res.json({ success: true, history: logs.reverse() });
});

module.exports = router;
