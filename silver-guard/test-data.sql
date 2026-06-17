# Silver Guard · 测试用例首次执行数据（Test Data v1.0）
# 版本：v1.0（基于 PRD v1.2 · AC-01~08）
# 用途：测试工程师直接复制到测试环境数据库或 API 调试工具
# 工具：Postman / curl / JMeter / 任意 HTTP 客户端

---
# ============================================================
# 准备：测试数据初始化（SQL）
# 执行：mysql -h test-host -u test_user -ptest1234 silver_guard < test-data.sql
# ============================================================

-- ============================================================
-- 测试社区
-- ============================================================
INSERT INTO community (id, name, code, district, address, contact_name, contact_phone, status, gmt_create, gmt_modified, deleted)
VALUES
  (1, '阳光社区第一网格', 'YG-001', '海淀区中关村街道', '北京市海淀区中关村南大街1号', '张主任', '13800138001', 1, NOW(3), NOW(3), 0),
  (2, '幸福社区第二网格', 'XF-002', '海淀区西二旗街道', '北京市海淀区西二旗大街2号', '李站长', '13800138002', 1, NOW(3), NOW(3), 0);

-- ============================================================
-- 测试用户（密码统一：Test@1234，BCrypt 哈希）
-- 哈希来源：BCrypt('Test@1234') 约 = $2a$10$...
-- 此处使用占位哈希，实际测试时由系统注册接口生成
-- ============================================================
INSERT INTO user (id, username, phone, password_hash, real_name, role, community_id, gender, status, gmt_create, gmt_modified, deleted)
VALUES
  -- 超级管理员
  (1, 'admin',  '13810000001', '$2a$10$placeholder_hash_admin', '系统管理员', 'SUPER_ADMIN', NULL, 1, 1, NOW(3), NOW(3), 0),
  -- 街道管理员
  (2, 'region_mgr', '13810000002', '$2a$10$placeholder_hash_region', '王街道长', 'REGION_ADMIN', 1, 1, 1, NOW(3), NOW(3), 0),
  -- 社区管理员
  (3, 'community_mgr', '13810000003', '$2a$10$placeholder_hash_community', '赵社区长', 'COMMUNITY_ADMIN', 1, 1, 1, NOW(3), NOW(3), 0),
  -- 网格员 A
  (4, 'grid_li', '13810000004', '$2a$10$placeholder_hash_grid_li', '李网格员', 'GRID_MEMBER', 1, 1, 1, NOW(3), NOW(3), 0),
  -- 网格员 B
  (5, 'grid_zhang', '13810000005', '$2a$10$placeholder_hash_grid_zhang', '张网格员', 'GRID_MEMBER', 1, 1, 1, NOW(3), NOW(3), 0),
  -- 家属（已绑定老人：张奶奶）
  (6, 'family_wang', '13810000006', '$2a$10$placeholder_hash_family_wang', '王先生', 'FAMILY', 1, 1, 1, NOW(3), NOW(3), 0),
  -- 家属（已绑定老人：李爷爷）
  (7, 'family_li2', '13810000007', '$2a$10$placeholder_hash_family_li2', '李女士', 'FAMILY', 1, 1, 1, NOW(3), NOW(3), 0);

-- ============================================================
-- 测试老人档案（10 名，全部知情同意已签署）
-- ============================================================
INSERT INTO elder (id, name, id_card_hash, gender, birth_date, phone, community_id, address,
                   risk_level, emergency_contact, tags, status,
                   guardian_user_id, grid_user_id, consent_signed, consent_signed_at,
                   gmt_create, gmt_modified, deleted)
