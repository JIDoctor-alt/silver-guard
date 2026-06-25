// ============================================================
// Silver Guard · RAG 知识库服务
// 基于养老知识库的检索增强生成（RAG）
// 支持 LLM 大模型生成 + 关键词匹配兜底
// 提示词支持通过环境变量自定义，不配置则使用内置默认
// 知识库支持通过环境变量 JSON 格式自定义
// ============================================================
const config = require('../config');
const fs = require('fs');
const path = require('path');

// ==================== 持久化存储 ====================
// 用户上传的知识条目持久化到 JSON 文件，重启后不丢失
const USER_KNOWLEDGE_FILE = path.join(__dirname, '..', '..', 'data', 'user-knowledge.json');

function ensureDataDir() {
  const dir = path.dirname(USER_KNOWLEDGE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadUserKnowledge() {
  try {
    if (fs.existsSync(USER_KNOWLEDGE_FILE)) {
      // 显式以 UTF-8 读取，避免 Windows 上因默认编码导致中文乱码
      const buf = fs.readFileSync(USER_KNOWLEDGE_FILE);
      const content = buf.toString('utf8');
      const data = JSON.parse(content);
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.warn('加载用户知识库失败:', e.message);
  }
  return [];
}

function saveUserKnowledge(items) {
  try {
    ensureDataDir();
    // 显式使用 UTF-8 编码写入，避免 Windows 上因 BOM/默认编码导致中文乱码
    const buf = Buffer.from(JSON.stringify(items, null, 2), 'utf8');
    fs.writeFileSync(USER_KNOWLEDGE_FILE, buf);
    return true;
  } catch (e) {
    console.error('保存用户知识库失败:', e.message);
    return false;
  }
}

function nextUserId(existingItems) {
  // 用户添加的条目 id 从 900000 开始，避免与内置冲突
  if (existingItems.length === 0) return 900001;
  const maxId = Math.max(...existingItems.map((it) => it.id || 0));
  return Math.max(maxId + 1, 900001);
}

// ==================== 默认提示词 ====================

const DEFAULT_RAG_SYSTEM = `你是一位专业的养老顾问，服务于社区独居老人关爱系统。
你的职责是解答老人、家属、网格员关于养老健康、政策、社区服务等方面的问题。

回答要求：
1. 基于提供的知识库内容回答，不要编造信息
2. 语言亲切温和，像对待家人一样
3. 回答简洁明了，分点说明，每点不超过2句话
4. 如果知识库没有相关信息，请诚实告知，并建议联系社区网格员
5. 适当加入关怀和鼓励的话语

输出格式：严格返回 JSON，不要包含其他文字。`;

const DEFAULT_RAG_USER = `请根据以下知识库内容回答用户的问题。

【知识库内容】
{context}

【用户问题】
{question}

【用户信息】
{userInfo}

返回 JSON 格式：
{
  "answer": "回答内容，分点说明，亲切温和",
  "keyPoints": ["要点1", "要点2", "要点3"],
  "followUp": "建议的后续问题，如无则返回空字符串"
}`;

// ==================== 提示词工具函数 ====================

function getPrompt(configKey, defaultPrompt) {
  return config[configKey] || defaultPrompt;
}

function renderTemplate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

// ==================== 知识库 ====================

function loadKnowledgeBase() {
  // 1. 优先从持久化文件加载（用户上传的条目）
  const userItems = loadUserKnowledge();

  // 2. 尝试从环境变量加载自定义知识库
  let envItems = [];
  if (config.LLM_RAG_KNOWLEDGE) {
    try {
      const parsed = JSON.parse(config.LLM_RAG_KNOWLEDGE);
      if (Array.isArray(parsed) && parsed.length > 0) {
        envItems = parsed;
        console.log(`RAG 知识库已从环境变量加载，共 ${parsed.length} 条`);
      }
    } catch (e) {
      console.warn('RAG 知识库 JSON 解析失败，使用内置默认:', e.message);
    }
  }

  // 3. 合并：内置默认 + 环境变量 + 用户上传
  // 用户上传的条目优先级最高（追加在最后）
  const merged = [...DEFAULT_KNOWLEDGE_BASE, ...envItems, ...userItems];
  if (userItems.length > 0) {
    console.log(`RAG 知识库已合并用户上传条目 ${userItems.length} 条，总计 ${merged.length} 条`);
  }
  return merged;
}

const DEFAULT_KNOWLEDGE_BASE = [
  {
    id: 1, category: '健康管理', title: '高血压日常护理',
    keywords: ['高血压', '血压', '饮食', '运动', '药物'],
    content: '高血压老人应保持低盐饮食，每日食盐摄入不超过5克。建议每天早晚各测量一次血压并记录。推荐每周进行3-5次有氧运动，如散步、太极拳等，每次30分钟。遵医嘱按时服药，不可自行停药。',
  },
  {
    id: 2, category: '健康管理', title: '糖尿病饮食指南',
    keywords: ['糖尿病', '血糖', '饮食', '胰岛素', '糖分'],
    content: '糖尿病老人应控制总热量摄入，定时定量进餐。主食以粗粮为主，如燕麦、荞麦。多吃蔬菜，适量摄入优质蛋白。避免含糖饮料和甜点。定期监测空腹血糖和餐后血糖。',
  },
  {
    id: 3, category: '健康管理', title: '老年人防跌倒指南',
    keywords: ['跌倒', '安全', '防滑', '拐杖', '摔倒'],
    content: '家中应铺设防滑垫，卫生间安装扶手。夜间起床时应先开灯，缓慢起身。建议使用助行器或拐杖辅助行走。穿着防滑鞋，避免穿拖鞋行走。定期进行平衡能力训练。',
  },
  {
    id: 4, category: '健康管理', title: '骨质疏松预防',
    keywords: ['骨质疏松', '补钙', '维生素D', '骨骼', '骨折'],
    content: '老年人应保证每日钙摄入量1000-1200mg。多晒太阳促进维生素D合成。推荐食用牛奶、豆制品、小鱼干等富含钙的食物。适当进行负重运动如散步。',
  },
  {
    id: 5, category: '养老政策', title: '居家养老服务补贴',
    keywords: ['补贴', '居家养老', '政策', '申请', '政府'],
    content: '符合条件的老年人可申请居家养老服务补贴。一般要求年龄满60周岁，具有当地户籍，且属于经济困难、失能或高龄老人。申请需携带身份证、户口本、收入证明等材料到社区居委会办理。',
  },
  {
    id: 6, category: '养老政策', title: '长护险申请流程',
    keywords: ['长护险', '长期护理', '保险', '失能', '评估'],
    content: '长期护理保险（长护险）为失能老人提供护理保障。参保人需经评估机构进行失能等级评估，达到规定等级后即可享受待遇。服务形式包括居家护理、社区日间照料和机构护理。',
  },
  {
    id: 7, category: '社区服务', title: '社区老年食堂服务',
    keywords: ['食堂', '送餐', '餐饮', '配餐', '营养餐'],
    content: '社区老年食堂为60岁以上老人提供营养配餐服务。可堂食或申请送餐上门。餐费标准一般为10-15元/餐，享受政府补贴。有特殊饮食需求（如糖尿病餐、低盐餐）可提前告知。',
  },
  {
    id: 8, category: '社区服务', title: '老年大学课程介绍',
    keywords: ['老年大学', '学习', '课程', '书法', '舞蹈', '音乐'],
    content: '社区老年大学开设书法、国画、舞蹈、声乐、智能手机使用等课程。每学期费用约200-500元。报名时间为每年3月和9月。部分课程提供线上教学，方便行动不便的老人参与。',
  },
  {
    id: 9, category: '心理关怀', title: '老年人心理健康调适',
    keywords: ['孤独', '心理', '抑郁', '社交', '情绪'],
    content: '老人独居容易产生孤独感和抑郁情绪。建议保持规律社交，参加社区活动。培养兴趣爱好如养花、下棋、广场舞等。子女应定期探望或视频通话。社区设有心理咨询室可免费咨询。',
  },
  {
    id: 10, category: '安全知识', title: '老年人防诈骗指南',
    keywords: ['诈骗', '电话', '保健品', '安全', '转账'],
    content: '常见老年人诈骗手段包括：冒充公检法、保健品推销、中奖诈骗、冒充亲友借钱等。牢记：不轻信陌生来电、不透露个人信息、不向陌生账户转账。遇到可疑情况及时拨打110或联系社区网格员。',
  },
  {
    id: 11, category: '运动健身', title: '广场舞安全指南',
    keywords: ['广场舞', '跳舞', '锻炼', '热身', '运动'],
    content: '广场舞是很好的有氧运动，建议每次40-60分钟。跳舞前做好热身，避免受伤。选择平坦、防滑的场地。穿软底运动鞋，不要穿硬底鞋或高跟鞋。音量控制在合理范围，避免扰民。',
  },
  {
    id: 12, category: '运动健身', title: '太极拳练习指导',
    keywords: ['太极拳', '太极', '气功', '养生', '晨练'],
    content: '太极拳是适合老年人的传统健身运动，能改善平衡能力和心肺功能。建议清晨在空气清新的公园练习。初学者可从简化24式开始，每天练习20-30分钟。注意动作要缓慢柔和，避免过度用力。',
  },
  // ==================== 中医养生 ====================
  {
    id: 13, category: '中医养生', title: '中医体质辨识与调理',
    keywords: ['体质', '中医', '阳虚', '阴虚', '气虚', '痰湿', '湿热', '血瘀', '气郁', '特禀'],
    content: '中医将体质分为9种：平和质、气虚质、阳虚质、阴虚质、痰湿质、湿热质、血瘀质、气郁质、特禀质。老年人常见气虚质（气短乏力、易感冒，宜食黄芪、党参）和阳虚质（畏寒怕冷、手脚冰凉，宜食羊肉、生姜）。建议找中医师进行体质辨识，针对性调理。平和质为最佳状态，重在保持。',
  },
  {
    id: 14, category: '中医养生', title: '中医经络养生保健',
    keywords: ['经络', '穴位', '按摩', '针灸', '足三里', '涌泉', '百会'],
    content: '经络是人体气血运行的通道，老年人可通过按摩穴位保健。推荐穴位：足三里（膝下3寸，强壮穴，常按延年益寿）、涌泉穴（足底前1/3处，补肾安神，睡前按摩）、百会穴（头顶正中，提神醒脑）、内关穴（手腕横纹上2寸，养心安神）。每个穴位按压3-5分钟，力度以酸胀为宜。',
  },
  {
    id: 15, category: '中医养生', title: '药膳食疗养生方',
    keywords: ['药膳', '食疗', '煲汤', '枸杞', '当归', '黄芪', '党参', '红枣'],
    content: '老年人药膳推荐：1. 黄芪枸杞炖鸡汤：黄芪30g + 枸杞15g + 鸡肉，补气养血，适合气虚者。2. 当归生姜羊肉汤：当归15g + 生姜30g + 羊肉，温阳散寒，适合阳虚怕冷者。3. 百合莲子银耳羹：百合+莲子+银耳+冰糖，润肺安神，适合失眠者。4. 山药薏米粥：山药+薏米+粳米，健脾祛湿。药膳需根据体质选择，不可盲目进补。',
  },
  {
    id: 16, category: '中医养生', title: '常见中药使用须知',
    keywords: ['中药', '人参', '三七', '丹参', '天麻', '灵芝', '枸杞'],
    content: '老年人常用中药：人参（大补元气，高血压者慎用）、三七（活血化瘀，预防心脑血管）、丹参（活血调经，清心安神）、天麻（平肝息风，改善头晕头痛）、灵芝（增强免疫力，安神助眠）、枸杞（滋补肝肾，明目）。重要提示：中药需在医师指导下使用，不可自行配伍，避免与西药产生相互作用。',
  },
  {
    id: 17, category: '中医养生', title: '四季养生要点',
    keywords: ['春季', '夏季', '秋季', '冬季', '节气', '养生', '季节'],
    content: '春季养肝：早睡早起，适当运动，多吃绿色蔬菜，保持心情舒畅。夏季养心：午休半小时，饮食清淡，多食苦瓜冬瓜，避免暴晒。秋季养肺：润燥为主，多食梨、百合、银耳，注意保暖防感冒。冬季养肾：早睡晚起，注意保暖，多吃黑色食物（黑豆、黑芝麻），适度进补。顺应四时变化，天人合一。',
  },
  // ==================== 西医慢病管理 ====================
  {
    id: 18, category: '慢病管理', title: '冠心病日常管理',
    keywords: ['冠心病', '心脏', '心绞痛', '支架', '搭桥', '胸闷'],
    content: '冠心病患者应随身携带硝酸甘油。日常注意：低脂低盐饮食，控制体重，戒烟限酒。规律服用抗血小板药（如阿司匹林）和他汀类降脂药。出现胸痛胸闷持续15分钟以上不缓解，立即拨打120。定期复查心电图、心脏彩超，每年至少1次。',
  },
  {
    id: 19, category: '慢病管理', title: '脑卒中预防与康复',
    keywords: ['脑卒中', '中风', '偏瘫', '康复', '溶栓', 'FAST'],
    content: '脑卒中识别口诀"FAST"：F（Face面部歪斜）、A（Arm手臂无力）、S（Speech言语不清）、T（Time立即就医）。黄金溶栓时间窗为发病后4.5小时内。预防措施：控制血压<140/90mmHg，房颤患者规范抗凝，定期颈动脉超声检查。康复训练包括肢体功能训练、言语训练、吞咽训练，越早开始效果越好。',
  },
  {
    id: 20, category: '慢病管理', title: '慢性阻塞性肺疾病（COPD）',
    keywords: ['慢阻肺', 'COPD', '咳嗽', '气喘', '呼吸困难', '吸氧'],
    content: '慢阻肺主要表现为慢性咳嗽、咳痰、气短。首要措施是戒烟。家庭氧疗：每日吸氧15小时以上，氧流量1-2L/min。腹式呼吸训练：吸气时腹部鼓起，呼气时腹部收缩，每天练习2-3次，每次10分钟。接种流感疫苗和肺炎疫苗，预防急性加重。',
  },
  {
    id: 21, category: '慢病管理', title: '老年认知障碍（阿尔茨海默病）',
    keywords: ['阿尔茨海默', '痴呆', '认知障碍', '记忆力', '遗忘', 'AD'],
    content: '早期信号：记忆力减退（特别是近期记忆）、语言表达困难、时间地点混淆、判断力下降。预防措施：保持社交活动、经常用脑（下棋、阅读、学习新技能）、地中海饮食（多吃鱼、蔬果、橄榄油）、规律运动。如发现异常，尽早就医评估，早期干预效果更好。',
  },
  {
    id: 22, category: '慢病管理', title: '老年用药安全管理',
    keywords: ['药物', '用药', '副作用', '处方', '药盒', '相互作用'],
    content: '老年人多重用药常见。安全原则：1. 使用分格药盒，按早中晚分装，避免漏服或重复服用。2. 定期（每3-6个月）找医生复核用药清单，停用不必要的药物。3. 不自行购买保健品代替药物。4. 注意药物相互作用，如华法林与多种药物/食物有相互作用。5. 记录药物过敏史，就诊时主动告知医生。',
  },
  // ==================== 健康档案 ====================
  {
    id: 23, category: '健康档案', title: '老年健康档案管理',
    keywords: ['健康档案', '体检', '病历', '记录', '档案', '健康管理'],
    content: '建议每位老人建立个人健康档案，内容包括：基本信息（姓名、年龄、血型、过敏史）、既往病史、手术史、家族病史、用药记录、历次体检报告、疫苗接种记录。可请社区医生协助建立电子健康档案。定期更新，就诊时携带，帮助医生快速了解健康状况。',
  },
  {
    id: 24, category: '健康档案', title: '老年人年度体检指南',
    keywords: ['体检', '检查', '化验', 'B超', '心电图', '筛查'],
    content: '老年人每年至少体检1次，重点项目：血常规、尿常规、肝功能、肾功能、血糖、血脂、心电图、胸部X光、腹部B超。65岁以上建议增加：骨密度检测、颈动脉超声、肿瘤标志物筛查、眼底检查。男性加前列腺检查，女性加乳腺和妇科检查。体检结果应归档保存，便于对比分析。',
  },
  // ==================== 智能设备 ====================
  {
    id: 25, category: '智能设备', title: '智能穿戴设备使用指南',
    keywords: ['智能手表', '手环', '穿戴', '监测', '心率', '跌倒检测'],
    content: '智能穿戴设备可实时监测心率、血压、血氧、睡眠质量。跌倒检测功能可在老人意外跌倒时自动报警。使用建议：选择大字体、操作简单的设备，设置紧急联系人，保持蓝牙连接。每天充电，确保设备正常运行。常见品牌：华为、小米、Apple Watch均有老人模式。',
  },
  {
    id: 26, category: '智能设备', title: '居家安全监测设备',
    keywords: ['传感器', '门磁', '烟感', '燃气', '红外', '摄像头', '一键呼叫'],
    content: '居家安全设备推荐：1. 门磁传感器：监测门窗开关，异常时报警。2. 烟感报警器：厨房必备，发现烟雾立即报警。3. 燃气泄漏报警器：检测燃气泄漏，自动切断阀门。4. 红外人体传感器：监测老人活动，长时间无活动自动告警。5. 一键呼叫按钮：佩戴式或壁挂式，紧急情况一键求助。6. 智能摄像头：子女可远程查看老人状况（注意隐私保护）。',
  },
  {
    id: 27, category: '智能设备', title: '端-边-云-大模型中枢架构',
    keywords: ['IoT', '物联网', '边缘计算', '云计算', '大模型', 'AI', '数据采集', '端边云'],
    content: 'Silver Guard 采用端-边-云-大模型四级架构：端侧（IoT设备）：智能穿戴、环境传感器、摄像头等采集养老数据。边侧（边缘计算）：社区网关节点，本地数据预处理与异常检测，延迟<50ms。云侧（云平台）：数据汇聚存储、分析引擎、业务系统。大模型中枢（AI）：LLM推理服务、RAG知识库、健康风险预测、个性化建议生成。优势：低延迟、高隐私、高可用、持续学习。',
  },
  // ==================== 文学经典（作词参考） ====================
  {
    id: 28, category: '文学经典', title: '诗词格律基础',
    keywords: ['格律', '平仄', '押韵', '对仗', '五言', '七言', '绝句', '律诗'],
    content: '古典诗词格律要点：1. 五言绝句：每句5字，共4句，二四句押韵。2. 七言绝句：每句7字，共4句，一韵到底。3. 五言律诗：每句5字，共8句，中间两联对仗。4. 七言律诗：每句7字，共8句，颔联颈联对仗。平仄规则：一句之中平仄交替，一联之中平仄相对。押韵规则：偶句押平声韵，首句可押可不押。常见韵部：江阳韵(ang)、中东韵(ong/eng)、言前韵(an)、一七韵(i)。',
  },
  {
    id: 29, category: '文学经典', title: '作词押韵技法',
    keywords: ['押韵', '韵脚', '韵律', '节奏', '韵文', '朗朗上口'],
    content: '歌词押韵常用技法：1. 隔行押韵（ABAB）：奇数行与奇数行押韵，偶数行与偶数行押韵，最常见。2. 双行押韵（AABB）：每两句一换韵，适合快节奏。3. 一韵到底（AAAA）：全篇用同一韵脚，气势连贯，适合抒情慢歌。4. 抱韵（ABBA）：首尾句押韵，中间句押另一韵，欧美歌曲常用。5. 交韵（ABAB CDCD）：每段换韵，层次分明。推荐韵部：ang韵（响亮开阔）、an韵（温暖抒情）、ou韵（悠长舒缓）、i韵（细腻含蓄）。',
  },
  {
    id: 30, category: '文学经典', title: '中国古典诗词意象',
    keywords: ['意象', '月亮', '梅花', '流水', '夕阳', '春天', '红豆', '杨柳', '秋风', '白雪'],
    content: '传统诗词经典意象库：1. 月亮——思乡、团圆、永恒（"举头望明月，低头思故乡"）。2. 梅花——坚韧、高洁、傲雪（"墙角数枝梅，凌寒独自开"）。3. 流水——时光流逝、思念（"问君能有几多愁，恰似一江春水向东流"）。4. 夕阳——晚年、怀旧、温暖（"夕阳无限好，只是近黄昏"）。5. 春天——新生、希望、美好（"春眠不觉晓，处处闻啼鸟"）。6. 红豆——相思（"红豆生南国，春来发几枝"）。7. 杨柳——离别、挽留（"昔我往矣，杨柳依依"）。8. 秋风——悲凉、思念（"秋风萧瑟天气凉，草木摇落露为霜"）。9. 白雪——纯洁、岁寒（"忽如一夜春风来，千树万树梨花开"）。10. 青山——永恒、归隐（"青山依旧在，几度夕阳红"）。',
  },
  {
    id: 31, category: '文学经典', title: '民歌与广场舞歌词结构',
    keywords: ['歌词结构', '主歌', '副歌', 'A段', 'B段', '过门', '起承转合'],
    content: '民歌与广场舞歌词常用结构：1. 主歌A段（起承）：引入主题，叙事铺垫，每句7-10字，共4句。2. 副歌B段（转合）：情感高潮，点题升华，重复性强，易于传唱。3. 典型结构：A1-B-A2-B（主歌1-副歌-主歌2-副歌），共16-20句。4. 起承转合：第一句起头引入、第二句承接发展、第三句转折变化、第四句收束点题。5. 创作要点：A段叙事铺垫场景，B段抒发情感；B段旋律和歌词高度重复，方便记忆和跟唱；副歌第一句一般为全曲最强记忆点。',
  },
  {
    id: 32, category: '文学经典', title: '经典诗词名句精选',
    keywords: ['名句', '唐诗', '宋词', '元曲', '经典', '名篇', '诗词'],
    content: '适合作词引用的经典名句：1. "但愿人长久，千里共婵娟"（苏轼·水调歌头）——祝福团圆。2. "莫愁前路无知己，天下谁人不识君"（高适·别董大）——鼓励安慰。3. "采菊东篱下，悠然见南山"（陶渊明·饮酒）——闲适田园。4. "老骥伏枥，志在千里"（曹操·龟虽寿）——老当益壮。5. "谁言寸草心，报得三春晖"（孟郊·游子吟）——感恩父母。6. "海内存知己，天涯若比邻"（王勃·送杜少府）——友情珍贵。7. "夕阳无限好，只是近黄昏"（李商隐·登乐游原）——珍惜晚年。8. "春风得意马蹄疾，一日看尽长安花"（孟郊·登科后）——喜悦心情。9. "但愿苍生俱饱暖，不辞辛苦出山林"（于谦·咏煤炭）——奉献精神。10. "落红不是无情物，化作春泥更护花"（龚自珍·己亥杂诗）——奉献传承。',
  },
  {
    id: 33, category: '文学经典', title: '四季主题作词素材',
    keywords: ['春天', '夏天', '秋天', '冬天', '四季', '季节', '时令', '节气'],
    content: '四季作词素材库：春季——春风、桃花、燕子、杨柳、细雨、暖阳、播种、新生。适合主题：希望、爱情、青春回忆。常用词：春风拂面、桃红柳绿、春暖花开、万物复苏。夏季——荷花、蝉鸣、绿荫、雷雨、彩虹、稻香、萤火虫。适合主题：热情、活力、劳动。常用词：夏日炎炎、荷塘月色、绿树成荫、蛙声一片。秋季——红叶、菊花、明月、丰收、桂花、白露、重阳。适合主题：感恩、丰收、怀旧。常用词：秋高气爽、金桂飘香、硕果累累、月圆人圆。冬季——白雪、梅花、暖阳、团圆、除夕、瑞雪、围炉。适合主题：温暖、团聚、期盼。常用词：瑞雪兆丰年、岁寒三友、围炉夜话、辞旧迎新。',
  },
  {
    id: 34, category: '文学经典', title: '老年人作词常见主题',
    keywords: ['作词', '创作', '主题', '老人', '广场舞', '怀旧', '健康', '亲情'],
    content: '老年人作词推荐主题：1. 健康养生——歌颂健康生活，倡导运动锻炼，如"晨练歌""养生谣"。2. 岁月情怀——回忆青春岁月，感怀人生历程，如"青春回忆""那些年"。3. 社区生活——赞美邻里和睦，歌唱社区活动，如"邻里情""快乐广场"。4. 家国情怀——表达爱国之情，歌颂家乡美景，如"祖国颂""家乡美"。5. 亲情友情——感恩父母养育，珍惜朋友情谊，如"父母恩""老友记"。6. 节日庆典——春节、中秋、重阳等节日主题，如"过年好""重阳乐"。7. 自然风光——赞美山水田园，四季风景，如"青山绿水""四季歌"。8. 人生感悟——分享人生智慧，传递正能量，如"知足常乐""笑对人生"。创作要点：每句7-10字，语言通俗，情感真挚，避免生僻字。',
  },
];

// 运行时加载知识库（支持热更新）
let KNOWLEDGE_BASE = loadKnowledgeBase();

// ==================== LLM 调用 ====================

function isLLMAvailable() {
  return !!(config.LLM_API_KEY && config.LLM_API_KEY.trim());
}

async function callLLM(messages, options = {}) {
  const url = `${config.LLM_API_URL}/chat/completions`;
  const body = {
    model: config.LLM_MODEL,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 1500,
  };
  if (options.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.LLM_API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`LLM API 错误 (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * 流式调用 LLM（OpenAI 兼容 SSE 接口）
 * @param {Array} messages
 * @param {Function} onToken - 每收到一个 token 时回调
 * @param {object} options
 * @returns {Promise<string>} 完整回答
 */
async function callLLMStream(messages, onToken, options = {}) {
  const url = `${config.LLM_API_URL}/chat/completions`;
  const body = {
    model: config.LLM_MODEL,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 1500,
    stream: true,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.LLM_API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`LLM API 错误 (${response.status}): ${errText.slice(0, 200)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const dataStr = trimmed.slice(6);
      if (dataStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(dataStr);
        const content = parsed.choices?.[0]?.delta?.content || '';
        if (content) {
          fullText += content;
          onToken(content);
        }
      } catch {
        // 跳过无法解析的行
      }
    }
  }

  return fullText;
}

// ==================== 检索 ====================

function retrieve(query, topK = 3) {
  const queryLower = query.toLowerCase();
  const scored = KNOWLEDGE_BASE.map((item) => {
    let score = 0;
    if (queryLower.includes(item.title)) score += 5;
    for (const kw of item.keywords) {
      if (queryLower.includes(kw)) score += 3;
    }
    for (const word of queryLower.split(/\s+/)) {
      if (word.length > 1 && item.content.includes(word)) score += 1;
    }
    return { ...item, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// ==================== LLM 生成回答 ====================

async function generateAnswerLLM(question, context = {}) {
  const docs = retrieve(question, 5);
  const contextText = docs.length > 0
    ? docs.map((d, i) => `[${i + 1}] ${d.title}（${d.category}）：${d.content}`).join('\n\n')
    : '知识库中暂无直接相关内容。';
  const userInfo = context.elderName
    ? `老人姓名：${context.elderName}；老人ID：${context.elderId || '未知'}`
    : '匿名用户';

  const systemPrompt = getPrompt('LLM_RAG_SYSTEM_PROMPT', DEFAULT_RAG_SYSTEM);
  const userPrompt = renderTemplate(
    getPrompt('LLM_RAG_USER_PROMPT', DEFAULT_RAG_USER),
    { context: contextText, question, userInfo }
  );

  try {
    const text = await callLLM(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { jsonMode: true, temperature: 0.7 }
    );
    const result = JSON.parse(text);
    return {
      answer: result.answer || '抱歉，生成回答时出现问题。',
      sources: docs.map((d) => ({ id: d.id, title: d.title, category: d.category })),
      keyPoints: result.keyPoints || [],
      followUp: result.followUp || '',
      question,
      generatedBy: 'LLM',
    };
  } catch (e) {
    console.warn('LLM RAG 生成失败，降级为关键词匹配:', e.message);
    return generateAnswerKeyword(question, context);
  }
}

// ==================== 关键词匹配回答（兜底） ====================

function generateAnswerKeyword(question, context = {}) {
  const docs = retrieve(question, 3);

  if (docs.length === 0) {
    return {
      answer: '您的问题我暂时无法从知识库中找到准确答案。建议您联系社区网格员或拨打社区服务热线获取帮助。如果您有其他养老健康方面的问题，我很乐意继续为您解答。',
      sources: [],
      question,
      generatedBy: 'keyword',
    };
  }

  const topDoc = docs[0];
  const relatedDocs = docs.slice(1).map((d) => `- ${d.title}`);
  let answer = `根据知识库中《${topDoc.title}》的信息：\n\n${topDoc.content}`;
  if (relatedDocs.length > 0) {
    answer += `\n\n您可能还想了解：\n${relatedDocs.join('\n')}`;
  }
  if (context.elderName) {
    answer = `${context.elderName}您好！\n\n${answer}`;
  }

  return {
    answer,
    sources: docs.map((d) => ({ id: d.id, title: d.title, category: d.category })),
    question,
    generatedBy: 'keyword',
  };
}

// ==================== 统一入口 ====================

function generateAnswer(question, context = {}) {
  if (isLLMAvailable()) {
    return generateAnswerLLM(question, context);
  }
  return Promise.resolve(generateAnswerKeyword(question, context));
}

// ==================== 流式生成（SSE） ====================

/**
 * 流式生成回答，每收到一个 token 就通过 onToken 回调推送
 * @param {string} question
 * @param {object} context
 * @param {Function} onToken - (token: string) => void
 * @returns {Promise<{answer, sources, question, generatedBy}>}
 */
async function generateAnswerStream(question, context = {}, onToken) {
  if (!isLLMAvailable()) {
    // 无 LLM，模拟流式输出关键词匹配结果
    const result = generateAnswerKeyword(question, context);
    const chars = result.answer.split('');
    for (const char of chars) {
      await new Promise((r) => setTimeout(r, 30));
      onToken(char);
    }
    return result;
  }

  const docs = retrieve(question, 5);
  const contextText = docs.length > 0
    ? docs.map((d, i) => `[${i + 1}] ${d.title}（${d.category}）：${d.content}`).join('\n\n')
    : '知识库中暂无直接相关内容。';
  const userInfo = context.elderName
    ? `老人姓名：${context.elderName}`
    : '匿名用户';

  // 流式使用简洁的对话提示词（非 JSON 模式，逐 token 输出）
  const systemPrompt = `你是乐龄守护智能助手，专业的社区养老服务顾问。请基于知识库内容回答问题，语言亲切温和，简洁明了。
如果知识库没有相关信息，请诚实告知并建议联系社区网格员。`;

  const userPrompt = `【知识库内容】
${contextText}

【用户信息】${userInfo}

【用户问题】${question}

请直接回答，不需要 JSON 格式。`;

  try {
    const answer = await callLLMStream(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      onToken,
      { temperature: 0.7 }
    );

    return {
      answer,
      sources: docs.map((d) => ({ id: d.id, title: d.title, category: d.category })),
      question,
      generatedBy: 'LLM-stream',
    };
  } catch (e) {
    console.warn('LLM 流式生成失败，降级为关键词匹配:', e.message);
    const result = generateAnswerKeyword(question, context);
    const chars = result.answer.split('');
    for (const char of chars) {
      await new Promise((r) => setTimeout(r, 30));
      onToken(char);
    }
    return result;
  }
}

// ==================== 分类 & 工具 ====================

function getCategories() {
  const categories = new Set(KNOWLEDGE_BASE.map((item) => item.category));
  return Array.from(categories).map((name) => ({
    name,
    count: KNOWLEDGE_BASE.filter((item) => item.category === name).length,
  }));
}

function reloadKnowledge() {
  KNOWLEDGE_BASE = loadKnowledgeBase();
  return { total: KNOWLEDGE_BASE.length };
}

// ==================== 添加知识条目 ====================

/**
 * 添加一条用户知识条目（支持从文件或文本添加）
 * @param {object} data - { title, content, category?, keywords?, source? }
 * @returns {object} 新条目
 */
function addKnowledgeItem(data) {
  const { title, content, category, keywords, source } = data;
  if (!title || !content) {
    throw new Error('标题和内容不能为空');
  }

  // 加载现有的用户条目
  const userItems = loadUserKnowledge();
  const id = nextUserId(userItems);

  // 从内容中自动提取关键词（简单分词）
  const autoKeywords = extractKeywords(content, title);

  const newItem = {
    id,
    title: String(title).trim(),
    category: (category && String(category).trim()) || '自定义知识',
    content: String(content).trim(),
    keywords: Array.isArray(keywords) && keywords.length > 0
      ? keywords
      : autoKeywords,
    source: source || 'user-upload',
    gmtCreate: new Date().toISOString(),
  };

  userItems.push(newItem);
  const ok = saveUserKnowledge(userItems);
  if (!ok) throw new Error('保存失败');

  // 重新加载知识库，让新条目立即生效
  reloadKnowledge();

  return newItem;
}

/**
 * 从文本中简单提取关键词
 */
function extractKeywords(content, title) {
  const text = `${title || ''} ${content || ''}`;
  // 提取中文词汇（2-6 字）和英文单词
  const cnWords = text.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
  const enWords = text.match(/[A-Za-z]{3,}/g) || [];

  // 统计词频
  const freq = {};
  for (const w of cnWords) {
    freq[w] = (freq[w] || 0) + 1;
  }
  for (const w of enWords) {
    freq[w.toLowerCase()] = (freq[w.toLowerCase()] || 0) + 1;
  }

  // 排除常见停用词
  const stopWords = new Set(['我们', '你们', '他们', '这个', '那个', '什么', '怎么', '可以', '应该', '需要', '现在', '今天', '昨天', '明天', '一般', '一种', '有的', '没有']);
  // 按词频排序，取前 8 个
  const sorted = Object.entries(freq)
    .filter(([w]) => !stopWords.has(w))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w);

  return sorted;
}

/**
 * 获取所有用户添加的条目
 */
function getUserKnowledgeItems() {
  return loadUserKnowledge();
}

/**
 * 删除用户添加的条目
 */
function deleteKnowledgeItem(id) {
  const userItems = loadUserKnowledge();
  const filtered = userItems.filter((it) => it.id !== id);
  if (filtered.length === userItems.length) {
    return false; // 没找到
  }
  saveUserKnowledge(filtered);
  reloadKnowledge();
  return true;
}

module.exports = {
  retrieve,
  generateAnswer,
  generateAnswerStream,
  generateAnswerKeyword,
  generateAnswerLLM,
  getCategories,
  reloadKnowledge,
  isLLMAvailable,
  addKnowledgeItem,
  getUserKnowledgeItems,
  deleteKnowledgeItem,
  KNOWLEDGE_BASE: DEFAULT_KNOWLEDGE_BASE,
};