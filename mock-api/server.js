// ============================================================
// Silver Guard · Mock API Server
// 连接真实 MySQL/Redis，实现核心 REST API
// ============================================================

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { createClient } = require('redis');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'silver-guard-dev-secret-change-in-prod';

// ============================================================
// 数据库连接（支持环境变量注入）
// ============================================================
const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_PORT = Number(process.env.MYSQL_PORT || 3306);
const MYSQL_USER = process.env.MYSQL_USER || 'test_user';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || 'test1234';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'silver_guard';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';

const pool = mysql.createPool({
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
});

const redisClientOptions = { socket: { host: REDIS_HOST, port: REDIS_PORT } };
if (REDIS_PASSWORD) redisClientOptions.password = REDIS_PASSWORD;
const redis = createClient(redisClientOptions);
redis.on('error', err => console.log('Redis Client Error', err.message));

(async () => {
  try {
    await redis.connect();
    console.log('✓ Redis connected');
  } catch (e) { console.log('Redis connect skipped:', e.message); }
})();

// ============================================================
// 初始化测试数据（如无数据则插入）
// ============================================================
async function initTestData() {
  const now = new Date();
  try {
    // 社区
    const [comCount] = await pool.query('SELECT COUNT(*) as c FROM community');
    if (comCount[0].c === 0) {
      await pool.query(
        'INSERT INTO community (name, code, district, address, contact_name, contact_phone, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['智慧养老示范社区', 'COM001', '北京市海淀区', '中关村大街1号', '王主任', '13800138000', 1]
      );
      console.log('✓ 插入默认社区');
    }

    // 用户
    const [userCount] = await pool.query('SELECT COUNT(*) as c FROM user WHERE username = ?', ['admin']);
    if (userCount[0].c === 0) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await pool.query(
        'INSERT INTO user (community_id, username, password_hash, real_name, phone, role, status, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [1, 'admin', hashedPassword, '网格员小张', '13800000001', 'GRID_ADMIN', 1, now]
      );
      console.log('✓ 插入默认用户: 13800000001 / password123');
    }

    // 老人档案
    const [elderCount] = await pool.query('SELECT COUNT(*) as c FROM elder');
    if (elderCount[0].c === 0) {
      const elders = [
        ['张秀兰', 'HASH001', 2, '1945-03-15', '13900000010', 1, '海淀区中关村大街1号1单元301', 2, JSON.stringify(['慢性病', '独居'])],
        ['李国华', 'HASH002', 1, '1938-08-22', '13900000011', 1, '海淀区中关村大街1号2单元402', 3, JSON.stringify(['高血压', '糖尿病', '独居'])],
        ['王淑芬', 'HASH003', 2, '1950-01-08', '13900000012', 1, '海淀区中关村大街2号3单元201', 1, JSON.stringify(['独居'])],
        ['赵建军', 'HASH004', 1, '1942-11-30', '13900000013', 1, '海淀区中关村大街2号1单元501', 2, JSON.stringify(['心脏病', '高血压'])],
        ['孙美华', 'HASH005', 2, '1955-05-12', '13900000014', 1, '海淀区中关村大街3号2单元102', 2, JSON.stringify(['骨质疏松', '独居'])],
        ['周德明', 'HASH006', 1, '1935-09-18', '13900000015', 1, '海淀区中关村大街3号4单元303', 3, JSON.stringify(['糖尿病', '心脏病', '高血压', '独居'])],
        ['钱玉珍', 'HASH007', 2, '1948-12-03', '13900000016', 1, '海淀区中关村大街4号1单元202', 1, JSON.stringify([])],
        ['吴长根', 'HASH008', 1, '1940-06-25', '13900000017', 1, '海淀区中关村大街4号2单元401', 2, JSON.stringify(['前列腺疾病', '独居'])],
      ];
      for (const e of elders) {
        await pool.query(
          'INSERT INTO elder (name, id_card_hash, gender, birth_date, phone, community_id, address, risk_level, tags, status, guardian_user_id, grid_user_id, consent_signed, consent_signed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 1, ?)',
          [...e, now]
        );
      }
      console.log('✓ 插入 8 位老人档案');
    }

    // 设备
    const [deviceCount] = await pool.query('SELECT COUNT(*) as c FROM device');
    if (deviceCount[0].c === 0) {
      const devices = [
        [1, 'SMARTWATCH', 'xiaomi', 'SN202400001', '智能手表', '老人手腕佩戴', 1],
        [2, 'FALL_SENSOR', 'huawei', 'SN202400002', '跌倒传感器', '客厅墙壁', 1],
        [3, 'SMARTBAND', 'honor', 'SN202400003', '智能手环', '老人手腕佩戴', 1],
        [4, 'DOOR_SENSOR', 'aqara', 'SN202400004', '门禁传感器', '入户门', 1],
        [5, 'MOTION_SENSOR', 'aqara', 'SN202400005', '活动传感器', '卧室', 0],
        [6, 'SMARTWATCH', 'xiaomi', 'SN202400006', '智能手表', '老人手腕佩戴', 1],
      ];
      for (const d of devices) {
        await pool.query(
          'INSERT INTO device (elder_id, device_type, vendor, sn, name, location, status, offline_count) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
          d
        );
      }
      console.log('✓ 插入 6 台设备');
    }

    // 预警事件
    const [eventCount] = await pool.query('SELECT COUNT(*) as c FROM event');
    if (eventCount[0].c === 0) {
      const events = [
        { elder_id: 2, device_id: 2, event_type: 'FALL_DETECTED', event_level: 4, confidence: 0.92, source: 'AI_FALL_MODEL', status: 'OPEN', assigned_user_id: null },
        { elder_id: 1, device_id: 1, event_type: 'INACTIVITY_ALERT', event_level: 3, confidence: 0.78, source: 'MOTION_SENSOR', status: 'ASSIGNED', assigned_user_id: 1 },
        { elder_id: 4, device_id: 4, event_type: 'HEART_RATE_ANOMALY', event_level: 3, confidence: 0.85, source: 'SMARTWATCH', status: 'CLOSED', assigned_user_id: 1, closed_by: 1, close_reason: '网格员上门确认，老人安好', closed_at: now },
        { elder_id: 3, device_id: 3, event_type: 'DOOR_OPEN_NIGHT', event_level: 2, confidence: 0.65, source: 'DOOR_SENSOR', status: 'CLOSED', assigned_user_id: 1, closed_by: 1, close_reason: '正常夜间活动，已确认', closed_at: now },
        { elder_id: 6, device_id: 6, event_type: 'FALL_DETECTED', event_level: 4, confidence: 0.88, source: 'AI_FALL_MODEL', status: 'OPEN', assigned_user_id: null },
        { elder_id: 2, device_id: 2, event_type: 'INACTIVITY_ALERT', event_level: 2, confidence: 0.70, source: 'MOTION_SENSOR', status: 'FALSE_ALARM', assigned_user_id: 1, closed_by: 1, close_reason: '误报 - 设备检测偏差', closed_at: now },
      ];
      for (const e of events) {
        await pool.query(
          'INSERT INTO event (elder_id, device_id, event_type, event_level, confidence, source, first_report_at, assigned_user_id, status, closed_by, closed_at, close_reason, community_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
          [e.elder_id, e.device_id, e.event_type, e.event_level, e.confidence, e.source, now, e.assigned_user_id, e.status, e.closed_by || null, e.closed_at || null, e.close_reason || null]
        );
      }
      console.log('✓ 插入 6 条预警事件');
    }

    // 巡检记录
    const [patrolCount] = await pool.query('SELECT COUNT(*) as c FROM patrol_record');
    if (patrolCount[0].c === 0) {
      const records = [
        { elder_id: 1, user_id: 1, task_type: 'ROUTINE', elder_status: 'NORMAL', remark: '电话确认老人状态良好', follow_up_flag: 0 },
        { elder_id: 2, user_id: 1, task_type: 'ROUTINE', elder_status: 'NORMAL', remark: '上门巡检，老人身体状况良好', follow_up_flag: 0 },
        { elder_id: 3, user_id: 1, task_type: 'EMERGENCY', elder_status: 'NORMAL', remark: '接到预警后上门，确认误报', follow_up_flag: 1 },
        { elder_id: 4, user_id: 1, task_type: 'ROUTINE', elder_status: 'NORMAL', remark: '定期电话回访', follow_up_flag: 0 },
        { elder_id: 6, user_id: 1, task_type: 'FOLLOW_UP', elder_status: 'NORMAL', remark: '糖尿病用药提醒，老人已按医嘱服用', follow_up_flag: 0 },
      ];
      for (let i = 0; i < records.length; i++) {
        const r = records[i];
        const checkin = new Date(Date.now() - (i * 24 + Math.floor(Math.random() * 12)) * 3600 * 1000);
        await pool.query(
          'INSERT INTO patrol_record (elder_id, user_id, task_type, checkin_at, elder_status, remark, follow_up_flag) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [r.elder_id, r.user_id, r.task_type, checkin, r.elder_status, r.remark, r.follow_up_flag]
        );
      }
      console.log('✓ 插入 5 条巡检记录');
    }

    // 通知
    const [notifCount] = await pool.query('SELECT COUNT(*) as c FROM notification');
    if (notifCount[0].c === 0) {
      const notifs = [
        { event_id: 1, channel: 'SMS', receiver_id: 1, receiver_type: 'USER', sent_at: now, ack_status: 'PENDING' },
        { event_id: 2, channel: 'CALL', receiver_id: 1, receiver_type: 'USER', sent_at: now, ack_status: 'ACKED' },
        { event_id: 5, channel: 'SMS', receiver_id: 1, receiver_type: 'USER', sent_at: now, ack_status: 'PENDING' },
      ];
      for (const n of notifs) {
        await pool.query(
          'INSERT INTO notification (event_id, channel, receiver_id, receiver_type, sent_at, ack_status, retry_count) VALUES (?, ?, ?, ?, ?, ?, 0)',
          [n.event_id, n.channel, n.receiver_id, n.receiver_type, n.sent_at, n.ack_status]
        );
      }
      console.log('✓ 插入 3 条通知');
    }
  } catch (err) {
    console.error('初始化测试数据失败:', err.message);
  }
}

