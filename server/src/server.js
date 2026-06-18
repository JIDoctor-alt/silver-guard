// ============================================================
// 乐龄守护 · 服务启动入口
// ============================================================
const app = require('./app');
const config = require('./config');
const pool = require('./db/mysql');
const redisClient = require('./db/redis');
const initData = require('./db/initData');

const PORT = config.PORT;

// 等待 MySQL 就绪
async function waitForMySQL() {
  const maxRetry = 30;
  for (let i = 1; i <= maxRetry; i++) {
    try {
      await pool.query('SELECT 1');
      console.log(`✓ MySQL connected (${config.MYSQL_HOST}:${config.MYSQL_PORT}/${config.MYSQL_DATABASE})`);
      return;
    } catch (e) {
      console.log(`⟳ MySQL not ready (${i}/${maxRetry}): ${e.message.replace(/\s+/g, ' ').slice(0, 80)}`);
      if (i === maxRetry) {
        console.error('✗ MySQL 连接失败，退出');
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

// 启动
async function bootstrap() {
  await waitForMySQL();
  await initData();

  // Redis 连接（非阻塞）
  try {
    await redisClient.connect();
    console.log('✓ Redis connected');
  } catch (e) {
    console.warn('⚠ Redis 连接失败，将以无缓存模式运行:', e.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('=============================================');
    console.log('✓ 乐龄守护 Server started');
    console.log(`✓ HTTP: http://0.0.0.0:${PORT}`);
    console.log(`✓ Health: http://0.0.0.0:${PORT}/actuator/health`);
    console.log(`✓ API Base: http://0.0.0.0:${PORT}/api`);
    console.log('✓ Test account: 13800000001 / password123');
    console.log('=============================================');
  });
}

bootstrap().catch((err) => {
  console.error('启动失败:', err);
  process.exit(1);
});
