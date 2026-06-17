-- =========================================================
-- Silver Guard · Silver Guard 智能养老预警系统
-- 数据库初始化脚本 v1.0
-- 数据库：MySQL 8.0+
-- 说明：单体架构，所有表在单一数据库实例中
--       使用 Flyway 管理的迁移脚本（V1__init_schema.sql）
--       禁止手工修改表结构，所有变更走 Flyway 版本化脚本
-- =========================================================

-- ---------------------------- 库创建 ----------------------------
CREATE DATABASE IF NOT EXISTS silver_guard
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE silver_guard;

-- ---------------------------- 公共字段宏（DDL 注释参考）----------------------------
-- 所有业务表建议字段：
--   id          BIGINT UNSIGNED  主键，自增
--   gmt_create  DATETIME(3)      创建时间，精确到毫秒
--   gmt_modified DATETIME(3)     更新时间，精确到毫秒
--   deleted     TINYINT          软删除标记（0=正常,1=删除）

-- =========================================================
-- 01 社区表（Community）
-- =========================================================
CREATE TABLE community (
    id              BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '社区ID',
    name            VARCHAR(100)     NOT NULL                     COMMENT '社区名称',
    code            VARCHAR(32)      NOT NULL                     COMMENT '社区编码（唯一）',
    district        VARCHAR(64)      DEFAULT NULL                 COMMENT '所属街道/行政区',
    address         VARCHAR(255)    DEFAULT NULL                 COMMENT '详细地址',
    contact_name    VARCHAR(64)     DEFAULT NULL                 COMMENT '社区负责人姓名',
    contact_phone   VARCHAR(20)     DEFAULT NULL                 COMMENT '社区负责人电话',
    status          TINYINT         NOT NULL  DEFAULT 1           COMMENT '状态：0=停用 1=正常',
    gmt_create      DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '创建时间',
    gmt_modified    DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    deleted         TINYINT         NOT NULL  DEFAULT 0           COMMENT '软删除标记',
    PRIMARY KEY (id),
    UNIQUE KEY uk_code (code),
    KEY idx_district (district),
    KEY idx_status (status)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='社区表';

-- =========================================================
-- 02 用户表（User）— 含网格员/管理员/家属
-- =========================================================
CREATE TABLE user (
    id              BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '用户ID',
    username        VARCHAR(64)      NOT NULL                     COMMENT '用户名',
    phone           VARCHAR(20)      NOT NULL                     COMMENT '手机号（登录账号）',
    password_hash   VARCHAR(255)     NOT NULL                     COMMENT '密码（BCrypt）',
    real_name       VARCHAR(64)      DEFAULT NULL                 COMMENT '真实姓名',
    role            VARCHAR(32)      NOT NULL                     COMMENT '角色：SUPER_ADMIN/REGION_ADMIN/COMMUNITY_ADMIN/GRID_MEMBER/FAMILY',
    community_id    BIGINT UNSIGNED  DEFAULT NULL                 COMMENT '所属社区ID',
    gender          TINYINT          DEFAULT NULL                 COMMENT '性别：0=未知 1=男 2=女',
    avatar_url      VARCHAR(512)     DEFAULT NULL                 COMMENT '头像URL',
    status          TINYINT         NOT NULL  DEFAULT 1           COMMENT '状态：0=禁用 1=正常',
    last_login_at   DATETIME(3)      DEFAULT NULL                 COMMENT '最后登录时间',
    last_login_ip   VARCHAR(64)      DEFAULT NULL                 COMMENT '最后登录IP',
    gmt_create      DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '创建时间',
    gmt_modified    DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    deleted         TINYINT         NOT NULL  DEFAULT 0           COMMENT '软删除标记',
    PRIMARY KEY (id),
    UNIQUE KEY uk_phone (phone),
    KEY idx_role (role),
    KEY idx_community (community_id),
    KEY idx_status (status)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='用户表（网格员/管理员/家属）';

-- =========================================================
-- 03 老人档案表（Elder）— 核心主档
-- =========================================================
CREATE TABLE elder (
    id                  BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '老人ID',
    name                VARCHAR(64)      NOT NULL                     COMMENT '姓名',
    id_card_hash        VARCHAR(64)      NOT NULL                     COMMENT '身份证号（SHA-256哈希，用于去重，不明文存储）',
    gender              TINYINT          NOT NULL                     COMMENT '性别：0=未知 1=男 2=女',
    birth_date          DATE             NOT NULL                     COMMENT '出生日期',
    phone               VARCHAR(20)      DEFAULT NULL                 COMMENT '老人本人电话',
    community_id        BIGINT UNSIGNED  NOT NULL                     COMMENT '所属社区ID',
    address             VARCHAR(255)     NOT NULL                     COMMENT '详细住址',
    risk_level          TINYINT         NOT NULL  DEFAULT 1           COMMENT '风险等级：1=低 2=中 3=高 4=极高',
    emergency_contact   JSON             DEFAULT NULL                 COMMENT '紧急联系人JSON：[{"name":"","phone":"","relation":""}]',
    tags                JSON             DEFAULT NULL                 COMMENT '标签JSON：["独居","高血压","糖尿病"]',
    face_photo_url      VARCHAR(512)     DEFAULT NULL                 COMMENT '人脸照片URL（可选，边缘端加密存储）',
    status              TINYINT         NOT NULL  DEFAULT 1           COMMENT '状态：0=停用 1=正常 2=离世/注销',
    guardian_user_id    BIGINT UNSIGNED  DEFAULT NULL                 COMMENT '监护人用户ID（家属账号）',
    grid_user_id        BIGINT UNSIGNED  DEFAULT NULL                 COMMENT '负责网格员ID',
    consent_signed      TINYINT         NOT NULL  DEFAULT 0           COMMENT '知情同意书是否签署：0=未签 1=已签',
    consent_signed_at   DATETIME(3)      DEFAULT NULL                 COMMENT '签署时间',
    gmt_create          DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '创建时间',
    gmt_modified        DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    deleted             TINYINT         NOT NULL  DEFAULT 0           COMMENT '软删除标记',
    PRIMARY KEY (id),
    UNIQUE KEY uk_id_card_hash (id_card_hash),
    KEY idx_community (community_id),
    KEY idx_risk_level (risk_level),
    KEY idx_grid_user (grid_user_id),
    KEY idx_guardian (guardian_user_id),
    KEY idx_status (status),
    -- 复合索引：深分页优化（cursor-based pagination）
    KEY idx_community_created (community_id, gmt_create DESC)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='老人档案表';

-- =========================================================
-- 04 设备表（Device）
-- =========================================================
CREATE TABLE device (
    id              BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '设备ID',
    elder_id        BIGINT UNSIGNED  NOT NULL                     COMMENT '绑定的老人ID',
    device_type     VARCHAR(32)      NOT NULL                     COMMENT '设备类型：RADAR/MOTION_IR/DOOR/SMOKE/WATER/SOS/BAND/THERMOSTAT',
    vendor          VARCHAR(64)      DEFAULT NULL                 COMMENT '设备厂商/型号',
    sn              VARCHAR(128)     NOT NULL                     COMMENT '设备序列号（SN）',
    name            VARCHAR(100)     DEFAULT NULL                 COMMENT '设备名称/位置描述，如"客厅毫米波雷达"',
    location        VARCHAR(64)      DEFAULT NULL                 COMMENT '安装位置：客厅/卧室/卫生间/门口',
    status          TINYINT         NOT NULL  DEFAULT 1           COMMENT '状态：0=离线 1=在线 2=故障 3=已拆除',
    threshold_json  JSON             DEFAULT NULL                 COMMENT '个性化阈值JSON：{"still_duration_min":120,"night_threshold":30}',
    online_at       DATETIME(3)      DEFAULT NULL                 COMMENT '最近在线时间',
    offline_count    INT UNSIGNED     NOT NULL  DEFAULT 0          COMMENT '累计离线次数',
    gmt_create      DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '创建时间',
    gmt_modified    DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    deleted         TINYINT         NOT NULL  DEFAULT 0           COMMENT '软删除标记',
    PRIMARY KEY (id),
    UNIQUE KEY uk_sn (sn),
    KEY idx_elder (elder_id),
    KEY idx_type (device_type),
    KEY idx_status (status)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='设备表';

-- =========================================================
-- 05 事件表（Event）— 核心业务表
-- =========================================================
CREATE TABLE event (
    id                  BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '事件ID',
    elder_id            BIGINT UNSIGNED  NOT NULL                     COMMENT '关联老人ID',
    device_id           BIGINT UNSIGNED  DEFAULT NULL                 COMMENT '触发设备ID',
    event_type          VARCHAR(32)      NOT NULL                     COMMENT '事件类型：FALL/STILL/OUT_OF_BED/NIGHT_DOOR/SOS/INACTIVITY/EATING_MISSING/MOOD_ANOMALY',
    event_level         TINYINT         NOT NULL                     COMMENT '预警等级：1=L1提示 2=L2关注 3=L3紧急 4=L4特急',
    confidence          DECIMAL(5,4)     NOT NULL                     COMMENT 'AI 置信度：0.0000~1.0000',
    source              VARCHAR(32)      NOT NULL                     COMMENT '来源：EDGE/CLOUD/MANUAL',
    evidence_json       JSON             DEFAULT NULL                 COMMENT '触发证据JSON：{"signal":"RADAR_STILL","duration_sec":7200,"hour":3}',
    ai_model_version    VARCHAR(32)      DEFAULT NULL                 COMMENT 'AI 模型版本',
    ai_explanation      TEXT             DEFAULT NULL                 COMMENT 'AI 研判解释（供网格员参考）',
    first_report_at     DATETIME(3)     NOT NULL                     COMMENT '首次上报时间',
    assigned_user_id     BIGINT UNSIGNED  DEFAULT NULL                 COMMENT '当前处理人ID',
    status               VARCHAR(32)      NOT NULL  DEFAULT 'OPEN'    COMMENT '状态：OPEN/ASSIGNED/ONGOING/CLOSED/FALSE_ALARM/ESCALATED',
    escalation_level    TINYINT          DEFAULT NULL                 COMMENT '已升级至第几级（0=未升级）',
    closed_by           BIGINT UNSIGNED  DEFAULT NULL                 COMMENT '关闭人ID',
    closed_at           DATETIME(3)      DEFAULT NULL                 COMMENT '关闭时间',
    close_reason        VARCHAR(255)     DEFAULT NULL                 COMMENT '关闭/误报原因',
    community_id        BIGINT UNSIGNED  NOT NULL                     COMMENT '所属社区ID',
    gmt_create          DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '创建时间',
    gmt_modified        DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    deleted             TINYINT         NOT NULL  DEFAULT 0           COMMENT '软删除标记',
    PRIMARY KEY (id),
    KEY idx_elder (elder_id),
    KEY idx_level (event_level),
    KEY idx_type (event_type),
    KEY idx_status (status),
    KEY idx_assigned (assigned_user_id),
    KEY idx_first_report (first_report_at),
    KEY idx_community (community_id),
    -- 复合索引：深分页优化（按老人+时间倒序）
    KEY idx_elder_created (elder_id, gmt_create DESC),
    -- 复合索引：社区+等级+时间（驾驶舱看板查询）
    KEY idx_community_level_created (community_id, event_level, gmt_create DESC)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='事件/预警表';

-- =========================================================
-- 06 通知记录表（Notification）
-- =========================================================
CREATE TABLE notification (
    id              BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '通知ID',
    event_id        BIGINT UNSIGNED  NOT NULL                     COMMENT '关联事件ID',
    channel         VARCHAR(16)      NOT NULL                     COMMENT '通知通道：APP/SMS/CALL/WECHAT/WEBHOOK',
    receiver_id     BIGINT UNSIGNED  NOT NULL                     COMMENT '接收人ID（user表ID）',
    receiver_type   VARCHAR(16)      NOT NULL                     COMMENT '接收人类型：USER/FAMILY/GUARDIAN/DUTY',
    sent_at         DATETIME(3)     NOT NULL                     COMMENT '发送时间',
    read_at         DATETIME(3)      DEFAULT NULL                 COMMENT '已读时间',
    ack_status      VARCHAR(16)      NOT NULL  DEFAULT 'PENDING'  COMMENT '状态：PENDING/SENT/READ/ACK/FAILED',
    fail_reason     VARCHAR(255)     DEFAULT NULL                 COMMENT '失败原因',
    retry_count     TINYINT          NOT NULL  DEFAULT 0          COMMENT '重试次数',
    gmt_create      DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '创建时间',
    gmt_modified    DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    deleted         TINYINT         NOT NULL  DEFAULT 0           COMMENT '软删除标记',
    PRIMARY KEY (id),
    KEY idx_event (event_id),
    KEY idx_receiver (receiver_id),
    KEY idx_channel (channel),
    KEY idx_ack_status (ack_status),
    KEY idx_sent_at (sent_at)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='通知记录表';

-- =========================================================
-- 07 巡检记录表（PatrolRecord）— 补充表（非MVP核心但必要）
-- =========================================================
CREATE TABLE patrol_record (
    id              BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '巡检记录ID',
    elder_id        BIGINT UNSIGNED  NOT NULL                     COMMENT '老人ID',
    user_id         BIGINT UNSIGNED  NOT NULL                     COMMENT '网格员ID',
    task_type       VARCHAR(16)      NOT NULL                     COMMENT '任务类型：ROUTINE/EMERGENCY/FOLLOW_UP',
    checkin_at      DATETIME(3)     NOT NULL                     COMMENT '打卡时间',
    location_lat    DECIMAL(10,6)    DEFAULT NULL                 COMMENT '打卡坐标纬度',
    location_lng    DECIMAL(10,6)    DEFAULT NULL                 COMMENT '打卡坐标经度',
    elder_status    VARCHAR(16)      NOT NULL                     COMMENT '老人状态：NORMAL/ABNORMAL/CANNOT_CONTACT/REFUSED',
    remark          TEXT             DEFAULT NULL                 COMMENT '文字备注',
    photos          JSON             DEFAULT NULL                 COMMENT '照片URL列表JSON：["url1","url2"]',
    voice_url       VARCHAR(512)     DEFAULT NULL                 COMMENT '语音备注URL',
    follow_up_flag  TINYINT          NOT NULL  DEFAULT 0           COMMENT '是否标记需再次回访：0=否 1=是',
    gmt_create      DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '创建时间',
    gmt_modified    DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    deleted         TINYINT         NOT NULL  DEFAULT 0           COMMENT '软删除标记',
    PRIMARY KEY (id),
    KEY idx_elder (elder_id),
    KEY idx_user (user_id),
    KEY idx_checkin_at (checkin_at)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='巡检记录表';

-- =========================================================
-- 08 老人日常画像表（DailyProfile）— 补充表
-- =========================================================
CREATE TABLE daily_profile (
    id              BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '画像ID',
    elder_id        BIGINT UNSIGNED  NOT NULL                     COMMENT '老人ID',
    profile_date     DATE             NOT NULL                     COMMENT '画像日期',
    activity_score  INT              DEFAULT NULL                 COMMENT '活动得分：0~100',
    sleep_summary   JSON             DEFAULT NULL                 COMMENT '睡眠摘要JSON：{"hours":7.5,"quality":"GOOD","night_wake_count":1}',
    hr_avg          INT              DEFAULT NULL                 COMMENT '日均心率',
    steps           INT              DEFAULT NULL                 COMMENT '日步数',
    anomaly_signals JSON             DEFAULT NULL                 COMMENT '异常信号JSON：{"still_count":0,"fall_count":0}',
    gmt_create      DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '创建时间',
    gmt_modified    DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    deleted         TINYINT         NOT NULL  DEFAULT 0           COMMENT '软删除标记',
    PRIMARY KEY (id),
    UNIQUE KEY uk_elder_date (elder_id, profile_date),
    KEY idx_elder (elder_id),
    KEY idx_date (profile_date)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='老人日常画像表';

-- =========================================================
-- 09 审计日志表（AuditLog）— 必须，不可篡改
-- =========================================================
CREATE TABLE audit_log (
    id              BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '审计日志ID',
    actor_id        BIGINT UNSIGNED  DEFAULT NULL                 COMMENT '操作人ID',
    actor_name      VARCHAR(64)      DEFAULT NULL                 COMMENT '操作人姓名',
    actor_role      VARCHAR(32)      DEFAULT NULL                 COMMENT '操作人角色',
    action          VARCHAR(64)      NOT NULL                     COMMENT '操作类型：CREATE/UPDATE/DELETE/LOGIN/LOGOUT/EXPORT',
    target_type     VARCHAR(64)      NOT NULL                     COMMENT '操作对象类型：ELDER/DEVICE/EVENT/NOTIFICATION/USER/SYSTEM_CONFIG',
    target_id       BIGINT UNSIGNED  DEFAULT NULL                 COMMENT '操作对象ID',
    before_json     JSON             DEFAULT NULL                 COMMENT '变更前JSON',
    after_json      JSON             DEFAULT NULL                 COMMENT '变更后JSON',
    ip_address      VARCHAR(64)      DEFAULT NULL                 COMMENT '操作IP',
    user_agent      VARCHAR(512)     DEFAULT NULL                 COMMENT 'User-Agent',
    request_id      VARCHAR(64)      DEFAULT NULL                 COMMENT '请求链路ID（Trace-ID）',
    gmt_create      DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '操作时间',
    PRIMARY KEY (id),
    KEY idx_actor (actor_id),
    KEY idx_target (target_type, target_id),
    KEY idx_action (action),
    KEY idx_gmt_create (gmt_create),
    -- 审计日志禁止建 updated 触发器，GMT_modified 仅用于业务表
    -- 注意：audit_log 表本身不允许 UPDATE 和 DELETE（由数据库层或应用层强制禁止）
    -- 如需加固，可在应用层或数据库层添加禁止 UPDATE/DELETE 的触发器
    -- 此处为注释参考，实际实现可选用 MySQL 事件 + 权限控制 或 应用层拦截
    -- 为防止 DELETE，可创建 MySQL 事件定期检查，或在 Flyway 脚本中 GRANT REVOKE 限制
    CONSTRAINT chk_audit_log_immutable CHECK (1=1)  -- 占位约束，真实防护靠应用层
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='审计日志表（只允许 INSERT）';

-- =========================================================
-- Flyway 版本记录（MySQL 手动创建，Flyway 自动管理）
-- =========================================================
-- Flyway_schema_history 表由 Flyway 自动创建，此处仅注释说明
-- 建议：flyway.locations = classpath:db/migration
--       命名规范：V1__init_schema.sql  V2__add_xxx.sql  V3__modify_xxx.sql

-- =========================================================
-- 安全建议（DDL 层面）
-- =========================================================
-- 1. 应用连接数据库使用专用账号 silver_guard_app，仅授予 DML + SELECT 权限
--    CREATE USER 'silver_guard_app'@'%' IDENTIFIED BY '***';
--    GRANT SELECT, INSERT, UPDATE, DELETE ON silver_guard.* TO 'silver_guard_app'@'%';
--    FLUSH PRIVILEGES;
-- 2. 审计日志写入使用独立账号 silver_guard_audit，仅授予 INSERT 权限
--    CREATE USER 'silver_guard_audit'@'%' IDENTIFIED BY '***';
--    GRANT INSERT ON silver_guard.audit_log TO 'silver_guard_audit'@'%';
--    FLUSH PRIVILEGES;
-- 3. DBA 操作使用 silver_guard_dba 账号，授予 DDL 权限，通过 Flyway 迁移执行
--    禁止应用直接连接 DBA 账号

-- =========================================================
-- 初始化完成
-- =========================================================