// ============================================================
// 中间件
// ============================================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// JWT 认证中间件
function authRequired(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录', data: null });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: '登录已过期', data: null });
  }
}

// 统一响应格式
function ok(res, data, message = 'success') {
  res.json({ code: 200, message, data, timestamp: Date.now(), traceId: req => 'trace-' + Date.now() });
}

// ============================================================
// 工具函数
// ============================================================
function calcAge(birthDate) {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// ============================================================
// 认证接口
// ============================================================
app.post('/api/auth/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ code: 400, message: '手机号和密码不能为空', data: null });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM user WHERE phone = ? AND deleted = 0', [phone]);
    if (rows.length === 0) {
      return res.status(401).json({ code: 401, message: '用户不存在', data: null });
    }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ code: 401, message: '密码错误', data: null });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, realName: user.real_name, communityId: user.community_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    await pool.query('UPDATE user SET last_login_at = ? WHERE id = ?', [new Date(), user.id]);
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
          realName: user.real_name,
          role: user.role,
          communityId: user.community_id,
          status: user.status,
        }
      },
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

app.get('/api/auth/me', authRequired, (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: req.user,
    timestamp: Date.now(),
  });
});

// ============================================================
// 驾驶舱接口
// ============================================================
app.get('/api/dashboard/summary', authRequired, async (req, res) => {
  try {
    const communityId = req.user.communityId || 1;
    const [elderRows] = await pool.query('SELECT COUNT(*) as c FROM elder WHERE community_id = ? AND deleted = 0', [communityId]);
    const [deviceRows] = await pool.query('SELECT COUNT(*) as total, SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as online FROM device WHERE deleted = 0');
    const [eventRows] = await pool.query('SELECT COUNT(*) as c FROM event WHERE community_id = ? AND deleted = 0 AND DATE(gmt_create) = CURDATE()', [communityId]);
    const [urgentRows] = await pool.query('SELECT COUNT(*) as c FROM event WHERE community_id = ? AND deleted = 0 AND event_level >= 3 AND DATE(gmt_create) = CURDATE()', [communityId]);
    const [falseAlarmRows] = await pool.query('SELECT COUNT(*) as total, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as false_count FROM event WHERE community_id = ? AND deleted = 0', ['FALSE_ALARM', communityId]);

    res.json({
      code: 200,
      message: 'success',
      data: {
        communityId,
        totalElders: elderRows[0].c,
        totalDevices: deviceRows[0].total,
        onlineDevices: deviceRows[0].online || 0,
        todayEvents: eventRows[0].c,
        todayL3Events: urgentRows[0].c,
        todayL4Events: Math.floor(urgentRows[0].c / 2),
        avgResponseSeconds: 180,
        falsePositiveRate: falseAlarmRows[0].total > 0 ? (falseAlarmRows[0].false_count / falseAlarmRows[0].total).toFixed(2) : 0.12,
      },
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

// ============================================================
// 老人档案接口
// ============================================================
app.get('/api/elder/page', authRequired, async (req, res) => {
  try {
    const { riskLevel, cursor, size = 20 } = req.query;
    const communityId = req.user.communityId || 1;
    let query = 'SELECT * FROM elder WHERE community_id = ? AND deleted = 0';
    const params = [communityId];
    if (riskLevel) { query += ' AND risk_level = ?'; params.push(Number(riskLevel)); }
    if (cursor) { query += ' AND id < ?'; params.push(Number(cursor)); }
    query += ' ORDER BY id DESC LIMIT ?';
    params.push(Number(size) + 1);
    const [rows] = await pool.query(query, params);
    const hasMore = rows.length > size;
    const records = rows.slice(0, size).map(r => ({
      id: r.id,
      name: r.name,
      gender: r.gender,
      age: calcAge(r.birth_date),
      communityId: r.community_id,
      riskLevel: r.risk_level,
      tags: (typeof r.tags === 'string') ? JSON.parse(r.tags) : (r.tags || []),
      status: r.status,
      gridUserName: '网格员',
      guardianPhones: [],
    }));
    res.json({
      code: 200,
      message: 'success',
      data: {
        records,
        nextCursor: hasMore ? records[records.length - 1].id : null,
        size: Number(size),
        hasMore,
      },
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

app.get('/api/elder/:id', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM elder WHERE id = ? AND deleted = 0', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '老人不存在', data: null });
    }
    const r = rows[0];
    res.json({
      code: 200,
      message: 'success',
      data: {
        id: r.id,
        name: r.name,
        gender: r.gender,
        age: calcAge(r.birth_date),
        communityId: r.community_id,
        address: r.address,
        riskLevel: r.risk_level,
        tags: (typeof r.tags === 'string') ? JSON.parse(r.tags) : (r.tags || []),
      status: r.status,
      phone: r.phone,
      gridUserId: r.grid_user_id,
      guardianUserId: r.guardian_user_id,
    },
      timestamp: Date.now(),
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

app.post('/api/elder', authRequired, async (req, res) => {
  try {
    const { name, gender, birthDate, phone, address, riskLevel, tags } = req.body;
    const idCardHash = bcrypt.hashSync(name + phone, 1).substring(0, 128);
    const now = new Date();
    const [result] = await pool.query(
      `INSERT INTO elder (name, id_card_hash, gender, birth_date, phone, community_id, address, risk_level, tags, status, grid_user_id, guardian_user_id, consent_signed, consent_signed_at, gmt_create, gmt_modified, deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, idCardHash, gender, birthDate, phone || '', req.user.communityId || 1, address || '', riskLevel || 1, tags ? tags.join(',') : '', 1, 1, 1, 1, now, now, now, 0]
    );
    res.json({ code: 200, message: '创建成功', data: result.insertId, timestamp: Date.now() });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

app.put('/api/elder/:id', authRequired, async (req, res) => {
  try {
    const { riskLevel, tags, status, address, phone } = req.body;
    await pool.query(
      'UPDATE elder SET risk_level = COALESCE(?, risk_level), tags = COALESCE(?, tags), status = COALESCE(?, status), address = COALESCE(?, address), phone = COALESCE(?, phone), gmt_modified = ? WHERE id = ?',
      [riskLevel, tags ? tags.join(',') : null, status, address, phone, new Date(), req.params.id]
    );
    res.json({ code: 200, message: '更新成功', data: null, timestamp: Date.now() });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

app.delete('/api/elder/:id', authRequired, async (req, res) => {
  try {
    await pool.query('UPDATE elder SET deleted = 1, gmt_modified = ? WHERE id = ?', [new Date(), req.params.id]);
    res.json({ code: 200, message: '删除成功', data: null, timestamp: Date.now() });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

// ============================================================
// 预警事件接口
// ============================================================
app.get('/api/event/page', authRequired, async (req, res) => {
  try {
    const { status, eventLevel, cursor, size = 20 } = req.query;
    const communityId = req.user.communityId || 1;
    let query = 'SELECT * FROM event WHERE community_id = ? AND deleted = 0';
    const params = [communityId];
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (eventLevel) { query += ' AND event_level = ?'; params.push(Number(eventLevel)); }
    if (cursor) { query += ' AND id < ?'; params.push(Number(cursor)); }
    query += ' ORDER BY id DESC LIMIT ?';
    params.push(Number(size) + 1);
    const [rows] = await pool.query(query, params);
    const hasMore = rows.length > size;
    const records = rows.slice(0, size).map(r => ({
      id: r.id,
      elderId: r.elder_id,
      deviceId: r.device_id,
      eventType: r.event_type,
      eventLevel: r.event_level,
      confidence: r.confidence,
      source: r.source,
      status: r.status,
      assignedUserId: r.assigned_user_id,
      closedBy: r.closed_by,
      closedAt: r.closed_at,
      closeReason: r.close_reason,
      communityId: r.community_id,
      gmtCreate: r.gmt_create,
    }));
    res.json({
      code: 200,
      message: 'success',
      data: {
        records,
        nextCursor: hasMore ? records[records.length - 1].id : null,
        size: Number(size),
        hasMore,
      },
      timestamp: Date.now(),
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

app.get('/api/event/:id', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM event WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '事件不存在', data: null });
    }
    const r = rows[0];
    res.json({
      code: 200,
      message: 'success',
      data: {
        id: r.id,
        elderId: r.elder_id,
        deviceId: r.device_id,
        eventType: r.event_type,
        eventLevel: r.event_level,
        confidence: r.confidence,
        source: r.source,
        status: r.status,
        assignedUserId: r.assigned_user_id,
        closedBy: r.closed_by,
        closedAt: r.closed_at,
        closeReason: r.close_reason,
        communityId: r.community_id,
        gmtCreate: r.gmt_create,
      },
      timestamp: Date.now(),
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

app.put('/api/event/:id/assign', authRequired, async (req, res) => {
  try {
    const { userId } = req.body;
    await pool.query('UPDATE event SET status = ?, assigned_user_id = ?, gmt_modified = ? WHERE id = ?',
      ['ASSIGNED', userId || req.user.id, new Date(), req.params.id]);
    res.json({ code: 200, message: '已分配', data: null, timestamp: Date.now() });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

app.put('/api/event/:id/handle', authRequired, async (req, res) => {
  try {
    const { closeReason } = req.body;
    await pool.query('UPDATE event SET status = ?, closed_by = ?, closed_at = ?, close_reason = ?, gmt_modified = ? WHERE id = ?',
      ['CLOSED', req.user.id, new Date(), closeReason || '已处理', new Date(), req.params.id]);
    res.json({ code: 200, message: '已处理', data: null, timestamp: Date.now() });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

app.put('/api/event/:id/false-alarm', authRequired, async (req, res) => {
  try {
    const { reason } = req.body;
    await pool.query('UPDATE event SET status = ?, closed_by = ?, closed_at = ?, close_reason = ?, gmt_modified = ? WHERE id = ?',
      ['FALSE_ALARM', req.user.id, new Date(), reason || '误报', new Date(), req.params.id]);
    res.json({ code: 200, message: '已标记误报', data: null, timestamp: Date.now() });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

// ============================================================
// 设备接口
// ============================================================
app.get('/api/device/list', authRequired, async (req, res) => {
  try {
    const { page = 1, size = 20 } = req.query;
    const [rows] = await pool.query('SELECT * FROM device WHERE deleted = 0 ORDER BY id DESC LIMIT ? OFFSET ?',
      [Number(size), (Number(page) - 1) * Number(size)]);
    const [countRows] = await pool.query('SELECT COUNT(*) as total FROM device WHERE deleted = 0');
    const records = rows.map(r => ({
      id: r.id,
      elderId: r.elder_id,
      deviceType: r.device_type,
      vendor: r.vendor,
      sn: r.sn,
      name: r.name,
      location: r.location,
      status: r.status,
      offlineCount: r.offline_count,
      gmtCreate: r.gmt_create,
    }));
    res.json({
      code: 200,
      message: 'success',
      data: { records, total: countRows[0].total },
      timestamp: Date.now(),
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

// ============================================================
// 巡检记录接口
// ============================================================
app.get('/api/patrol/page', authRequired, async (req, res) => {
  try {
    const { cursor, size = 20 } = req.query;
    const communityId = req.user.communityId || 1;
    let query = 'SELECT * FROM patrol_record WHERE community_id = ? AND deleted = 0';
    const params = [communityId];
    if (cursor) { query += ' AND id < ?'; params.push(Number(cursor)); }
    query += ' ORDER BY id DESC LIMIT ?';
    params.push(Number(size) + 1);
    const [rows] = await pool.query(query, params);
    const hasMore = rows.length > size;
    const records = rows.slice(0, size).map(r => ({
      id: r.id,
      elderId: r.elder_id,
      userId: r.user_id,
      taskType: r.task_type,
      checkinAt: r.checkin_at,
      elderStatus: r.elder_status,
      remark: r.remark,
      followUpFlag: r.follow_up_flag === 1,
    }));
    res.json({
      code: 200,
      message: 'success',
      data: {
        records,
        nextCursor: hasMore ? records[records.length - 1].id : null,
        size: Number(size),
        hasMore,
      },
      timestamp: Date.now(),
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

// ============================================================
// 健康检查
// ============================================================
app.get('/actuator/health', (req, res) => {
  res.json({ status: 'UP', components: { mysql: 'UP', redis: 'UP' } });
});

app.get('/', (req, res) => {
  res.json({ service: 'Silver Guard Mock API', version: '1.0.0', status: 'running' });
});

// ============================================================
// 启动服务
// ============================================================
(async () => {
  // 等待 MySQL 就绪（Docker 中 MySQL 启动较慢）
  let retry = 0;
  const maxRetry = 30;
  while (retry < maxRetry) {
    try {
      await pool.query('SELECT 1');
      console.log(`✓ MySQL connected (${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE})`);
      break;
    } catch (e) {
      retry++;
      console.log(`⟳ MySQL not ready (${retry}/${maxRetry}): ${e.message.replace(/\s+/g,' ').slice(0,80)}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  if (retry >= maxRetry) { console.error('✗ Failed to connect MySQL, exiting'); process.exit(1); }
  await initTestData();
  app.listen(PORT, '0.0.0.0', () => {
    console.log('=============================================');
    console.log('✓ Silver Guard Mock API Server started');
    console.log(`✓ HTTP: http://localhost:${PORT}`);
    console.log(`✓ Health: http://localhost:${PORT}/actuator/health`);
    console.log(`✓ Login: POST http://localhost:${PORT}/api/auth/login`);
    console.log(`✓ Test account: 13800000001 / password123`);
    console.log('=============================================');
  });
})();
