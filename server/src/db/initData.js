// ============================================================
// 乐龄守护 · 初始化种子数据
// 仅当数据库无数据时自动插入
// ============================================================
const bcrypt = require('bcryptjs');
const pool = require('./mysql');

async function initData() {
  const now = new Date();
  const insert = (sql, params) => pool.query(sql, params).then(() => {});

  // 01 社区
  const [[{ c: communityCount }]] = await pool.query('SELECT COUNT(*) as c FROM community');
  if (communityCount === 0) {
    await insert(
      `INSERT INTO community (name, code, district, address, contact_name, contact_phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['智慧养老示范社区', 'COM001', '北京市海淀区', '中关村大街1号', '王主任', '13800138000', 1]
    );
    console.log('✓ 插入默认社区');
  }

  // 02 用户
  const [[{ c: userCount }]] = await pool.query('SELECT COUNT(*) as c FROM user WHERE phone = ?', ['13800000001']);
  if (userCount === 0) {
    const hash = await bcrypt.hash('password123', 10);
    await insert(
      `INSERT INTO user (community_id, username, password_hash, real_name, phone, role, status, last_login_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [1, 'grid_admin', hash, '网格员小张', '13800000001', 'GRID_ADMIN', 1, now]
    );
    // 家属账号
    const hash2 = await bcrypt.hash('password123', 10);
    await insert(
      `INSERT INTO user (community_id, username, password_hash, real_name, phone, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [1, 'family_01', hash2, '张三', '13900000001', 'FAMILY', 1]
    );
    console.log('✓ 插入默认用户: 13800000001 / password123 (网格员)');
    console.log('✓ 插入家属账号: 13900000001 / password123 (家属)');
  }

  // 03 老人档案
  const [[{ c: elderCount }]] = await pool.query('SELECT COUNT(*) as c FROM elder');
  if (elderCount === 0) {
    const elders = [
      ['张秀兰', 'HASH001', 2, '1945-03-15', '13900000010', '海淀区中关村大街1号1单元301', 2],
      ['李国华', 'HASH002', 1, '1938-08-22', '13900000011', '海淀区中关村大街1号2单元402', 3],
      ['王淑芬', 'HASH003', 2, '1950-01-08', '13900000012', '海淀区中关村大街2号3单元201', 1],
      ['赵建军', 'HASH004', 1, '1942-11-30', '13900000013', '海淀区中关村大街2号1单元501', 2],
      ['孙美华', 'HASH005', 2, '1955-05-12', '13900000014', '海淀区中关村大街3号2单元102', 2],
      ['周德明', 'HASH006', 1, '1935-09-18', '13900000015', '海淀区中关村大街3号4单元303', 3],
      ['钱玉珍', 'HASH007', 2, '1948-12-03', '13900000016', '海淀区中关村大街4号1单元202', 1],
      ['吴长根', 'HASH008', 1, '1940-06-25', '13900000017', '海淀区中关村大街4号2单元401', 2],
    ];
    for (const e of elders) {
      const [name, idCardHash, gender, birthDate, phone, address, riskLevel] = e;
      await insert(
        `INSERT INTO elder (name, id_card_hash, gender, birth_date, phone, community_id, address, risk_level, tags, status, guardian_user_id, grid_user_id, consent_signed, consent_signed_at, gmt_create, gmt_modified, deleted)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?, '["独居"]', 1, 1, 1, 1, ?, ?, ?, 0)`,
        [name, idCardHash, gender, birthDate, phone, address, riskLevel, now, now, now]
      );
    }
    console.log(`✓ 插入 ${elders.length} 位老人档案`);
  }

  // 04 设备
  const [[{ c: deviceCount }]] = await pool.query('SELECT COUNT(*) as c FROM device');
  if (deviceCount === 0) {
    const devices = [
      [1, 'SMARTWATCH', 'xiaomi', 'SN202400001', '智能手表-张秀兰', '老人手腕佩戴', 1],
      [2, 'FALL_SENSOR', 'huawei', 'SN202400002', '跌倒传感器-李国华', '客厅墙壁', 1],
      [3, 'SMARTBAND', 'honor', 'SN202400003', '智能手环-王淑芬', '老人手腕佩戴', 1],
      [4, 'DOOR_SENSOR', 'aqara', 'SN202400004', '门禁传感器-赵建军', '入户门', 1],
      [5, 'MOTION_SENSOR', 'aqara', 'SN202400005', '活动传感器', '卧室', 0],
      [6, 'SMARTWATCH', 'xiaomi', 'SN202400006', '智能手表-周德明', '老人手腕佩戴', 1],
    ];
    for (const d of devices) {
      await insert(
        `INSERT INTO device (elder_id, device_type, vendor, sn, name, location, status, offline_count, gmt_create, gmt_modified, deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0)`,
        [...d, now, now]
      );
    }
    console.log(`✓ 插入 ${devices.length} 台设备`);
  }

  // 05 预警事件
  const [[{ c: eventCount }]] = await pool.query('SELECT COUNT(*) as c FROM event');
  if (eventCount === 0) {
    const events = [
      [2, 2, 'FALL_DETECTED', 4, 0.92, 'AI_FALL_MODEL', 'OPEN', null],
      [1, 1, 'INACTIVITY_ALERT', 3, 0.78, 'MOTION_SENSOR', 'ASSIGNED', 1],
      [4, 4, 'HEART_RATE_ANOMALY', 3, 0.85, 'SMARTWATCH', 'CLOSED', 1],
      [3, 3, 'DOOR_OPEN_NIGHT', 2, 0.65, 'DOOR_SENSOR', 'CLOSED', 1],
      [6, 6, 'FALL_DETECTED', 4, 0.88, 'AI_FALL_MODEL', 'OPEN', null],
      [2, 2, 'INACTIVITY_ALERT', 2, 0.70, 'MOTION_SENSOR', 'FALSE_ALARM', 1],
    ];
    for (let i = 0; i < events.length; i++) {
      const [elderId, deviceId, eventType, eventLevel, confidence, source, status, assignedUserId] = events[i];
      const closedBy = status === 'CLOSED' || status === 'FALSE_ALARM' ? 1 : null;
      const closedAt = status === 'CLOSED' || status === 'FALSE_ALARM' ? now : null;
      const closeReason = status === 'CLOSED' ? '网格员上门确认，老人安好' : status === 'FALSE_ALARM' ? '误报' : null;
      await insert(
        `INSERT INTO event (elder_id, device_id, event_type, event_level, confidence, source, first_report_at, assigned_user_id, status, closed_by, closed_at, close_reason, community_id, gmt_create, gmt_modified, deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 0)`,
        [elderId, deviceId, eventType, eventLevel, confidence, source, now, assignedUserId, status, closedBy, closedAt, closeReason, now, now]
      );
    }
    console.log(`✓ 插入 ${events.length} 条预警事件`);
  }

  // 06 巡检记录
  const [[{ c: patrolCount }]] = await pool.query('SELECT COUNT(*) as c FROM patrol_record');
  if (patrolCount === 0) {
    const records = [
      [1, 1, 'ROUTINE', 'NORMAL', '电话确认老人状态良好', 0],
      [2, 1, 'ROUTINE', 'NORMAL', '上门巡检，老人身体状况良好', 0],
      [3, 1, 'EMERGENCY', 'NORMAL', '接到预警后上门，确认误报', 1],
      [4, 1, 'ROUTINE', 'NORMAL', '定期电话回访', 0],
      [6, 1, 'FOLLOW_UP', 'NORMAL', '糖尿病用药提醒，老人已按医嘱服用', 0],
    ];
    for (let i = 0; i < records.length; i++) {
      const [elderId, userId, taskType, elderStatus, remark, followUpFlag] = records[i];
      const checkinAt = new Date(Date.now() - i * 26 * 3600 * 1000);
      await insert(
        `INSERT INTO patrol_record (elder_id, user_id, task_type, checkin_at, elder_status, remark, follow_up_flag, gmt_create, gmt_modified, deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [elderId, userId, taskType, checkinAt, elderStatus, remark, followUpFlag, now, now]
      );
    }
    console.log(`✓ 插入 ${records.length} 条巡检记录`);
  }

  console.log('✓ 种子数据初始化完成');
}

module.exports = initData;