VALUES
  -- 张奶奶（核心测试对象，已绑定家属，已绑定网格员）
  (1, '张桂兰', 'SHA256_IDCARD_ZHANG_001', 2, '1948-03-15', '13800001001', 1,
   '北京市海淀区中关村南大街1号1单元101',
   3, '[{"name":"王建国","phone":"13810000006","relation":"儿子"},{"name":"李大夫","phone":"13900001001","relation":"家庭医生"}]',
   '["独居","高血压","糖尿病","行动不便"]',
   1, 6, 4, 1, '2026-01-15 09:00:00', NOW(3), NOW(3), 0),

  -- 李爷爷（核心测试对象，有心脏病）
  (2, '李德福', 'SHA256_IDCARD_LI_002', 1, '1942-07-22', '13800001002', 1,
   '北京市海淀区中关村南大街1号2单元202',
   4, '[{"name":"李女士","phone":"13810000007","relation":"女儿"}]',
   '["独居","心脏病","心绞痛","高血压"]',
   1, 7, 4, 1, '2026-01-15 10:00:00', NOW(3), NOW(3), 0),

  -- 陈奶奶（低风险对照组）
  (3, '陈秀英', 'SHA256_IDCARD_CHEN_003', 2, '1955-11-08', '13800001003', 1,
   '北京市海淀区中关村南大街1号3单元301',
   1, '[{"name":"陈大力","phone":"13800001013","relation":"儿子"}]',
   '["独居","基本健康"]',
   1, NULL, 4, 1, '2026-02-01 10:00:00', NOW(3), NOW(3), 0),

  -- 普通测试老人 4-10
  (4, '刘美华', 'SHA256_IDCARD_LIU_004', 2, '1950-05-20', '13800001004', 1,
   '北京市海淀区中关村南大街1号4单元401', 2, '[{"name":"","phone":"","relation":""}]',
   '["独居","轻度慢病"]', 1, NULL, 4, 1, '2026-02-10 10:00:00', NOW(3), NOW(3), 0),

  (5, '赵国强', 'SHA256_IDCARD_ZHAO_005', 1, '1945-09-10', '13800001005', 1,
   '北京市海淀区中关村南大街2号1单元102', 3, '[{"name":"","phone":"","relation":""}]',
   '["独居","高血压","认知障碍"]', 1, NULL, 5, 1, '2026-02-15 10:00:00', NOW(3), NOW(3), 0),

  (6, '孙桂芳', 'SHA256_IDCARD_SUN_006', 2, '1952-12-01', '13800001006', 1,
   '北京市海淀区中关村南大街2号2单元201', 2, '[{"name":"","phone":"","relation":""}]',
   '["独居","骨关节病"]', 1, NULL, 4, 1, '2026-03-01 10:00:00', NOW(3), NOW(3), 0),

  (7, '周明远', 'SHA256_IDCARD_ZHOU_007', 1, '1948-08-15', '13800001007', 2,
   '北京市海淀区西二旗大街2号1单元101', 2, '[{"name":"","phone":"","relation":""}]',
   '["独居","糖尿病"]', 1, NULL, 5, 1, '2026-03-10 10:00:00', NOW(3), NOW(3), 0),

  (8, '吴兰英', 'SHA256_IDCARD_WU_008', 2, '1956-04-22', '13800001008', 2,
   '北京市海淀区西二旗大街2号2单元202', 1, '[{"name":"","phone":"","relation":""}]',
   '["独居"]', 1, NULL, 5, 1, '2026-03-15 10:00:00', NOW(3), NOW(3), 0),

  (9, '郑文博', 'SHA256_IDCARD_ZHENG_009', 1, '1943-02-28', '13800001009', 2,
   '北京市海淀区西二旗大街2号3单元301', 4, '[{"name":"","phone":"","relation":""}]',
   '["独居","心衰","长期卧床"]', 1, NULL, 4, 1, '2026-03-20 10:00:00', NOW(3), NOW(3), 0),

  (10, '王淑珍', 'SHA256_IDCARD_WANG_010', 2, '1958-06-18', '13800001010', 2,
   '北京市海淀区西二旗大街2号4单元401', 2, '[{"name":"","phone":"","relation":""}]',
   '["独居","慢病管理"]', 1, NULL, 5, 1, '2026-04-01 10:00:00', NOW(3), NOW(3), 0);

-- ============================================================
-- 测试设备（每老人配置多个设备）
-- ============================================================
INSERT INTO device (id, elder_id, device_type, vendor, sn, name, location, status,
                    threshold_json, online_at, offline_count, gmt_create, gmt_modified, deleted)
