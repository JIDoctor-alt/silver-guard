<<<<<<< HEAD
/**
 * ============================================================
 * 乐龄守护 · 音乐创作服务
 * 结合 AI 社区独居老人智能巡检系统
 * 支持：歌词创作、AI 作曲、养老歌曲、社区主题曲等
 * ============================================================
 */

const express = require('express');
const router = express.Router();

/**
 * 预设主题模板
 * 根据不同场景生成专属歌词和音乐风格
 */
const THEME_TEMPLATES = {
  // 养老关怀主题
  elderCare: {
    name: '养老关怀',
    style: '舒缓钢琴曲 + 温暖人声',
    bpm: 60,
    mood: '温暖、舒缓、安心',
    tags: ['养老', '关怀', '陪伴', '社区'],
    lyricTemplate: `清晨的阳光照进窗台
社区网格员轻轻敲门来
独居老人不用怕
智慧养老守护爱

（副歌）
温暖在你我之间传递
安全是我们共同的期盼
银发时光也精彩
社区守护永不改

午后的阳光暖洋洋
智能设备时刻在守望
跌倒检测、紧急呼叫
科技带来安全感

（副歌）
温暖在你我之间传递
安全是我们共同的期盼
银发时光也精彩
社区守护永不改`
  },

  // 广场舞主题
  squareDance: {
    name: '广场舞',
    style: '节奏强劲 + 民族元素',
    bpm: 120,
    mood: '活力、健康、欢乐',
    tags: ['广场舞', '健身', '舞蹈', '健康'],
    lyricTemplate: `大爷大妈跳起来
广场上面真热闹
社区广场舞呀
健康快乐最重要

（副歌）
我们跳舞真开心
健身强体笑盈盈
邻里一起更团结
幸福生活甜如蜜

左三圈右三圈
脖子扭扭屁股扭扭
跟着音乐一起动
健康长寿到白头

（副歌）
我们跳舞真开心
健身强体笑盈盈
邻里一起更团结
幸福生活甜如蜜`
  },

  // 安全巡检主题
  patrol: {
    name: '安全巡检',
    style: '活力进行曲 + 电子节拍',
    bpm: 100,
    mood: '活力、专业、可靠',
    tags: ['巡检', '安全', '守护', '网格'],
    lyricTemplate: `穿上蓝马甲出发
网格员整装出发
走过每条街巷
守护每个家

（副歌）
安全巡检我在行
社区和谐我护航
用脚步丈量温暖
用责任守护安康

敲门问候老人笑
设备检查不能少
发现问题及时报
服务社区我骄傲

（副歌）
安全巡检我在行
社区和谐我护航
用脚步丈量温暖
用责任守护安康`
  },

  // 预警响应主题
  alert: {
    name: '预警响应',
    style: '紧张电子乐 + 交响乐高潮',
    bpm: 120,
    mood: '紧迫、高效、可靠',
    tags: ['预警', '紧急', '响应', '救援'],
    lyricTemplate: `警报响起我不慌
智慧系统来帮忙
AI 识别风险点
守护安全我在岗

（副歌）
预警响应快快快
争分夺秒不懈怠
老人安全挂心怀
社区和谐永常在

设备联动响应快
网格员即刻出发
排除隐患保平安
温暖送到千万家

（副歌）
预警响应快快快
争分夺秒不懈怠
老人安全挂心怀
社区和谐永常在`
  },

  // 社区和谐主题
  community: {
    name: '社区和谐',
    style: '欢快民乐 + 合唱',
    bpm: 90,
    mood: '欢乐、温馨、和谐',
    tags: ['社区', '和谐', '邻里', '欢乐'],
    lyricTemplate: `邻里和睦一家亲
互帮互助见真情
独居老人有人问
社区关怀暖人心

（副歌）
我们社区最温暖
和谐友爱大家庭
网格服务送上门
幸福生活万年青

尊老爱幼传统美
志愿服务暖心扉
智慧养老新风尚
科技助老更便利

（副歌）
我们社区最温暖
和谐友爱大家庭
网格服务送上门
幸福生活万年青`
  },

  // 养老院主题曲
  nursingHome: {
    name: '养老院主题曲',
    style: '温馨合唱 + 钢琴伴奏',
    bpm: 70,
    mood: '温馨、感恩、幸福',
    tags: ['养老院', '夕阳红', '感恩', '幸福'],
    lyricTemplate: `最美不过夕阳红
温馨又从容
养老院里笑声多
温暖如春风

（副歌）
夕阳无限好
晚年更精彩
社区关怀在身边
幸福满心田

工作人员像亲人
照顾周到又细心
老人脸上笑开颜
安享幸福每一天

（副歌）
夕阳无限好
晚年更精彩
社区关怀在身边
幸福满心田`
  },

  // 现代流行主题曲
  modernPop: {
    name: '现代流行主题曲',
    style: '现代流行 + 电子元素',
    bpm: 110,
    mood: '时尚、科技、未来',
    tags: ['现代', '科技', '智能', '未来'],
    lyricTemplate: `科技走进社区里
智慧养老新方式
AI 守护每一天
温暖服务零距离

（副歌）
我们走在新时代
智能社区展风采
科技助老更便利
幸福生活乐开怀

数据连接你我他
网格服务顶呱呱
一键呼叫随时在
安全守护送到家

（副歌）
我们走在新时代
智能社区展风采
科技助老更便利
幸福生活乐开怀`
  },

  // 古典音乐风格
  classical: {
    name: '古典音乐',
    style: '交响乐 + 古典编曲',
    bpm: 60,
    mood: '优雅、深沉、庄严',
    tags: ['古典', '优雅', '庄严', '文化'],
    lyricTemplate: `社区文化永流传
古典韵律在心间
尊老爱幼传美德
和谐共建好家园

（间奏）
弦乐悠扬缓缓起
钢琴轻弹诉衷情

（副歌）
社区和谐如一家
传统文化放光华
古风今韵相辉映
幸福生活美如画`
  },

  // 夜间守护主题
  nightWatch: {
    name: '夜间守护',
    style: '静谧环境音 + 轻柔钢琴',
    bpm: 50,
    mood: '宁静、安心、守护',
    tags: ['夜晚', '守护', '静谧', '安宁'],
    lyricTemplate: `夜幕降临万家灯
智能设备守安宁
独居老人睡得香
社区保护伴天明

（副歌）
夜间守护不打烊
科技助老保安康
安心入眠无担忧
美好明天再相望

设备运转悄悄声
异常告警随时听
网格员二十四
守护每颗星星

（副歌）
夜间守护不打烊
科技助老保安康
安心入眠无担忧
美好明天再相望`
  },

  // 紧急救援主题
  rescue: {
    name: '紧急救援',
    style: '紧张快节奏 + 交响乐',
    bpm: 140,
    mood: '紧张、迅速、可靠',
    tags: ['紧急', '救援', '迅速', '生命'],
    lyricTemplate: `紧急警报已响起
生命守护争分秒
AI 识别异常情
救援力量速响应

（副歌）
争分夺秒救生命
社区联动显真情
老人安全记心间
共建平安家园

设备联动信息准
位置锁定快又准
医护人员速到达
转危为安见真情

（副歌）
争分夺秒救生命
社区联动显真情
老人安全记心间
共建平安家园`
  },

  // 亲子活动主题
  familyActivity: {
    name: '亲子活动',
    style: '欢快儿童曲 + 亲子合唱',
    bpm: 100,
    mood: '欢乐、温馨、亲情',
    tags: ['亲子', '活动', '家庭', '欢乐'],
    lyricTemplate: `爷爷奶奶笑开颜
孙子孙女围身边
社区亲子活动日
欢乐幸福满心田

（副歌）
大手牵小手
一起向前走
尊老爱幼代代传
幸福生活到永久

爷爷奶奶讲过去
孙子孙女听故事
传统文化记心间
美好未来共创造

（副歌）
大手牵小手
一起向前走
尊老爱幼代代传
幸福生活到永久`
  }
};

