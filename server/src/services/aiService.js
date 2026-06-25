// ============================================================
// Silver Guard · AI 音乐服务
// 作曲、作词、广场舞曲推荐与生成
// 支持 LLM 大模型生成（OpenAI 兼容接口），无 API 时自动降级为模板
// 提示词支持通过环境变量自定义，不配置则使用内置默认
// ============================================================
const config = require('../config');
const ragService = require('./ragService');

// ==================== 默认提示词 ====================

const DEFAULT_COMPOSE_SYSTEM = `你是一位经验丰富的中国传统音乐作曲家，专门为中老年人创作广场舞和健身音乐。

你的创作风格特点：
- 以五声音阶（宫商角徵羽）为基础，旋律优美流畅
- 节奏鲜明，适合广场舞和太极拳
- 和声简洁，主旋律突出
- 编曲融入二胡、笛子、琵琶等民族乐器元素

输出格式：严格返回 JSON，不要包含其他文字。`;

const DEFAULT_COMPOSE_USER = `请根据以下参数创作一首乐曲：

【主题】{theme}
【节奏】{tempo}（慢速≈72BPM，中速≈100BPM，中快≈120BPM，快速≈140BPM）
【风格】{style}
【情绪】{mood}

返回 JSON 格式：
{
  "title": "歌曲标题（10字以内）",
  "theme": "{theme}",
  "tempo": "{tempo}",
  "bpm": 数字，
  "style": "{style}",
  "mood": "{mood}",
  "key": "调式，如 C大调、D小调",
  "timeSignature": "拍号，如 4/4",
  "melody": [
    { "note": "简谱音符，如 1、2、3、5、6、1.、5.", "duration": "四分音符或八分音符" }
  ]，
  "description": "一段100字左右的乐曲说明，描述旋律特点和适合场景",
  "caution": "温馨提示：本曲为AI生成，仅供参考"
}`;

const DEFAULT_LYRICS_SYSTEM = `你是一位专为老年人创作歌词的 AI 音乐人，擅长写广场舞歌曲、民歌、怀旧金曲风格的歌词。

创作要求：
1. 歌词主题积极向上，充满生活热情，适合 50-80 岁中老年人
2. 语言通俗易懂，朗朗上口，每句 7-10 个字，押韵工整
3. 结构完整：主歌(A) + 副歌(B) + 主歌(A) + 副歌(B)，共 16-20 句
4. 避免使用网络流行语、英文、生僻字
5. 情感真挚，传递健康、快乐、亲情、邻里和睦等正能量
6. 节奏感强，适合广场舞配乐

输出格式：纯文本，不要返回 JSON，不要使用 Markdown（不要出现 # * 等符号），不要有任何说明性文字。`;

const DEFAULT_LYRICS_SYSTEM_STREAM = `你是一位专为老年人创作歌词的 AI 音乐人，擅长写广场舞歌曲、民歌、怀旧金曲风格的歌词。

创作要求：
1. 歌词主题积极向上，充满生活热情，适合 50-80 岁中老年人
2. 语言通俗易懂，朗朗上口，每句 7-10 个字，押韵工整
3. 结构完整：主歌(A) + 副歌(B) + 主歌(A) + 副歌(B)，共 16-20 句
4. 避免使用网络流行语、英文、生僻字
5. 情感真挚，传递健康、快乐、亲情、邻里和睦等正能量
6. 节奏感强，适合广场舞配乐

【重要】输出格式：必须严格采用以下纯文本格式，不要返回 JSON，不要使用 Markdown，不要有 #、*、`+ "`" + `、| 等符号：

第一行：歌曲标题（10字以内，单独一行）
第二行：空行
第三行起：歌词正文，每句单独一行
段落之间留一个空行来分隔主歌/副歌
全部歌词结束后，再写一个空行，然后写"【创作说明】"，
下一行写 50 字左右的简短创作说明

示例：
健康养生之歌

晨起阳光照窗前
伸腰展臂练太极
公园漫步空气好
每天坚持身体健

一碗清粥配小菜
少油少盐肠胃开
饭后散步三百步
身体健康福自来

【创作说明】
以日常养生为主题，贴近老年人生活，用简单明快的语言传递健康理念，ang 韵贯穿全篇。`;