VALUES
  -- 张奶奶的设备组
  (1, 1, 'RADAR', 'XX科技', 'RADAR-ZHANG-001', '客厅毫米波雷达', '客厅', 1,
   '{"still_duration_min":120,"fall_confidence_threshold":0.75}',
   NOW(3), 0, NOW(3), NOW(3), 0),
  (2, 1, 'MOTION_IR', 'YY传感', 'IR-ZHANG-001', '卧室红外感应', '卧室', 1,
   '{"motion_interval_sec":300}',
   NOW(3), 0, NOW(3), NOW(3), 0),
  (3, 1, 'DOOR', 'ZZ门磁', 'DOOR-ZHANG-001', '大门门磁', '门口', 1,
   '{"night_open_duration_sec":300}',
   NOW(3), 0, NOW(3), NOW(3), 0),
  (4, 1, 'SOS', '紧急按钮', 'SOS-ZHANG-001', '卧室 SOS 按钮', '卧室', 1,
   '{}', NOW(3), 0, NOW(3), NOW(3), 0),
  (5, 1, 'BAND', '华为手环', 'BAND-ZHANG-001', '智能手环', '手腕', 1,
   '{"hr_abnormal_min":10,"hr_low_threshold":50,"hr_high_threshold":120}',
   NOW(3), 0, NOW(3), NOW(3), 0),

  -- 李爷爷的设备组
  (6, 2, 'RADAR', 'XX科技', 'RADAR-LI-002', '客厅毫米波雷达', '客厅', 1,
   '{"still_duration_min":60,"fall_confidence_threshold":0.80}',
   NOW(3), 0, NOW(3), NOW(3), 0),
  (7, 2, 'MOTION_IR', 'YY传感', 'IR-LI-002', '卧室红外感应', '卧室', 1,
   '{}', NOW(3), 0, NOW(3), NOW(3), 0),
  (8, 2, 'SOS', '紧急按钮', 'SOS-LI-002', '床头 SOS 按钮', '卧室', 1,
   '{}', NOW(3), 0, NOW(3), NOW(3), 0),

  -- 备用设备
  (9, 3, 'RADAR', 'XX科技', 'RADAR-CHEN-003', '客厅毫米波雷达', '客厅', 1,
   '{}', NOW(3), 0, NOW(3), NOW(3), 0),
  (10, 4, 'RADAR', 'XX科技', 'RADAR-LIU-004', '客厅毫米波雷达', '客厅', 0,
   '{}', NULL, 3, NOW(3), NOW(3), 0);  -- 设备 10：离线，测试离线告警

-- ============================================================
-- 模拟历史事件数据（用于报表测试）
-- ============================================================
INSERT INTO event (id, elder_id, device_id, event_type, event_level, confidence, source,
                   evidence_json, ai_model_version, ai_explanation,
                   first_report_at, assigned_user_id, status, escalation_level,
                   closed_by, closed_at, close_reason, community_id,
                   gmt_create, gmt_modified, deleted)