/**
 * 音乐风格预设
 */
const MUSIC_STYLES = [
  { id: 'pop', name: '现代流行', icon: '🎵', description: '节奏明快，易于传唱，适合社区活动', bpmRange: '80-120' },
  { id: 'folk', name: '民谣', icon: '🪕', description: '温暖朴实，体现邻里温情', bpmRange: '70-90' },
  { id: 'classical', name: '古典音乐', icon: '🎹', description: '优雅深沉，提升社区文化品位', bpmRange: '40-80' },
  { id: 'squareDance', name: '广场舞', icon: '💃', description: '节奏强劲，适合大妈大爷健身舞蹈', bpmRange: '100-130' },
  { id: 'electronic', name: '电子乐', icon: '🎛️', description: '现代科技感，适合系统主题', bpmRange: '110-140' },
  { id: 'ambient', name: '环境音', icon: '🌿', description: '轻柔舒缓，适合养老院背景音乐', bpmRange: '40-60' },
  { id: 'orchestra', name: '交响乐', icon: '🎻', description: '气势磅礴，适合主题曲', bpmRange: '60-100' },
  { id: 'chinese', name: '中国风', icon: '🎋', description: '传统韵味，地方特色', bpmRange: '70-100' },
  { id: 'childlike', name: '童趣', icon: '🎈', description: '活泼可爱，适合亲子活动', bpmRange: '90-120' },
  { id: 'rock', name: '摇滚', icon: '🎸', description: '充满活力，适合年轻社区工作者', bpmRange: '120-150' }
];

