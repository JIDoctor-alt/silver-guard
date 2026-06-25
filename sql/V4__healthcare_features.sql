-- =========================================================
-- Silver Guard · 健康档案与中医养生模块
-- 数据库迁移脚本 v4.0
-- 新增：健康档案、体质辨识、节气养生、知识扩展
-- =========================================================
USE silver_guard;

SET NAMES utf8mb4;

-- =========================================================
-- 14 健康档案表（HealthRecord）
-- 终端感知数据自动归档，中西医双视角
-- =========================================================
CREATE TABLE IF NOT EXISTS health_record (
    id              BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '记录ID',
    elder_id        BIGINT UNSIGNED  NOT NULL                     COMMENT '老人ID',
    record_date     DATE             NOT NULL                     COMMENT '记录日期',
    blood_pressure_sys  INT              DEFAULT NULL             COMMENT '收缩压(mmHg)',
    blood_pressure_dia  INT              DEFAULT NULL             COMMENT '舒张压(mmHg)',
    blood_glucose   DECIMAL(5,2)     DEFAULT NULL                 COMMENT '血糖(mmol/L)',
    heart_rate      INT              DEFAULT NULL                 COMMENT '心率(bpm)',
    blood_oxygen    INT              DEFAULT NULL                 COMMENT '血氧(%)',
    body_temp       DECIMAL(4,1)     DEFAULT NULL                 COMMENT '体温(℃)',
    sleep_hours     DECIMAL(3,1)     DEFAULT NULL                 COMMENT '睡眠时长(h)',
    steps           INT              DEFAULT NULL                 COMMENT '步数',
    weight          DECIMAL(5,1)     DEFAULT NULL                 COMMENT '体重(kg)',
    tcm_constitution VARCHAR(32)     DEFAULT NULL                 COMMENT '中医体质：平和质/气虚质/阳虚质/阴虚质/痰湿质/湿热质/血瘀质/气郁质/特禀质',
    mood            VARCHAR(16)      DEFAULT NULL                 COMMENT '情绪状态：良好/一般/低落',
    source          VARCHAR(16)      NOT NULL  DEFAULT 'DEVICE'   COMMENT '数据来源：DEVICE/MANUAL/HOSPITAL',
    remark          TEXT             DEFAULT NULL                 COMMENT '备注',
    gmt_create      DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '创建时间',
    gmt_modified    DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    deleted         TINYINT         NOT NULL  DEFAULT 0           COMMENT '软删除标记',
    PRIMARY KEY (id),
    UNIQUE KEY uk_elder_date (elder_id, record_date),
    KEY idx_elder (elder_id),
    KEY idx_date (record_date),
    KEY idx_tcm (tcm_constitution)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='健康档案表';

-- =========================================================
-- 15 中医体质评估表（ConstitutionAssessment）
-- =========================================================
CREATE TABLE IF NOT EXISTS constitution_assessment (
    id              BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '评估ID',
    elder_id        BIGINT UNSIGNED  NOT NULL                     COMMENT '老人ID',
    assess_date     DATE             NOT NULL                     COMMENT '评估日期',
    constitution    VARCHAR(32)      NOT NULL                     COMMENT '体质类型',
    score           INT              NOT NULL                     COMMENT '体质得分(0-100)',
    features        JSON             DEFAULT NULL                 COMMENT '体质特征JSON',
    recommendations JSON             DEFAULT NULL                 COMMENT '调理建议JSON',
    assessed_by     VARCHAR(64)      DEFAULT NULL                 COMMENT '评估人',
    gmt_create      DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '创建时间',
    gmt_modified    DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    deleted         TINYINT         NOT NULL  DEFAULT 0           COMMENT '软删除标记',
    PRIMARY KEY (id),
    KEY idx_elder (elder_id),
    KEY idx_date (assess_date)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='中医体质评估表';

-- =========================================================
-- 16 节气养生知识表（SolarTermHealth）
-- =========================================================
CREATE TABLE IF NOT EXISTS solar_term_health (
    id              BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '知识ID',
    term_name       VARCHAR(32)      NOT NULL                     COMMENT '节气名称：立春/雨水/惊蛰...',
    term_order      INT              NOT NULL                     COMMENT '节气序号(1-24)',
    season          VARCHAR(16)      NOT NULL                     COMMENT '季节：春/夏/秋/冬',
    summary         VARCHAR(500)     NOT NULL                     COMMENT '养生要义',
    diet            JSON             DEFAULT NULL                 COMMENT '饮食建议JSON',
    exercise        JSON             DEFAULT NULL                 COMMENT '运动建议JSON',
    acupoints       JSON             DEFAULT NULL                 COMMENT '穴位保健JSON',
    lifestyle       TEXT             DEFAULT NULL                 COMMENT '起居建议',
    recipes         JSON             DEFAULT NULL                 COMMENT '推荐食谱JSON',
    gmt_create      DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '创建时间',
    gmt_modified    DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    deleted         TINYINT         NOT NULL  DEFAULT 0           COMMENT '软删除标记',
    PRIMARY KEY (id),
    UNIQUE KEY uk_term (term_name),
    KEY idx_season (season)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='节气养生知识表';

-- =========================================================
-- 17 反诈防骗知识库（AntiFraudKnowledge）
-- =========================================================
CREATE TABLE IF NOT EXISTS anti_fraud_knowledge (
    id              BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '知识ID',
    category        VARCHAR(32)      NOT NULL                     COMMENT '诈骗类型：PHONE/NETWORK/DOOR/INVESTMENT/HEALTH',
    title           VARCHAR(200)     NOT NULL                     COMMENT '标题',
    description     TEXT             NOT NULL                     COMMENT '案例描述',
    warning_signs   JSON             DEFAULT NULL                 COMMENT '警示特征JSON',
    prevention      TEXT             NOT NULL                     COMMENT '防范措施',
    risk_level      VARCHAR(16)      NOT NULL  DEFAULT 'MEDIUM'   COMMENT '风险等级：LOW/MEDIUM/HIGH',
    gmt_create      DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '创建时间',
    gmt_modified    DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    deleted         TINYINT         NOT NULL  DEFAULT 0           COMMENT '软删除标记',
    PRIMARY KEY (id),
    KEY idx_category (category),
    KEY idx_risk (risk_level)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='反诈防骗知识库';

-- =========================================================
-- 18 养老政策知识库（PolicyKnowledge）
-- =========================================================
CREATE TABLE IF NOT EXISTS policy_knowledge (
    id              BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '知识ID',
    category        VARCHAR(32)      NOT NULL                     COMMENT '政策类型：PENSION/MEDICAL/SUBSIDY/CARE/HOUSING',
    title           VARCHAR(200)     NOT NULL                     COMMENT '政策标题',
    summary         TEXT             NOT NULL                     COMMENT '政策摘要',
    detail          TEXT             DEFAULT NULL                 COMMENT '详细内容',
    applicable_region VARCHAR(64)    DEFAULT NULL                 COMMENT '适用地区',
    effective_date  DATE             DEFAULT NULL                 COMMENT '生效日期',
    keywords        JSON             DEFAULT NULL                 COMMENT '搜索关键词JSON',
    gmt_create      DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '创建时间',
    gmt_modified    DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    deleted         TINYINT         NOT NULL  DEFAULT 0           COMMENT '软删除标记',
    PRIMARY KEY (id),
    KEY idx_category (category),
    KEY idx_region (applicable_region)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='养老政策知识库';

-- =========================================================
-- 19 积分表（UserPoints）
-- =========================================================
CREATE TABLE IF NOT EXISTS user_points (
    id              BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '积分ID',
    user_id         BIGINT UNSIGNED  NOT NULL                     COMMENT '用户ID',
    points          INT              NOT NULL  DEFAULT 0          COMMENT '当前积分',
    total_earned    INT              NOT NULL  DEFAULT 0          COMMENT '累计获得',
    total_spent     INT              NOT NULL  DEFAULT 0          COMMENT '累计消费',
    gmt_create      DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '创建时间',
    gmt_modified    DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    deleted         TINYINT         NOT NULL  DEFAULT 0           COMMENT '软删除标记',
    PRIMARY KEY (id),
    UNIQUE KEY uk_user (user_id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='用户积分表';

-- =========================================================
-- 20 积分流水表（PointsLog）
-- =========================================================
CREATE TABLE IF NOT EXISTS points_log (
    id              BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '流水ID',
    user_id         BIGINT UNSIGNED  NOT NULL                     COMMENT '用户ID',
    type            VARCHAR(16)      NOT NULL                     COMMENT '类型：EARN/SPEND',
    amount          INT              NOT NULL                     COMMENT '积分数量',
    balance_after   INT              NOT NULL                     COMMENT '操作后余额',
    reason          VARCHAR(255)     NOT NULL                     COMMENT '原因',
    ref_type        VARCHAR(32)      DEFAULT NULL                 COMMENT '关联类型：ACTIVITY/CREATION/CHECKIN',
    ref_id          BIGINT UNSIGNED  DEFAULT NULL                 COMMENT '关联ID',
    gmt_create      DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_user (user_id),
    KEY idx_type (type),
    KEY idx_gmt_create (gmt_create DESC)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='积分流水表';

-- =========================================================
-- 初始化种子数据：节气养生
-- =========================================================
INSERT INTO solar_term_health (term_name, term_order, season, summary, diet, exercise, acupoints, lifestyle, recipes) VALUES
('立春', 1, '春', '春气始建，万物复苏。宜养肝护阳，升发阳气。', '["多吃辛甘发散食物：韭菜、豆芽、葱、姜、蒜", "少食酸味，以防肝气过旺", "推荐：春笋炒肉、韭菜盒子"]', '["晨起散步，舒展筋骨", "太极拳''起势''练习", "八段锦''两手托天理三焦''"]', '["太冲穴（足背第一二跖骨间）——疏肝理气", "风池穴（后颈发际凹陷处）——祛风散热"]', '早睡早起，多开窗通风。春捂秋冻，不急减衣。', '["春笋炒肉片", "韭菜炒鸡蛋", "枸杞菊花茶"]'),
('雨水', 2, '春', '降雨增多，湿气渐重。宜健脾祛湿，调养脾胃。', '["多吃健脾祛湿食物：山药、薏米、白扁豆、茯苓", "少食生冷油腻", "推荐：山药薏米粥"]', '["饭后慢走20分钟", "揉腹功：顺时针揉腹36圈", "八段锦''调理脾胃须单举''"]', '["足三里（外膝眼下3寸）——健脾和胃", "阴陵泉（小腿内侧胫骨后缘）——祛湿要穴"]', '注意保暖防潮，居室保持干燥通风。', '["山药薏米粥", "茯苓饼", "玫瑰红枣茶"]'),
('惊蛰', 3, '春', '春雷始鸣，万物复苏。宜养肝健脾，预防春困。', '["多吃富含维生素的蔬果：菠菜、芹菜、草莓", "适当补充蛋白质：鸡蛋、鱼", "推荐：芹菜炒香干"]', '["晨起拉伸运动", "散步30分钟", "太极拳''云手''练习"]', '["太冲穴——疏肝解郁", "血海穴（膝盖内侧上2寸）——活血润燥"]', '保持心情舒畅，避免急躁动怒。', '["芹菜炒香干", "菠菜猪肝汤", "蜂蜜柠檬水"]'),
('春分', 4, '春', '阴阳平衡，昼夜等长。宜调和阴阳，平补肝肾。', '["饮食宜清淡平和", "多吃时令蔬菜：荠菜、香椿、春笋", "推荐：荠菜豆腐羹"]', '["放风筝——舒展筋骨，缓解眼疲劳", "散步+深呼吸", "太极拳全套练习"]', '["合谷穴（手背虎口处）——调节气血", "三阴交（内踝上3寸）——调补肝肾"]', '保持心态平和，避免大悲大喜。', '["荠菜豆腐羹", "香椿炒蛋", "菊花枸杞茶"]'),
('清明', 5, '春', '天清地明，草木繁茂。宜清肝明目，疏泄郁热。', '["多吃绿色蔬菜：菠菜、油菜、小白菜", "适当饮菊花茶清肝明目", "推荐：蒜蓉菠菜"]', '["踏青郊游", "太极拳''野马分鬃''", "八段锦''五劳七伤往后瞧''"]', '["睛明穴（眼内眦角上方）——明目", "太冲穴——疏肝清热"]', '早睡早起，避免熬夜伤肝。', '["蒜蓉菠菜", "西红柿炒蛋", "菊花决明子茶"]'),
('谷雨', 6, '春', '雨生百谷，湿气加重。宜健脾祛湿，养肝护肾。', '["多吃健脾食物：薏米、赤小豆、冬瓜", "少食辛辣", "推荐：赤小豆薏米汤"]', '["室内舒缓运动", "八段锦''摇头摆尾去心火''", "太极拳''单鞭''"]', '["足三里——健脾", "丰隆穴（小腿外侧中点）——化痰祛湿"]', '居室保持干燥，衣物勤换洗。', '["赤小豆薏米汤", "冬瓜排骨汤", "红豆薏米茶"]'),
('立夏', 7, '夏', '夏之始，阳气渐盛。宜养心安神，清热生津。', '["多吃清热生津食物：苦瓜、黄瓜、西瓜", "适量补充钾元素：香蕉、土豆", "推荐：苦瓜炒蛋"]', '["晨练宜早，避免烈日", "太极拳''如封似闭''", "八段锦''背后七颠百病消''"]', '["内关穴（手腕横纹上2寸）——宁心安神", "神门穴（手腕内侧）——养心安眠"]', '午休30分钟养心，避免大汗淋漓。', '["苦瓜炒蛋", "绿豆百合粥", "酸梅汤"]'),
('小满', 8, '夏', '物致于此小得盈满。宜清热利湿，健脾养胃。', '["多吃清热利湿食物：冬瓜、丝瓜、薏米", "适当吃苦味食物清心火", "推荐：冬瓜薏米汤"]', '["清晨或傍晚运动", "散步+甩手功", "八段锦''调理脾胃须单举''"]', '["曲池穴（肘横纹外侧端）——清热利湿", "阴陵泉——祛湿"]', '保持心情舒畅，避免烦躁。', '["冬瓜薏米汤", "凉拌黄瓜", "莲子心茶"]'),
('芒种', 9, '夏', '有芒之谷可播种。宜清热解暑，养心护脾。', '["多吃清淡食物：绿豆、莲子、百合", "补充水分，多饮淡茶", "推荐：绿豆莲子汤"]', '["不宜剧烈运动", "太极拳''白鹤亮翅''", "八段锦''两手攀足固肾腰''"]', '["少府穴（掌心第4-5掌骨间）——清心泻火", "足三里——健脾"]', '居室通风，适当午休。', '["绿豆莲子汤", "凉拌西红柿", "薄荷茶"]'),
('夏至', 10, '夏', '阳至极而一阴生。宜养心安神，清补为宜。', '["饮食宜清淡，多食苦味", "适当补充电解质", "推荐：莲子百合银耳羹"]', '["早晚运动，避开正午", "太极拳''手挥琵琶''", "八段锦''摇头摆尾去心火''"]', '["神门穴——养心安神", "涌泉穴（脚底前1/3凹陷处）——引火归元"]', '午休养心，避免暴晒。', '["莲子百合银耳羹", "凉拌苦菊", "乌梅汤"]'),
('小暑', 11, '夏', '暑气渐盛。宜清热解暑，益气养阴。', '["多吃解暑食物：西瓜、绿豆、冬瓜", "少食辛辣油腻", "推荐：绿豆百合粥"]', '["游泳、太极拳等温和运动", "避免剧烈运动", "室内八段锦练习"]', '["大椎穴（第七颈椎棘突下）——清热解表", "合谷穴——清热镇痛"]', '保持室内通风凉爽，多饮水。', '["绿豆百合粥", "清蒸鲈鱼", "西瓜汁"]'),
('大暑', 12, '夏', '炎热至极。宜清热解暑，健脾祛湿。', '["多吃清热食物：苦瓜、冬瓜、丝瓜", "适量补充盐分", "推荐：冬瓜排骨汤"]', '["室内运动为主", "太极拳慢练", "八段锦全套"]', '["曲池穴——清热", "足三里——健脾祛湿"]', '避免长时间户外活动，注意防暑降温。', '["冬瓜排骨汤", "凉拌苦瓜", "菊花茶"]'),
('立秋', 13, '秋', '秋之始，暑去凉来。宜养肺润燥，收敛神气。', '["多吃润肺食物：梨、百合、银耳、蜂蜜", "少食辛辣", "推荐：冰糖炖雪梨"]', '["太极拳''搂膝拗步''", "八段锦''左右开弓似射雕''", "慢跑或快走"]', '["太渊穴（手腕横纹桡侧）——补肺益气", "迎香穴（鼻翼两侧）——润肺通鼻"]', '早卧早起，与鸡俱兴。', '["冰糖炖雪梨", "银耳百合汤", "蜂蜜柚子茶"]'),
('处暑', 14, '秋', '暑气渐消，秋燥始生。宜滋阴润燥，养肺护肝。', '["多吃滋阴食物：银耳、百合、梨、鸭肉", "多喝温水", "推荐：银耳百合羹"]', '["太极拳''倒卷肱''", "八段锦''两手攀足固肾腰''", "散步"]', '["孔最穴（前臂内侧腕横纹上7寸）——润肺", "太溪穴（内踝后方凹陷处）——滋阴补肾"]', '居室保持湿润，可用加湿器。', '["银耳百合羹", "蒸鸭梨", "蜂蜜柚子茶"]'),
('白露', 15, '秋', '露凝而白，秋意渐浓。宜养肺润燥，保暖防寒。', '["多吃润肺食物：梨、百合、山药、藕", "注意保暖，勿露身", "推荐：山药排骨汤"]', '["太极拳''高探马''", "八段锦''两手托天理三焦''", "晨练不宜过早"]', '["肺俞穴（背部第三胸椎棘突旁开1.5寸）——补肺", "列缺穴（腕横纹上1.5寸）——宣肺解表"]', '早晚添衣，避免受凉。', '["山药排骨汤", "莲藕炖排骨", "桂花茶"]'),
('秋分', 16, '秋', '阴阳平衡，昼夜等长。宜滋阴润燥，调和阴阳。', '["饮食宜甘润，多食白色食物", "适当补充优质蛋白", "推荐：莲子百合粥"]', '["太极拳全套练习", "八段锦全套", "登高望远"]', '["三阴交——调补肝肾", "足三里——健脾益气"]', '保持心态平和，避免悲秋。', '["莲子百合粥", "白萝卜炖牛肉", "玫瑰花茶"]'),
('寒露', 17, '秋', '露气寒冷，将凝结也。宜养肺润燥，温阳散寒。', '["多吃温热食物：红枣、桂圆、核桃", "适当进补", "推荐：红枣桂圆粥"]', '["太极拳''海底针''", "八段锦''背后七颠百病消''", "慢跑"]', '["关元穴（脐下3寸）——温阳", "足三里——健脾暖胃"]', '注意足部保暖，睡前热水泡脚。', '["红枣桂圆粥", "当归生姜羊肉汤", "姜茶"]'),
('霜降', 18, '秋', '气肃而凝，露结为霜。宜温补脾肾，润肺防燥。', '["多吃温补食物：牛肉、羊肉、山药", "适当吃水果润燥", "推荐：牛肉炖萝卜"]', '["太极拳''闪通臂''", "八段锦''两手攀足固肾腰''", "室内运动为主"]', '["肾俞穴（腰部第二腰椎棘突旁开1.5寸）——温补肾阳", "涌泉穴——引火归元"]', '早睡晚起，待日出后晨练。', '["牛肉炖萝卜", "山药枸杞粥", "红枣姜茶"]'),
('立冬', 19, '冬', '冬之始，万物收藏。宜温补肾阳，养精蓄锐。', '["多吃温补食物：羊肉、鸡肉、核桃、黑芝麻", "适当吃黑色食物补肾", "推荐：当归生姜羊肉汤"]', '["太极拳''揽雀尾''", "八段锦''两手攀足固肾腰''", "不宜剧烈运动，以静养为主"]', '["关元穴——温补肾阳", "命门穴（腰部第二腰椎棘突下）——补肾壮阳"]', '早卧晚起，必待日光。', '["当归生姜羊肉汤", "黑芝麻糊", "桂圆红枣茶"]'),
('小雪', 20, '冬', '雨下而为寒气所薄。宜温补防寒，养肾固精。', '["多吃温阳食物：羊肉、牛肉、韭菜", "适当吃坚果", "推荐：羊肉萝卜汤"]', '["太极拳''云手''", "八段锦''五劳七伤往后瞧''", "室内运动"]', '["太溪穴——滋阴补肾", "涌泉穴——温补肾阳"]', '注意保暖，尤其头部和脚部。', '["羊肉萝卜汤", "韭菜炒鸡蛋", "姜枣茶"]'),
('大雪', 21, '冬', '大者，盛也。宜温补脾肾，防寒保暖。', '["多吃温热食物：羊肉、牛肉、桂圆", "适当补充高蛋白", "推荐：黄芪炖鸡"]', '["太极拳慢练", "八段锦全套", "室内运动为主"]', '["关元穴——温阳", "足三里——健脾", "肾俞穴——补肾"]', '早睡晚起，防寒保暖。', '["黄芪炖鸡", "羊肉火锅", "枸杞红枣茶"]'),
('冬至', 22, '冬', '阴极之至，阳气始生。宜温补肾阳，养精蓄锐。', '["多吃温补食物：羊肉、狗肉、核桃", "适当吃坚果", "推荐：当归生姜羊肉汤"]', '["太极拳''起势''慢练", "八段锦''两手攀足固肾腰''", "不宜剧烈运动"]', '["关元穴——温阳", "命门穴——补肾", "涌泉穴——引火归元"]', '冬至一阳生，宜静养。', '["当归生姜羊肉汤", "核桃芝麻糊", "桂圆红枣茶"]'),
('小寒', 23, '冬', '冷气积久而为寒。宜温补肾阳，驱寒保暖。', '["多吃温热食物：羊肉、狗肉、姜", "适当吃辛辣驱寒", "推荐：羊肉炖萝卜"]', '["太极拳''搬拦捶''", "八段锦''背后七颠百病消''", "室内活动"]', '["关元穴——温阳散寒", "大椎穴——温通阳气", "涌泉穴——温补肾阳"]', '加强保暖，尤其是腰腹部。', '["羊肉炖萝卜", "姜葱炒鸡", "红糖姜茶"]'),
('大寒', 24, '冬', '寒气之逆极。宜温补肾阳，预防春病。', '["多吃温补食物：羊肉、牛肉、鸡肉", "适当进补，但不过量", "推荐：药膳鸡汤"]', '["太极拳全套慢练", "八段锦全套", "温和运动"]', '["关元穴——温阳固本", "足三里——健脾益气", "肾俞穴——补肾强身"]', '大寒过后是立春，注意换季养生。', '["药膳鸡汤", "红枣桂圆粥", "枸杞茶"]');

-- =========================================================
-- 初始化种子数据：反诈防骗知识
-- =========================================================
INSERT INTO anti_fraud_knowledge (category, title, description, warning_signs, prevention, risk_level) VALUES
('PHONE', '冒充公检法诈骗', '骗子冒充公安局、检察院、法院工作人员，声称老人涉嫌洗钱等犯罪，要求将资金转入"安全账户"。', '["自称公检法要求转账", "要求保密、不许告诉家人", "发来''通缉令''或''逮捕令''照片"]', '公检法机关不会通过电话办案，更不会要求转账到"安全账户"。接到此类电话立即挂断，拨打110核实。', 'HIGH'),
('PHONE', '冒充亲友求助诈骗', '骗子冒充老人的子女或孙辈，声称遇到急事（车祸、住院、被抓等）急需用钱，要求转账。', '["电话中声音与平时不同", "要求不要告诉其他家人", "催促立即转账"]', '接到"亲友"求助电话，先挂断拨打对方常用号码核实。不要轻信陌生号码的"紧急求助"。', 'HIGH'),
('NETWORK', '虚假中奖诈骗', '通过短信、电话、邮件告知老人"中奖"，但需先缴纳"手续费"、"税费"才能领取奖金。', '["中奖金额巨大", "要求先交钱", "限时领取，过期作废"]', '天上不会掉馅饼，所有要求先交钱的"中奖"都是诈骗。', 'MEDIUM'),
('NETWORK', '虚假投资理财诈骗', '以"高收益、低风险"为诱饵，诱骗老人投资虚假项目或购买虚假理财产品。', '["承诺超高回报率", "''内部消息''、''稳赚不赔''", "催促尽快投资"]', '投资理财请选择正规金融机构。收益率超过6%就要打问号，超过8%很危险，超过10%就要做好损失全部本金的准备。', 'HIGH'),
('DOOR', '上门推销诈骗', '骗子冒充社区工作人员、燃气公司员工等上门，以"安全检查"、"免费服务"为由，高价推销劣质产品或实施盗窃。', '["自称社区或政府工作人员", "要求进屋检查", "推销高价产品"]', '遇到陌生人上门，先核实对方身份。真正的社区工作人员都会提前通知。不要轻易让陌生人进屋。', 'MEDIUM'),
('HEALTH', '保健品诈骗', '以"免费体检"、"专家讲座"为名，夸大老人健康问题，推销高价保健品。', '["免费体检、免费讲座", "''专家''夸大病情", "限时优惠、''名额有限''"]', '保健品不能替代药品。身体不适要去正规医院就诊。购买保健品要通过正规渠道，索要发票。', 'HIGH'),
('HEALTH', '神医神药诈骗', '声称有"祖传秘方"、"特效药"能治愈各种慢性病，高价出售假药。', '["宣称能根治慢性病", "''祖传秘方''、''特效药''", "没有正规批号"]', '所有药品必须有"国药准字"批号。慢性病管理请遵医嘱，不要相信"根治"的说法。', 'HIGH'),
('NETWORK', '养老服务诈骗', '以"养老服务"、"养老公寓"、"以房养老"为名，骗取老人房产或大额资金。', '["承诺高额回报", "要求抵押房产", "合同条款模糊"]', '选择养老服务要选择有资质的正规机构。涉及房产抵押的重大决定，一定与子女商量。', 'HIGH');

-- =========================================================
-- 初始化种子数据：养老政策知识
-- =========================================================
INSERT INTO policy_knowledge (category, title, summary, detail, applicable_region, keywords) VALUES
('PENSION', '城乡居民基本养老保险', '年满60周岁、累计缴费满15年的城乡居民，可按月领取养老金。', '养老金由基础养老金和个人账户养老金组成。基础养老金最低标准由国家统一确定，各地可根据实际情况适当提高。', '全国', '["养老金", "养老保险", "退休金", "60岁"]'),
('PENSION', '企业职工基本养老保险', '企业职工达到法定退休年龄且累计缴费满15年，可办理退休并领取养老金。', '男性60周岁、女干部55周岁、女工人50周岁退休。养老金包括基础养老金、个人账户养老金和过渡性养老金。', '全国', '["退休", "职工养老", "退休金", "社保"]'),
('MEDICAL', '城乡居民基本医疗保险', '为未参加职工医保的城乡居民提供基本医疗保障，包括住院和门诊统筹。', '个人缴费+政府补贴，每年集中缴费期参保。报销比例一般在50%-70%之间，具体以当地政策为准。', '全国', '["医保", "医疗报销", "看病", "住院"]'),
('MEDICAL', '老年人健康管理服务', '国家基本公共卫生服务项目之一，为65岁以上老年人每年提供1次免费健康管理服务。', '包括生活方式和健康状况评估、体格检查、辅助检查和健康指导。', '全国', '["免费体检", "健康管理", "65岁", "社区医院"]'),
('SUBSIDY', '高龄津贴', '对80周岁以上高龄老人发放的生活补贴，标准由各地确定。', '多数地区80-89岁每月50-200元，90-99岁每月100-300元，100岁以上每月300-1000元不等。', '全国（各地标准不同）', '["高龄补贴", "80岁", "津贴", "长寿"]'),
('SUBSIDY', '养老服务补贴', '对经济困难的高龄、失能老人提供养老服务补贴。', '补贴标准由各地根据经济发展水平确定，可用于购买居家养老服务或入住养老机构。', '全国（各地标准不同）', '["养老服务", "补贴", "困难老人", "失能"]'),
('CARE', '长期护理保险', '为长期失能人员提供基本生活照料和医疗护理服务的保险制度。', '试点城市已超过49个，参保人员因年老、疾病、伤残等原因长期失能，可申请长期护理保险待遇。', '试点城市', '["长护险", "失能", "护理", "照护"]'),
('HOUSING', '老年人家庭适老化改造', '为特殊困难老年人家庭提供居家适老化改造补贴。', '改造内容包括地面防滑、扶手安装、淋浴椅配置等，每户补贴标准各地不同。', '全国（各地标准不同）', '["适老化改造", "居家改造", "扶手", "防滑"]');

-- =========================================================
-- 迁移完成
-- =========================================================