VALUES
  -- 模拟：张奶奶 近 7 天事件（用于家属端展示）
  (1, 1, 1, 'STILL', 2, 0.92, 'CLOUD',
   '{"duration_sec":7200,"last_motion":"14:30","hour":16}',
   'v1.0.0', '老人在客厅静止超过2小时，可能需要关注',
   DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 14 HOUR, 4, 'CLOSED',
   NULL, 4, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 15 HOUR,
   '已上门核实，老人午休中，正常', 1,
   DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 14 HOUR,
   DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 15 HOUR, 0),

  (2, 1, 1, 'FALL', 3, 0.95, 'CLOUD',
   '{"confidence":0.95,"room":"客厅","hour":22,"radar_signal":"SCATTERED"}',
   'v1.0.0', '客厅检测到疑似跌倒，高置信度，建议立即上门',
   DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 22 HOUR, 4, 'CLOSED',
   NULL, 4, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 23 HOUR,
   '误报反馈：老人打太极，AI 调整阈值', 1,
   DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 22 HOUR,
   DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 23 HOUR, 0),

  (3, 1, 4, 'SOS', 4, 1.00, 'MANUAL',
   '{"source":"SOS_BUTTON","room":"卧室","hour":8}',
   NULL, 'SOS 紧急求助，立即响应',
   DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR, 4, 'CLOSED',
   NULL, 4, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR,
   '老人胸闷，网格员陪同就医，正常处置', 1,
   DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR,
   DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR, 0),

  -- 李爷爷近 7 天事件
  (4, 2, 6, 'FALL', 4, 0.98, 'CLOUD',
   '{"confidence":0.98,"room":"客厅","hour":3}',
   'v1.0.0', '凌晨跌倒，高置信度，请立即上门',
   DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 3 HOUR, 4, 'FALSE_ALARM',
   NULL, NULL, NULL,
   '经核实为误报：被子掉落触发雷达', 1,
   DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 3 HOUR,
   DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 3 HOUR, 0),

  -- 待处置事件（用于 App 巡检清单）
  (5, 1, 1, 'OUT_OF_BED', 2, 0.88, 'CLOUD',
   '{"duration_sec":1800,"hour":1,"last_in_bed":"23:30"}',
   'v1.0.0', '凌晨离床超过30分钟，建议确认',
   DATE_SUB(NOW(), INTERVAL 2 HOUR), 4, 'OPEN',
   NULL, NULL, NULL, NULL, 1,
   DATE_SUB(NOW(), INTERVAL 2 HOUR),
   DATE_SUB(NOW(), INTERVAL 2 HOUR), 0),

  (6, 2, 6, 'STILL', 3, 0.93, 'CLOUD',
   '{"duration_sec":10800,"hour":10}',
   'v1.0.0', '静止超过3小时，置信度高，建议立即上门',
   DATE_SUB(NOW(), INTERVAL 1 HOUR), 4, 'ASSIGNED',
   4, NULL, NULL, NULL, 1,
   DATE_SUB(NOW(), INTERVAL 1 HOUR),
   DATE_SUB(NOW(), INTERVAL 1 HOUR), 0);

-- ============================================================
-- 通知记录（对应上述事件）
-- ============================================================
INSERT INTO notification (id, event_id, channel, receiver_id, receiver_type,
                           sent_at, read_at, ack_status, fail_reason, retry_count,
                           gmt_create, gmt_modified, deleted)
VALUES
  -- 张奶奶 SOS 通知链（3 通道）
  (1, 3, 'APP', 4, 'USER', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR,
   DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR + INTERVAL 5 MINUTE, 'ACK', NULL, 0,
   DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR,
   DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR, 0),
  (2, 3, 'SMS', 6, 'FAMILY', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR + INTERVAL 3 MINUTE,
   NULL, 'READ', NULL, 0,
   DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR,
   DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR, 0),
  (3, 3, 'CALL', 4, 'USER', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR + INTERVAL 1 MINUTE,
   DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR + INTERVAL 2 MINUTE, 'ACK', NULL, 0,
   DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR,
   DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR, 0),

  -- 李爷爷夜间跌倒通知链
  (4, 4, 'APP', 4, 'USER', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 3 HOUR,
   NULL, 'ACK', NULL, 0,
   DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 3 HOUR,
   DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 3 HOUR, 0),

  -- 待处置事件通知
  (5, 5, 'APP', 4, 'USER', DATE_SUB(NOW(), INTERVAL 2 HOUR), NULL, 'PENDING', NULL, 0,
   DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR), 0),
  (6, 6, 'APP', 4, 'USER', DATE_SUB(NOW(), INTERVAL 1 HOUR), NULL, 'PENDING', NULL, 0,
   DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR), 0);

-- ============================================================
-- 巡检记录
-- ============================================================
INSERT INTO patrol_record (id, elder_id, user_id, task_type, checkin_at,
                            elder_status, remark, photos, follow_up_flag,
                            gmt_create, gmt_modified, deleted)
VALUES
  (1, 1, 4, 'ROUTINE', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 10 HOUR,
   'NORMAL', '张奶奶状态良好，血压正常（140/90），已服药', NULL, 0,
   DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 10 HOUR,
   DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 10 HOUR, 0),
  (2, 2, 4, 'EMERGENCY', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 8 HOUR,
   'NORMAL', '经核实，李爷爷无恙，是被子触发误报。已调整雷达灵敏度。', NULL, 1,
   DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 8 HOUR,
   DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 8 HOUR, 0),
  (3, 1, 4, 'FOLLOW_UP', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR,
   'NORMAL', 'SOS 就医回访，老人已出院，状态稳定。', NULL, 0,
   DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR,
   DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR, 0);

