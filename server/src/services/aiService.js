// ============================================================
// Silver Guard · AI 音乐服务
// 作曲、作词、广场舞曲推荐与生成
// 支持 LLM 大模型生成（OpenAI 兼容接口），无 API 时自动降级为模板
// 提示词支持通过环境变量自定义，不配置则使用内置默认
// ============================================================
const config = require('../config');

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

输出格式：严格返回 JSON，不要包含其他文字。`;

const DEFAULT_LYRICS_USER = `请根据以下要求创作一首歌词：

【主题】{theme}
【体裁】{genre}
【风格】面向老年人，通俗易懂，朗朗上口
【要求】每句7-10字，共16-20句，押韵工整，结构为 A-B-A-B

返回 JSON 格式：
{
  "title": "歌曲标题（10字以内）",
  "theme": "{theme}",
  "genre": "{genre}",
  "content": "完整歌词，每句一行，用 \\n 分隔",
  "lineCount": 数字，
  "rhymeScheme": "押韵方式说明，如：每两句押韵，ang韵",
  "description": "一段50字左右的创作说明"
}`;

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

  const systemPrompt = getPrompt('LLM_LYRICS_SYSTEM_PROMPT', DEFAULT_LYRICS_SYSTEM);
  const userPrompt = renderTemplate(
    getPrompt('LLM_LYRICS_USER_PROMPT', DEFAULT_LYRICS_USER),
    { theme, genre }
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
  composeLyricsTemplate,
  getMusicCategories,
  isLLMAvailable,
  SQUARE_DANCE_MUSIC,
};