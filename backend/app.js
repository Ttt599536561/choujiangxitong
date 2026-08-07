require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// 异步初始化数据库
async function startServer() {
  await initDatabase();

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
// 批量粘贴兑换码时请求体可能较大，放宽默认的 100kb 限制
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 路由
const lotteryRoutes = require('./routes/lotteryRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/api/lottery', lotteryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

  // 启动服务器
  app.listen(PORT, () => {
    console.log(`\n🎰 抽奖系统后端服务已启动`);
    console.log(`📡 监听端口: ${PORT}`);
    console.log(`🌐 API 地址: http://localhost:${PORT}`);
    console.log(`📝 管理员账号: ${process.env.DEFAULT_ADMIN_USERNAME || 'admin'}`);
    console.log(`🔑 管理员密码: ${process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'}`);
    console.log(`\n准备就绪！\n`);
  });
}

// 启动服务器
startServer().catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
});

module.exports = app;