---
# ============================================================
# 以下为 curl / Postman 可直接使用的 HTTP 接口测试数据
# Base URL：https://dev-api.silver-guard.cn
# Token：在「登录」接口获取后填入 Authorization: Bearer {token}
# ============================================================

---
# 【API-01】登录获取 Token
# =========================================================
### POST /api/v1/auth/login
### Headers: Content-Type: application/json
### Body (JSON):
{
  "phone": "13810000004",
  "code": "888888",
  "loginType": "SMS_CODE"
}

### 预期响应（200）：
{
  "code": 200,
  "data": {
    "token": "{JWT_TOKEN}",
    "refreshToken": "{REFRESH_TOKEN}",
    "userId": 4,
    "realName": "李网格员",
    "role": "GRID_MEMBER"
  }
}


---
# 【API-02】获取老人列表（AC-01 / AC-02 测试用）
# =========================================================
### GET /api/v1/elders?communityId=1&riskLevel=3&page=0&size=20
### Headers: Authorization: Bearer {token}

### 预期响应（200）：
{
  "code": 200,
  "data": {
    "content": [
      {
        "id": 1,
        "name": "张桂兰",
        "riskLevel": 3,
        "address": "北京市海淀区中关村南大街1号1单元101",
        "deviceCount": 5,
        "gridUserName": "李网格员",
        "status": "NORMAL"
      }
    ],
    "totalElements": 3,
    "totalPages": 1
  }
}


---
# 【API-03】设备数据上报（AC-01 / AC-02 / AC-03 核心接口）
# 场景 AC-01：模拟跌倒（FALL）—— 期望 30 秒内生成 L3 事件
# =========================================================
### POST /api/v1/devices/report
### Headers: Content-Type: application/json
### Body (JSON):
{
  "deviceId": 1,
  "deviceType": "RADAR",
  "sn": "RADAR-ZHANG-001",
  "elderId": 1,
  "timestamp": "{{current_timestamp_ms}}",
  "eventType": "FALL",
  "payload": {
    "signalType": "SCATTERED",
    "confidence": 0.95,
    "room": "客厅",
    "durationSec": 3
  },
  "signature": "HMAC_SHA256(payload, deviceSecret)"
}

### 预期 AC-01 验收：
### 1. HTTP 202 Accepted（即时返回）
### 2. 在 30 秒内，notification 表出现 receiver_id=4, channel=APP 的记录，ack_status=PENDING 或 ACK


---
# 【API-04】设备数据上报——模拟跌倒（夜间，期望 L4）
# 场景 AC-03：凌晨 03:00 跌倒 —— 期望生成 L4 事件
# =========================================================
### POST /api/v1/devices/report
### Headers: Content-Type: application/json
### Body (JSON):
{
  "deviceId": 1,
  "deviceType": "RADAR",
  "sn": "RADAR-ZHANG-001",
  "elderId": 1,
  "timestamp": "{{current_timestamp_ms}}",
  "eventType": "FALL",
  "payload": {
    "signalType": "SCATTERED",
    "confidence": 0.98,
    "room": "客厅",
    "durationSec": 5,
    "hour": 3,
    "isNight": true
  },
  "signature": "HMAC_SHA256(payload, deviceSecret)"
}


---
# 【API-05】设备数据上报——模拟长时间静止（≥ 2 小时）
# 场景 AC-02：静止 2 小时 —— 期望生成 L2 预警
# =========================================================
### POST /api/v1/devices/report
### Headers: Content-Type: application/json
### Body (JSON):
{
  "deviceId": 1,
  "deviceType": "RADAR",
  "sn": "RADAR-ZHANG-001",
  "elderId": 1,
  "timestamp": "{{current_timestamp_ms}}",
  "eventType": "STILL",
  "payload": {
    "durationSec": 7200,
    "lastMotion": "14:30",
    "hour": 16
  },
  "signature": "HMAC_SHA256(payload, deviceSecret)"
}