const DEFAULT_LYRICS_USER = `请根据以下要求创作一首歌词：

【主题】{theme}
【体裁】{genre}
【风格】面向老年人，通俗易懂，朗朗上口
【要求】每句7-10字，共16-20句，押韵工整，结构为 A-B-A-B

【诗词文学参考】
{knowledgeContext}

输出格式：
第一行写歌曲标题（10字以内），
第二行空行，
第三行起写歌词正文，每句单独一行，
段落之间空一行，
歌词全部写完后，空一行并写"【创作说明】"，
下一行写50字左右的创作说明。

重要：不要使用 JSON、不要使用 Markdown、不要写 #、*、|、`+ "`" + ` 等符号。`;

// ==================== 歌词格式化工具 ====================

/**
 * 清洗单个 token：移除 Markdown、JSON、代码块等格式符号
 * 用于流式生成时，逐 token 清理后再发送给前端
 */
function cleanLyricToken(token) {
  if (!token) return '';
  return token
    .replace(/```[\s\S]*/g, '')        // 移除代码块起始
    .replace(/```/g, '')                // 移除代码块标记
    .replace(/`/g, '')                  // 移除行内代码标记
    .replace(/\*\*/g, '')               // 移除粗体标记
    .replace(/\*/g, '')                 // 移除列表/斜体
    .replace(/#/g, '')                  // 移除标题标记
    .replace(/\|/g, '')                 // 移除表格竖线
    .replace(/---/g, '')                // 移除分隔线
    .replace(/\[\d+\]/g, '')            // 移除引用标注
    .replace(/【\d+】/g, '');           // 移除中文编号引用
}

/**
 * 解析流式生成的纯文本歌词，提取结构化字段
 * 格式约定：
 *   第1行: 歌曲标题
 *   第2行: 空行
 *   第3行起: 歌词正文（每句一行，段落间空行分隔）
 *   歌词结束后空一行 + "【创作说明】" + 下一行：创作说明
 */
function parseLyricsFromText(text, theme, genre) {
  const lines = text.split('\n').map((l) => l.trimEnd());

  // 跳过文件开头的空行
  let idx = 0;
  while (idx < lines.length && !lines[idx].trim()) idx++;

  // === 提取标题 ===
  let title = `${theme}之歌`;
  if (idx < lines.length) {
    const firstLine = lines[idx].trim()
      .replace(/^#+\s*/, '')                 // 移除可能的 Markdown 标题
      .replace(/^【[^】]*】\s*/, '')          // 移除段落标记
      .replace(/^"|"$/g, '')                 // 移除外层引号
      .replace(/^'|'$/g, '')
      .trim();
    if (firstLine && firstLine.length <= 20 && !firstLine.includes('\n')) {
      // 如果第一行看起来像标题（不是普通歌词），则用它
      title = firstLine || `${theme}之歌`;
      idx++;
    }
  }

  // 跳过标题后的空行
  while (idx < lines.length && !lines[idx].trim()) idx++;

  // === 提取歌词正文 & 创作说明 ===
  const lyricLines = [];
  let description = `这是一首以"${theme}"为主题的${genre}风格歌词，由AI生成。`;
  let inDescription = false;
  let descriptionLines = [];

  while (idx < lines.length) {
    const line = lines[idx];
    const trimmed = line.trim();

    if (!trimmed) {
      // 空行 - 如果已经收集到歌词，保留段落分隔
      if (lyricLines.length > 0 && !inDescription) {
        lyricLines.push('');
      }
      idx++;
      continue;
    }

    // 检测创作说明标记
    if (/^【创作说明】/.test(trimmed) || /^创作说明/.test(trimmed)) {
      inDescription = true;
      idx++;
      continue;
    }

    // 检测段落标题（【主歌】/【副歌】等）—— 保留作为分隔
    if (/^【[^】]*】$/.test(trimmed)) {
      // 作为段落分隔
      if (lyricLines.length > 0) {
        const last = lyricLines[lyricLines.length - 1];
        if (last !== '') lyricLines.push(''); // 空行分隔
      }
      lyricLines.push(trimmed);
      idx++;
      continue;
    }

    if (inDescription) {
      descriptionLines.push(trimmed);
    } else {
      // 正文行 - 清洗格式
      let clean = trimmed;
      // 移除行首编号（如 "1. "、"（1）" 等）
      clean = clean.replace(/^\d+[.、)\]\s]+/, '');
      clean = clean.replace(/^[（(]\d+[）)]\s*/, '');
      // 移除可能的引号包裹
      clean = clean.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
      // 移除 Markdown 标题标记
      clean = clean.replace(/^#+\s*/, '');
      // 移除多余空格
      clean = clean.trim();

      if (clean) {
        // 过滤掉明显的非歌词行（如 JSON 残片）
        if (!/^[{}\[\]":,]+$/.test(clean)) {
          lyricLines.push(clean);
        }
      }
    }
    idx++;
  }

  // 合并创作说明
  if (descriptionLines.length > 0) {
    description = descriptionLines.join('。').replace(/。+/g, '。').trim();
    if (description.endsWith('。')) description = description.slice(0, -1);
  }

  // === 整理歌词内容 ===
  // 移除首尾空行
  while (lyricLines.length > 0 && !lyricLines[0].trim()) lyricLines.shift();
  while (lyricLines.length > 0 && !lyricLines[lyricLines.length - 1].trim()) lyricLines.pop();

  // 避免连续多个空行
  const cleanedLyrics = [];
  for (let i = 0; i < lyricLines.length; i++) {
    if (!lyricLines[i].trim()) {
      if (cleanedLyrics.length > 0 && cleanedLyrics[cleanedLyrics.length - 1] !== '') {
        cleanedLyrics.push('');
      }
    } else {
      cleanedLyrics.push(lyricLines[i]);
    }
  }

  const content = cleanedLyrics.join('\n');
  const lineCount = cleanedLyrics.filter((l) => l.trim()).length;

  return {
    title,
    theme,
    genre,
    content,
    lineCount,
    description,
    generatedBy: 'LLM-stream',
  };
}

// ==================== 提示词工具函数 ====================

/**
 * 获取提示词：优先使用环境变量配置，未配置则使用内置默认
 * @param {string} configKey - config 中的键名
 * @param {string} defaultPrompt - 内置默认提示词
 */
function getPrompt(configKey, defaultPrompt) {
  return config[configKey] || defaultPrompt;
}

/**
 * 渲染模板：将 {var} 替换为实际值
 * @param {string} template - 含 {var} 占位符的模板
 * @param {object} vars - 变量映射
 */
function renderTemplate(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

// ==================== 广场舞曲库 ====================
const SQUARE_DANCE_MUSIC = [
  { id: 1, title: '最炫民族风', artist: '凤凰传奇', tempo: '中快', bpm: 128, duration: '3:58', genre: '民族风', tags: ['经典', '热门', '广场舞'] },
  { id: 2, title: '小苹果', artist: '筷子兄弟', tempo: '中快', bpm: 125, duration: '3:32', genre: '流行', tags: ['经典', '热门', '广场舞'] },
  { id: 3, title: '荷塘月色', artist: '凤凰传奇', tempo: '中速', bpm: 100, duration: '4:10', genre: '民族风', tags: ['舒缓', '优美'] },
  { id: 4, title: '好运来', artist: '祖海', tempo: '中速', bpm: 110, duration: '3:45', genre: '民歌', tags: ['喜庆', '节日'] },
  { id: 5, title: '我和我的祖国', artist: '李谷一', tempo: '慢速', bpm: 80, duration: '3:55', genre: '爱国', tags: ['经典', '慢歌'] },
  { id: 6, title: '欢乐中国年', artist: '孙悦', tempo: '中快', bpm: 130, duration: '3:28', genre: '民歌', tags: ['喜庆', '春节'] },
  { id: 7, title: '健康歌', artist: '范晓萱', tempo: '中快', bpm: 120, duration: '2:58', genre: '流行', tags: ['健康', '健身'] },
  { id: 8, title: '走天涯', artist: '降央卓玛', tempo: '中速', bpm: 105, duration: '4:20', genre: '民族风', tags: ['草原', '豪迈'] },
  { id: 9, title: '套马杆', artist: '乌兰图雅', tempo: '中快', bpm: 126, duration: '3:40', genre: '草原', tags: ['豪迈', '广场舞'] },
  { id: 10, title: '歌唱祖国', artist: '群星', tempo: '中速', bpm: 96, duration: '4:05', genre: '爱国', tags: ['经典', '合唱'] },
  { id: 11, title: '甜蜜蜜', artist: '邓丽君', tempo: '慢速', bpm: 76, duration: '3:30', genre: '流行', tags: ['经典', '怀旧'] },
  { id: 12, title: '月亮之上', artist: '凤凰传奇', tempo: '中速', bpm: 108, duration: '4:15', genre: '民族风', tags: ['经典', '草原'] },
  { id: 13, title: '自由飞翔', artist: '凤凰传奇', tempo: '中快', bpm: 122, duration: '4:12', genre: '民族风', tags: ['经典', '热门'] },
  { id: 14, title: '欢乐颂', artist: '贝多芬', tempo: '中速', bpm: 104, duration: '3:50', genre: '古典', tags: ['经典', '名曲'] },
  { id: 15, title: '茉莉花', artist: '传统民歌', tempo: '慢速', bpm: 72, duration: '3:20', genre: '民歌', tags: ['经典', '优美'] },
];

// ==================== 歌词模板库（LLM 不可用时的兜底） ====================
const LYRIC_TEMPLATES = {
  '健康养生': [
    { title: '晨练歌', content: '清晨太阳升起来，走出家门运动来\n伸伸胳膊踢踢腿，身体健康乐开怀\n太极拳法慢慢练，气沉丹田精神爽\n一年四季不间断，长寿百年不是梦' },
    { title: '养生谣', content: '早睡早起身体好，三餐规律不可少\n五谷杂粮搭配妙，蔬菜水果营养高\n饭后百步走一走，活到九十九不老\n心情舒畅最重要，笑口常开没烦恼' },
  ],
  '岁月情怀': [
    { title: '夕阳红', content: '最美不过夕阳红，温馨又从容\n夕阳是晚开的花，夕阳是陈年的酒\n夕阳是迟到的爱，夕阳是未了的情\n多少情爱化作一片夕阳红' },
    { title: '青春回忆', content: '那些年我们一起走过，青涩的岁月如歌\n黑板上的粉笔字，操场上的脚步声\n同桌的你还好吗，时光匆匆不等我\n回首往事如烟云，青春永驻心窝窝' },
  ],
  '社区生活': [
    { title: '邻里情', content: '远亲不如近邻亲，楼上楼下一条心\n你帮我来我帮你，和谐社区暖人心\n清晨互道一声早，黄昏散步并肩行\n社区就是大家庭，邻里和睦万事兴' },
    { title: '快乐广场', content: '广场音乐响起来，叔叔阿姨跳起来\n左三步来右三步，转个圈圈真痛快\n不管年龄有多大，只要心态年轻态\n每天锻炼一小时，幸福生活天天在' },
  ],
  '家国情怀': [
    { title: '祖国颂', content: '五星红旗迎风飘扬，胜利歌声多么响亮\n歌唱我们亲爱的祖国，从今走向繁荣富强\n越过高山越过平原，跨过奔腾的黄河长江\n宽广美丽的土地，是我们亲爱的家乡' },
    { title: '家乡美', content: '我的家乡多么美，山清水秀惹人醉\n春天花开满山坡，秋天稻谷闪金辉\n门前小河静静流，屋后青山如画美\n无论走到天涯海角，家乡永远在心头' },
  ],
};

// ==================== LLM 调用 ====================

/**
 * 判断 LLM 是否可用
 */
function isLLMAvailable() {
  return !!(config.LLM_API_KEY && config.LLM_API_KEY.trim());
}

/**
 * 调用 LLM（OpenAI 兼容接口）
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} options - { temperature, response_format }
 * @returns {Promise<string>} LLM 返回的文本
 */
async function callLLM(messages, options = {}) {
  const url = `${config.LLM_API_URL}/chat/completions`;
  const body = {
    model: config.LLM_MODEL,
    messages,
    temperature: options.temperature ?? 0.8,
    max_tokens: options.max_tokens ?? 2000,
  };

  // 部分模型（如通义千问）支持 JSON 模式
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
    temperature: options.temperature ?? 0.9,
    max_tokens: options.max_tokens ?? 2000,
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

// ==================== 作曲（LLM） ====================

/**
 * 作曲 - LLM 生成
 */
async function composeMusicLLM(params = {}) {
  const { theme = '欢快', tempo = '中速', style = '民族风', mood = '愉快' } = params;

  const systemPrompt = getPrompt('LLM_COMPOSE_SYSTEM_PROMPT', DEFAULT_COMPOSE_SYSTEM);
  const userPrompt = renderTemplate(
    getPrompt('LLM_COMPOSE_USER_PROMPT', DEFAULT_COMPOSE_USER),
    { theme, tempo, style, mood }
  );

  try {
    const text = await callLLM(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { jsonMode: true, temperature: 0.9 }
    );
    const result = JSON.parse(text);
    return { ...result, generatedBy: 'LLM' };
  } catch (e) {
    console.warn('LLM 作曲失败，降级为模板:', e.message);
    return composeMusicTemplate(params);
  }
}

/**
 * 作曲 - 模板兜底
 */
function composeMusicTemplate(params = {}) {
  const { theme = '欢快', tempo = '中速', style = '民族风', mood = '愉快' } = params;
  const bpmMap = { '慢速': 72, '中速': 100, '中快': 120, '快速': 140 };
  const bpm = bpmMap[tempo] || 100;
  const notes = ['1', '2', '3', '5', '6', '1.', '5.', '6.', '3', '2', '1', '5'];
  const melody = [];
  for (let i = 0; i < 16; i++) {
    melody.push({
      note: notes[Math.floor(Math.random() * notes.length)],
      duration: Math.random() > 0.5 ? '四分音符' : '八分音符',
    });
  }
  return {
    title: `${theme}${style}曲`,
    theme, tempo, bpm, style, mood,
    key: 'C大调',
    timeSignature: '4/4',
    melody,
    description: `这是一首${style}风格的${tempo}曲子，适合${mood}心情时聆听。BPM=${bpm}，C大调，4/4拍。旋律以五声音阶为基础，具有浓郁的${style}特色。`,
    caution: '本曲为AI生成，仅供参考。如需专业曲谱，请咨询音乐制作人。',
    generatedBy: 'template',
  };
}

/**
 * 作曲（统一入口，自动选择 LLM 或模板）
 */
function composeMusic(params) {
  if (isLLMAvailable()) {
    return composeMusicLLM(params);
  }
  return Promise.resolve(composeMusicTemplate(params));
}

// ==================== 作词（LLM） ====================

/**
 * 作词 - LLM 生成
 */
async function composeLyricsLLM(params = {}) {
  const { theme = '健康养生', genre = '民歌' } = params;

  // 从知识库检索文学经典相关内容
  const knowledgeDocs = ragService.retrieve(theme + ' ' + genre + ' 作词 押韵 诗词', 5);
  const knowledgeContext = knowledgeDocs.length > 0
    ? knowledgeDocs.map((d) => `【${d.title}】${d.content}`).join('\n\n')
    : '参考传统诗词格律，创作符合老年人审美的歌词。';

  const systemPrompt = getPrompt('LLM_LYRICS_SYSTEM_PROMPT', DEFAULT_LYRICS_SYSTEM);
  const userPrompt = renderTemplate(
    getPrompt('LLM_LYRICS_USER_PROMPT', DEFAULT_LYRICS_USER),
    { theme, genre, knowledgeContext }
  );

  try {
    const text = await callLLM(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.9 }
    );
    // 从纯文本中解析结构化字段
    return parseLyricsFromText(text, theme, genre);
  } catch (e) {
    console.warn('LLM 作词失败，降级为模板:', e.message);
    return composeLyricsTemplate(params);
  }
}

/**
 * 作词 - 模板兜底
 */
function composeLyricsTemplate(params = {}) {
  const { theme = '健康养生', genre = '民歌' } = params;
  const templates = LYRIC_TEMPLATES[theme] || LYRIC_TEMPLATES['健康养生'];
  const selected = templates[Math.floor(Math.random() * templates.length)];
  return {
    title: selected.title,
    theme,
    genre,
    content: selected.content,
    lineCount: selected.content.split('\n').length,
    description: `这是一首以"${theme}"为主题的${genre}风格歌词，共${selected.content.split('\n').length}句。`,
    generatedBy: 'template',
  };
}

/**
 * 作词（统一入口，自动选择 LLM 或模板）
 */
function composeLyrics(params) {
  if (isLLMAvailable()) {
    return composeLyricsLLM(params);
  }
  return Promise.resolve(composeLyricsTemplate(params));
}

/**
 * 作词 - 流式生成（SSE 逐 token 推送）
 * @param {object} params - { theme, genre }
 * @param {Function} onToken - 每收到一个 token 时回调
 * @returns {Promise<object>} 完整歌词结果
 */
async function composeLyricsStream(params = {}, onToken) {
  const { theme = '健康养生', genre = '民歌' } = params;

  if (!isLLMAvailable()) {
    // 无 LLM，降级为模板，模拟流式输出
    const result = composeLyricsTemplate(params);
    // 构造标题+内容的流式输出格式
    const streamText = `${result.title}\n\n${result.content}\n\n【创作说明】\n${result.description}`;
    const chars = streamText.split('');
    for (const char of chars) {
      await new Promise((r) => setTimeout(r, 30));
      onToken(char);
    }
    return result;
  }

  // 从知识库检索文学经典相关内容
  const knowledgeDocs = ragService.retrieve(theme + ' ' + genre + ' 作词 押韵 诗词', 5);
  const knowledgeContext = knowledgeDocs.length > 0
    ? knowledgeDocs.map((d) => `【${d.title}】${d.content}`).join('\n\n')
    : '参考传统诗词格律，创作符合老年人审美的歌词。';

  // 流式生成：使用流式专用系统提示词（纯文本输出）
  const systemPrompt = getPrompt('LLM_LYRICS_SYSTEM_PROMPT', DEFAULT_LYRICS_SYSTEM_STREAM);
  const userPrompt = renderTemplate(
    getPrompt('LLM_LYRICS_USER_PROMPT', DEFAULT_LYRICS_USER),
    { theme, genre, knowledgeContext }
  );

  // 包装 onToken：逐 token 清洗，去除 Markdown/JSON 符号
  const wrappedOnToken = (token) => {
    const cleaned = cleanLyricToken(token);
    if (cleaned) onToken(cleaned);
  };

  try {
    const fullText = await callLLMStream(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      wrappedOnToken,
      { temperature: 0.9 }
    );

    // 流式完成后，从完整纯文本中解析结构化字段
    return parseLyricsFromText(fullText, theme, genre);
  } catch (e) {
    console.warn('LLM 流式作词失败，降级为模板:', e.message);
    const result = composeLyricsTemplate(params);
    const chars = result.content.split('');
    for (const char of chars) {
      await new Promise((r) => setTimeout(r, 30));
      onToken(char);
    }
    return result;
  }
}

// ==================== 广场舞曲推荐 ====================

function recommendDanceMusic(options = {}) {
  let result = [...SQUARE_DANCE_MUSIC];
  if (options.tempo) result = result.filter((m) => m.tempo === options.tempo);
  if (options.genre) result = result.filter((m) => m.genre === options.genre);
  if (options.tag) result = result.filter((m) => m.tags.includes(options.tag));
  result = result.sort(() => Math.random() - 0.5);
  const limit = options.limit || 5;
  return result.slice(0, limit);
}

// ==================== 分类信息 ====================

function getMusicCategories() {
  const genres = new Set(SQUARE_DANCE_MUSIC.map((m) => m.genre));
  const tempos = new Set(SQUARE_DANCE_MUSIC.map((m) => m.tempo));
  const tags = new Set();
  SQUARE_DANCE_MUSIC.forEach((m) => m.tags.forEach((t) => tags.add(t)));
  return {
    genres: Array.from(genres),
    tempos: Array.from(tempos),
    tags: Array.from(tags),
    lyricThemes: Object.keys(LYRIC_TEMPLATES),
    totalSongs: SQUARE_DANCE_MUSIC.length,
    llmAvailable: isLLMAvailable(),
  };
}

module.exports = {
  recommendDanceMusic,
  composeMusic,
  composeMusicTemplate,
  composeLyrics,
  composeLyricsStream,
  composeLyricsTemplate,
  getMusicCategories,
  isLLMAvailable,
  SQUARE_DANCE_MUSIC,
};