require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const { authMiddleware } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/user');
const paymentRoutes = require('./routes/payment');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 公开路由（无需登录）
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);  // chat 路由自带 optionalAuth，不在此处强制登录

// 需要登录的路由
app.use('/api/user', authMiddleware, userRoutes);
app.use('/api/payment', authMiddleware, paymentRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: '校园百晓生 API', version: '1.0.0' });
});

// 生产环境：托管前端静态文件
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', '..', 'dist')));
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎓 校园百晓生 API 服务启动成功！`);
  console.log(`   本地地址: http://localhost:${PORT}`);
  console.log(`   局域网地址: http://10.121.165.243:${PORT}`);
  console.log(`   健康检查: http://localhost:${PORT}/api/health`);
});

module.exports = app;