---
# 【API-06】SOS 按钮触发（US-07 新增）—— 期望直接生成 L4
# 场景 AC-03：SOS 按下 —— 期望立即生成 L4，不走 AI 研判
# =========================================================
### POST /api/v1/devices/report
### Headers: Content-Type: application/json
### Body (JSON):
{
  "deviceId": 4,
  "deviceType": "SOS",
  "sn": "SOS-ZHANG-001",
  "elderId": 1,
  "timestamp": "{{current_timestamp_ms}}",
  "eventType": "SOS",
  "payload": {
    "source": "SOS_BUTTON",
    "room": "卧室",
    "hour": 8
  },
  "signature": "HMAC_SHA256(payload, deviceSecret)"
}


---
# 【API-07】获取事件列表（巡检清单）
# 场景 AC-02：获取网格员今日巡检清单
# =========================================================
### GET /api/v1/events?communityId=1&userId=4&status=OPEN&page=0&size=20
### Headers: Authorization: Bearer {token}

### 预期 AC-02 验收：
### 事件列表按 event_level DESC, first_report_at DESC 排序


---
# 【API-08】获取事件详情（验证 AI 解释字段）
# =========================================================
### GET /api/v1/events/6
### Headers: Authorization: Bearer {token}

### 预期响应（200）：
{
  "code": 200,
  "data": {
    "id": 6,
    "elderId": 2,
    "elderName": "李德福",
    "eventType": "STILL",
    "eventLevel": 3,
    "confidence": 0.93,
    "source": "CLOUD",
    "aiModelVersion": "v1.0.0",
    "aiExplanation": "静止超过3小时，置信度高，建议立即上门",
    "status": "ASSIGNED",
    "firstReportAt": "2026-06-16T10:00:00+08:00"
  }
}


---
# 【API-09】事件处置（到场/关闭）—— AC-04 测试用
# 场景 AC-04：网格员处置事件后关闭
# =========================================================
### POST /api/v1/events/6/handle
### Headers: Content-Type: application/json; Authorization: Bearer {token}
### Body (JSON):
{
  "action": "CLOSE",
  "remark": "已上门核实，李爷爷在看电视，设备误报",
  "closeReason": "FALSE_ALARM",
  "checkinAt": "{{current_timestamp_ms}}"
}


---
# 【API-10】误报反馈（AC-07 隐私测试相关）—— 家属越权
# 场景 AC-05：陌生手机号绑定老人 —— 期望 403 Forbidden
# =========================================================
### POST /api/v1/elders/1/bind-family
### Headers: Content-Type: application/json
### Body (JSON):
{
  "elderId": 1,
  "familyPhone": "13999999999",
  "relation": "邻居"
}

### 预期 AC-05 验收：HTTP 403 Forbidden


---
# 【API-11】家属端——获取老人概况（AC-05）
# 场景：已绑定家属查看老人今日状态
# =========================================================
### GET /api/v1/family/elder/1/today-summary
### Headers: Authorization: Bearer {token}

### 预期响应（200）：
{
  "code": 200,
  "data": {
    "elderId": 1,
    "elderName": "张桂兰",
    "riskLevel": 3,
    "todayStatus": "NORMAL",
    "todayActivityScore": 78,
    "todayEvents": [
      {
        "eventId": 5,
        "eventType": "OUT_OF_BED",
        "eventLevel": 2,
        "aiExplanation": "凌晨离床超过30分钟，建议确认",
        "status": "OPEN"
      }
    ]
  }
}


---
# 【API-12】驾驶舱仪表盘（AC-06 性能测试）
# 场景：1000 户规模首页加载
# =========================================================
### GET /api/v1/dashboard/summary?communityId=1
### Headers: Authorization: Bearer {token}

### 预期性能：P95 响应时间 ≤ 2 秒


---
# 【API-13】越权访问测试（AC-07 安全）
# 场景：社区 A 的管理员访问社区 B 的老人
# =========================================================
### GET /api/v1/elders?communityId=2
### Headers: Authorization: Bearer {token}
### (当前 token 属于社区 1 的网格员)

### 预期 AC-07 验收：HTTP 403 Forbidden 或返回空列表


---
# 【API-14】审计日志验证（AC-07）
# 场景：执行任意写操作后，audit_log 表有记录
# =========================================================
### GET /api/v1/audit-logs?targetType=ELDER&page=0&size=10
### Headers: Authorization: Bearer {token}

### 预期：至少有一条记录，且 before_json 和 after_json 均不含明文身份证号
