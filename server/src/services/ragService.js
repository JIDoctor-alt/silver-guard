// ============================================================
// Silver Guard · RAG 知识库服务
// 基于养老知识库的检索增强生成（RAG）
// 支持 LLM 大模型生成 + 关键词匹配兜底
// 提示词支持通过环境变量自定义，不配置则使用内置默认
// 知识库支持通过环境变量 JSON 格式自定义
// ============================================================
const config = require('../config');

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
  // 尝试从环境变量加载自定义知识库（JSON 数组格式）
  if (config.LLM_RAG_KNOWLEDGE) {
    try {
      const parsed = JSON.parse(config.LLM_RAG_KNOWLEDGE);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`RAG 知识库已从环境变量加载，共 ${parsed.length} 条`);
        return parsed;
      }
    } catch (e) {
      console.warn('RAG 知识库 JSON 解析失败，使用内置默认:', e.message);
    }
  }
  // 内置默认知识库
  return DEFAULT_KNOWLEDGE_BASE;
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

module.exports = {
  retrieve,
  generateAnswer,
  generateAnswerKeyword,
  generateAnswerLLM,
  getCategories,
  reloadKnowledge,
  isLLMAvailable,
  KNOWLEDGE_BASE: DEFAULT_KNOWLEDGE_BASE,
};