// ============================================================
// Silver Guard · MySQL 连接池
// ============================================================
const mysql = require('mysql2/promise');
const config = require('../config');

const pool = mysql.createPool({
  host: config.MYSQL_HOST,
  port: config.MYSQL_PORT,
  user: config.MYSQL_USER,
  password: config.MYSQL_PASSWORD,
  database: config.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: config.MYSQL_CONNECTION_LIMIT,
  queueLimit: 0,
  timezone: '+08:00',
  dateStrings: true,
});

// 启动时检测连接
pool.on('connection', (conn) => {
  console.log(`✓ MySQL 新连接 #${conn.threadId}`);
});

module.exports = pool;
