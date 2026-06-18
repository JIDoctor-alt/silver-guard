// ============================================================
// Silver Guard · Express 应用入口
// ============================================================
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

// 全局中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// API 路由
app.use('/api', routes);

// 健康检查
app.get('/actuator/health', (req, res) => {
  res.json({ status: 'UP', service: 'silver-guard-server', version: '1.0.0' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在', data: null });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('未捕获错误:', err);
  res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
});

module.exports = app;