/**
 * 生成歌词
 * POST /api/music/lyrics
 */
router.post('/lyrics', async (req, res) => {
  try {
    const { theme, customTheme, style, customWords } = req.body;

    // 确定主题
    const selectedTheme = THEME_TEMPLATES[theme] || THEME_TEMPLATES.elderCare;

    // 生成歌词内容
    let lyrics = selectedTheme.lyricTemplate;

    // 如果有自定义词，替换主题词
    if (customWords) {
      lyrics = lyrics
        .replace(/社区/g, customWords.community || '社区')
        .replace(/网格/g, customWords.patrol || '网格')
        .replace(/老人/g, customWords.elder || '老人');
    }

    // 如果有自定义主题描述
    let title = `${selectedTheme.name}主题曲`;
    let description = `一首关于${selectedTheme.mood}的${selectedTheme.style}`;

    if (customTheme) {
      title = customTheme.title || title;
      description = customTheme.description || description;
    }

    res.json({
      code: 0,
      data: {
        id: `lyrics_${Date.now()}`,
        title,
        description,
        theme: selectedTheme.name,
        style: selectedTheme.style,
        bpm: selectedTheme.bpm,
        mood: selectedTheme.mood,
        tags: selectedTheme.tags,
        lyrics,
        createdAt: new Date().toISOString(),
        suggestedStyle: MUSIC_STYLES[Math.floor(Math.random() * MUSIC_STYLES.length)]
      }
    });
  } catch (error) {
    console.error('生成歌词失败:', error);
    res.status(500).json({ code: 500, message: '生成歌词失败' });
=======
// ============================================================
// Silver Guard · AI 音乐陪伴路由
// 作曲、作词、广场舞曲推荐与生成
// ============================================================
const express = require('express');
const aiService = require('../services/aiService');

const router = express.Router();

/**
 * GET /api/music/dance
 * 推荐广场舞曲
 * Query: ?tempo=中速&genre=民族风&tag=热门&limit=10
 */
router.get('/dance', (req, res) => {
  const { tempo, genre, tag, limit } = req.query;
  const songs = aiService.recommendDanceMusic({
    tempo,
    genre,
    tag,
    limit: parseInt(limit) || 10,
  });
  res.json({ code: 0, message: '推荐成功', data: { songs, total: songs.length } });
});

/**
 * POST /api/music/compose
 * AI 作曲（LLM 生成，无 API 时降级为模板）
 * Body: { theme, tempo, style, mood }
 */
router.post('/compose', async (req, res) => {
  try {
    const { theme, tempo, style, mood } = req.body;
    const music = await aiService.composeMusic({ theme, tempo, style, mood });
    res.json({ code: 0, message: '作曲成功', data: music });
  } catch (e) {
    console.error('作曲失败:', e.message);
    res.status(500).json({ code: 500, message: '作曲失败，请稍后重试', data: null });
  }
});

/**
 * POST /api/music/lyrics
 * AI 作词（LLM 生成，无 API 时降级为模板）
 * Body: { theme, genre }
 */
router.post('/lyrics', async (req, res) => {
  try {
    const { theme, genre } = req.body;
    const lyrics = await aiService.composeLyrics({ theme, genre });
    res.json({ code: 0, message: '作词成功', data: lyrics });
  } catch (e) {
    console.error('作词失败:', e.message);
    res.status(500).json({ code: 500, message: '作词失败，请稍后重试', data: null });
>>>>>>> 8a79316 (feat: SSE/RAG/音乐智能体 + 提示词配置系统)
  }
});

/**
<<<<<<< HEAD
 * 获取可用主题列表
 * GET /api/music/themes
 */
router.get('/themes', (req, res) => {
  const themes = Object.entries(THEME_TEMPLATES).map(([key, value]) => ({
    id: key,
    name: value.name,
    style: value.style,
    bpm: value.bpm,
    mood: value.mood,
    tags: value.tags
  }));

  res.json({
    code: 0,
    data: themes
  });
});

/**
 * 获取音乐风格列表
 * GET /api/music/styles
 */
router.get('/styles', (req, res) => {
  res.json({
    code: 0,
    data: MUSIC_STYLES
  });
});

/**
 * 生成音乐（模拟，实际需要对接 Suno API）
 * POST /api/music/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { lyrics, theme, style, title } = req.body;

    if (!lyrics) {
      return res.status(400).json({ code: 400, message: '请提供歌词内容' });
    }

    // 模拟音乐生成过程
    const generationId = `music_${Date.now()}`;

    // 实际项目中，这里应该调用 Suno API 或其他音乐生成服务
    // Suno API 集成示例:
    // const sunoService = require('../services/suno');
    // const result = await sunoService.generate({ lyrics, style, title });

    // 返回模拟数据，实际使用时替换为真实 API 调用
    res.json({
      code: 0,
      data: {
        id: generationId,
        title: title || '未命名作品',
        status: 'generating',
        estimatedTime: 120, // 预计生成时间（秒）
        message: '音乐生成中，请稍候...',
        // 实际 API 返回的音频 URL
        audioUrl: null,
        // Suno 等平台生成的歌曲页面链接
        externalUrl: null,
        lyrics,
        theme,
        style,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('生成音乐失败:', error);
    res.status(500).json({ code: 500, message: '生成音乐失败' });
  }
});

/**
 * 查询音乐生成状态
 * GET /api/music/status/:id
 */
router.get('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 实际项目中，应该查询数据库或音乐生成服务状态
    // 这里返回模拟数据
    res.json({
      code: 0,
      data: {
        id,
        status: 'completed',
        progress: 100,
        audioUrl: `https://example.com/music/${id}.mp3`,
        coverUrl: `https://example.com/cover/${id}.jpg`,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('查询状态失败:', error);
    res.status(500).json({ code: 500, message: '查询状态失败' });
  }
});

/**
 * 获取我的作品列表
 * GET /api/music/my-works
 */
router.get('/my-works', (req, res) => {
  // 实际项目中，应该查询数据库
  const works = [
    {
      id: 'work_001',
      title: '养老关怀之歌',
      theme: 'elderCare',
      style: '流行',
      duration: 180,
      coverUrl: 'https://picsum.photos/300/300?random=1',
      audioUrl: 'https://example.com/work_001.mp3',
      createdAt: '2026-06-15T10:00:00Z'
    },
    {
      id: 'work_002',
      title: '网格员之歌',
      theme: 'patrol',
      style: '民谣',
      duration: 210,
      coverUrl: 'https://picsum.photos/300/300?random=2',
      audioUrl: 'https://example.com/work_002.mp3',
      createdAt: '2026-06-14T15:30:00Z'
    }
  ];

  res.json({
    code: 0,
    data: works
  });
});

/**
 * 保存作品
 * POST /api/music/save
 */
router.post('/save', (req, res) => {
  try {
    const { title, lyrics, theme, style, audioUrl, coverUrl } = req.body;

    if (!title || !lyrics) {
      return res.status(400).json({ code: 400, message: '标题和歌词不能为空' });
    }

    // 实际项目中，应该保存到数据库
    const workId = `work_${Date.now()}`;

    res.json({
      code: 0,
      data: {
        id: workId,
        title,
        lyrics,
        theme,
        style,
        audioUrl,
        coverUrl,
        createdAt: new Date().toISOString()
      },
      message: '作品保存成功'
    });
  } catch (error) {
    console.error('保存作品失败:', error);
    res.status(500).json({ code: 500, message: '保存作品失败' });
  }
});

/**
 * 删除作品
 * DELETE /api/music/:id
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    // 实际项目中，应该从数据库删除
    res.json({
      code: 0,
      message: '作品删除成功'
    });
  } catch (error) {
    console.error('删除作品失败:', error);
    res.status(500).json({ code: 500, message: '删除作品失败' });
  }
});

module.exports = router;
=======
 * GET /api/music/categories
 * 获取音乐分类信息
 */
router.get('/categories', (req, res) => {
  const categories = aiService.getMusicCategories();
  res.json({ code: 0, message: '获取成功', data: categories });
});

module.exports = router;
>>>>>>> 8a79316 (feat: SSE/RAG/音乐智能体 + 提示词配置系统)
