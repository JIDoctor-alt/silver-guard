-- =========================================================
-- Silver Guard · 银龄广场模块
-- 数据库迁移脚本 v2.0
-- 新增：社区活动表、音乐创作素材表
-- =========================================================
USE silver_guard;

SET NAMES utf8mb4;

-- =========================================================
-- 10 社区活动表（Activity）
-- =========================================================
CREATE TABLE IF NOT EXISTS activity (
    id              BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '活动ID',
    title           VARCHAR(200)     NOT NULL                     COMMENT '活动标题',
    category        VARCHAR(32)      NOT NULL                     COMMENT '活动类型：DANCE/LECTURE/FESTIVAL/SPORT/OTHER',
    description     TEXT             NOT NULL                     COMMENT '活动描述',
    location        VARCHAR(255)     NOT NULL                     COMMENT '活动地点',
    start_time      DATETIME(3)     NOT NULL                     COMMENT '开始时间',
    end_time        DATETIME(3)     NOT NULL                     COMMENT '结束时间',
    max_participants INT UNSIGNED    DEFAULT NULL                 COMMENT '最大参与人数（NULL=不限）',
    current_participants INT UNSIGNED NOT NULL DEFAULT 0          COMMENT '当前报名人数',
    cover_url       VARCHAR(512)     DEFAULT NULL                 COMMENT '封面图片URL',
    organizer_id    BIGINT UNSIGNED  NOT NULL                     COMMENT '组织者（网格员）ID',
    community_id    BIGINT UNSIGNED  NOT NULL                     COMMENT '所属社区ID',
    status          VARCHAR(16)      NOT NULL  DEFAULT 'DRAFT'    COMMENT '状态：DRAFT/PUBLISHED/ONGOING/ENDED/CANCELLED',
    tags            JSON             DEFAULT NULL                 COMMENT '标签JSON：["广场舞","比赛"]',
    gmt_create      DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '创建时间',
    gmt_modified    DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    deleted         TINYINT         NOT NULL  DEFAULT 0           COMMENT '软删除标记',
    PRIMARY KEY (id),
    KEY idx_category (category),
    KEY idx_status (status),
    KEY idx_community (community_id),
    KEY idx_start_time (start_time),
    KEY idx_organizer (organizer_id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='社区活动表';

-- =========================================================
-- 11 活动报名表（ActivityRegistration）
-- =========================================================
CREATE TABLE IF NOT EXISTS activity_registration (
    id              BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '报名ID',
    activity_id     BIGINT UNSIGNED  NOT NULL                     COMMENT '活动ID',
    user_id         BIGINT UNSIGNED  NOT NULL                     COMMENT '报名用户ID',
    elder_id        BIGINT UNSIGNED  DEFAULT NULL                 COMMENT '代报名老人ID（家属代报）',
    name            VARCHAR(64)      NOT NULL                     COMMENT '报名人姓名',
    phone           VARCHAR(20)      NOT NULL                     COMMENT '联系电话',
    remark          VARCHAR(255)     DEFAULT NULL                 COMMENT '备注',
    status          VARCHAR(16)      NOT NULL  DEFAULT 'REGISTERED' COMMENT '状态：REGISTERED/CANCELLED/ATTENDED',
    gmt_create      DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '报名时间',
    gmt_modified    DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    deleted         TINYINT         NOT NULL  DEFAULT 0           COMMENT '软删除标记',
    PRIMARY KEY (id),
    UNIQUE KEY uk_activity_user (activity_id, user_id),
    KEY idx_activity (activity_id),
    KEY idx_user (user_id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='活动报名表';

-- =========================================================
-- 12 音乐创作素材表（MusicMaterial）
-- =========================================================
CREATE TABLE IF NOT EXISTS music_material (
    id              BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '素材ID',
    title           VARCHAR(200)     NOT NULL                     COMMENT '素材标题',
    category        VARCHAR(32)      NOT NULL                     COMMENT '素材类型：INSTRUMENT/RHYTHM/SCALE/MELODY/HARMONY/THEORY',
    sub_category    VARCHAR(64)      DEFAULT NULL                 COMMENT '子分类：如"民族乐器"、"节奏型"、"调式"',
    description     TEXT             DEFAULT NULL                 COMMENT '素材描述',
    content         JSON             NOT NULL                     COMMENT '素材内容JSON',
    difficulty      VARCHAR(16)      DEFAULT 'BEGINNER'           COMMENT '难度：BEGINNER/INTERMEDIATE/ADVANCED',
    tags            JSON             DEFAULT NULL                 COMMENT '标签JSON',
    gmt_create      DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '创建时间',
    gmt_modified    DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    deleted         TINYINT         NOT NULL  DEFAULT 0           COMMENT '软删除标记',
    PRIMARY KEY (id),
    KEY idx_category (category),
    KEY idx_difficulty (difficulty)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='音乐创作素材表';

-- =========================================================
-- 13 用户创作表（UserCreation）
-- =========================================================
CREATE TABLE IF NOT EXISTS user_creation (
    id              BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '创作ID',
    user_id         BIGINT UNSIGNED  NOT NULL                     COMMENT '创作者ID',
    type            VARCHAR(16)      NOT NULL                     COMMENT '创作类型：LYRICS/MELODY/BOTH',
    title           VARCHAR(200)     NOT NULL                     COMMENT '作品标题',
    content         JSON             NOT NULL                     COMMENT '作品内容JSON（歌词/旋律）',
    description     TEXT             DEFAULT NULL                 COMMENT '创作说明',
    likes           INT UNSIGNED     NOT NULL  DEFAULT 0          COMMENT '点赞数',
    comments_count  INT UNSIGNED     NOT NULL  DEFAULT 0          COMMENT '评论数',
    status          VARCHAR(16)      NOT NULL  DEFAULT 'PUBLISHED' COMMENT '状态：DRAFT/PUBLISHED/HIDDEN',
    gmt_create      DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '创建时间',
    gmt_modified    DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    deleted         TINYINT         NOT NULL  DEFAULT 0           COMMENT '软删除标记',
    PRIMARY KEY (id),
    KEY idx_user (user_id),
    KEY idx_type (type),
    KEY idx_status (status),
    KEY idx_gmt_create (gmt_create DESC)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='用户创作表';

-- =========================================================
-- 迁移完成
-- =========================================================