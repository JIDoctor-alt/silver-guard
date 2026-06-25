-- =========================================================
-- Silver Guard · 点赞评论模块
-- 数据库迁移脚本 v3.0
-- 新增：评论表、活动点赞表
-- =========================================================
USE silver_guard;

SET NAMES utf8mb4;

-- =========================================================
-- 14 评论表（Comment）
-- =========================================================
CREATE TABLE IF NOT EXISTS comment (
    id              BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '评论ID',
    target_type     VARCHAR(32)      NOT NULL                     COMMENT '评论目标类型：CREATION/ACTIVITY/DANCE_STEP',
    target_id       BIGINT UNSIGNED  NOT NULL                     COMMENT '评论目标ID',
    user_id         BIGINT UNSIGNED  NOT NULL                     COMMENT '评论者ID',
    user_name       VARCHAR(64)      NOT NULL  DEFAULT '匿名用户'    COMMENT '评论者昵称',
    content         TEXT             NOT NULL                     COMMENT '评论内容',
    parent_id       BIGINT UNSIGNED  DEFAULT NULL                 COMMENT '父评论ID（回复用）',
    likes           INT UNSIGNED     NOT NULL  DEFAULT 0          COMMENT '评论点赞数',
    status          VARCHAR(16)      NOT NULL  DEFAULT 'PUBLISHED' COMMENT '状态：PUBLISHED/HIDDEN',
    gmt_create      DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '创建时间',
    gmt_modified    DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    deleted         TINYINT         NOT NULL  DEFAULT 0           COMMENT '软删除标记',
    PRIMARY KEY (id),
    KEY idx_target (target_type, target_id),
    KEY idx_user (user_id),
    KEY idx_parent (parent_id),
    KEY idx_gmt_create (gmt_create DESC)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='评论表';

-- =========================================================
-- 15 活动点赞表（ActivityLike）
-- =========================================================
CREATE TABLE IF NOT EXISTS activity_like (
    id              BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '点赞ID',
    target_type     VARCHAR(32)      NOT NULL                     COMMENT '点赞目标类型：CREATION/ACTIVITY/DANCE_STEP/SONG',
    target_id       BIGINT UNSIGNED  NOT NULL                     COMMENT '点赞目标ID',
    user_id         BIGINT UNSIGNED  NOT NULL                     COMMENT '点赞用户ID',
    gmt_create      DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '点赞时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_like (target_type, target_id, user_id),
    KEY idx_target (target_type, target_id),
    KEY idx_user (user_id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='点赞记录表';

-- =========================================================
-- 迁移完成
-- =========================================================