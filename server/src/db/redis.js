// ============================================================
// 乐龄守护 · Redis 客户端
// ============================================================
const { createClient } = require('redis');
const config = require('../config');

const options = {
  socket: {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
  },
};

if (config.REDIS_PASSWORD) {
  options.password = config.REDIS_PASSWORD;
}

const client = createClient(options);

client.on('error', (err) => {
  console.warn('⚠ Redis 客户端错误:', err.message);
});

module.exports = client;
