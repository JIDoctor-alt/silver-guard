// ============================================================
// 乐龄守护 · MySQL 连接池
// ============================================================
const mysql = require('mysql2/promise');
const config = require('../config');

const poolOptions = {
  user: config.MYSQL_USER,
  password: config.MYSQL_PASSWORD,
  database: config.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: config.MYSQL_CONNECTION_LIMIT,
  queueLimit: 0,
  timezone: '+08:00',
  dateStrings: true,
};

if (process.env.MYSQL_SOCKET) {
  poolOptions.socketPath = process.env.MYSQL_SOCKET;
} else {
  poolOptions.host = config.MYSQL_HOST;
  poolOptions.port = config.MYSQL_PORT;
}

const pool = mysql.createPool(poolOptions);

// 启动时检测连接
pool.on('connection', (conn) => {
  console.log(`✓ MySQL 新连接 #${conn.threadId}`);
});

module.exports = pool;
