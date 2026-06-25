// ============================================================
// Silver Guard · 银龄广场服务
// 广场舞曲库、社区活动管理、音乐创作知识库与素材库
// ============================================================
const pool = require('../db/mysql');

// ==================== 广场舞步法教学库 ====================

const DANCE_STEPS = [
  {
    id: 1, name: '十字步', difficulty: '入门', category: '基础步法',
    description: '十字步是广场舞最基础的步法，步伐呈十字形，节奏感强，适合初学者。',
    steps: [
      '左脚向前迈一小步，重心前移',
      '右脚向右横跨一步，与肩同宽',
      '左脚收回，回到原位',
      '右脚向后迈一小步，重心后移',
      '左脚向左横跨一步',
      '右脚收回，完成一个循环',
    ],
    tips: '保持身体直立，手臂自然摆动，跟随音乐节奏。',
  },
  {
    id: 2, name: '秧歌步', difficulty: '入门', category: '民族舞步',
    description: '源自东北秧歌，步伐轻快活泼，身体要有韵律地扭动。',
    steps: [
      '左脚前迈，脚跟先着地，身体微前倾',
      '右脚跟进，脚尖点地',
      '左脚后退，脚尖先着地',
      '右脚后退，身体微后仰',
      '手臂随步伐前后摆动，手腕要有翻腕动作',
    ],
    tips: '注意腰胯的扭动，手臂摆动幅度要大，表情要欢快。',
  },
  {
    id: 3, name: '恰恰步', difficulty: '进阶', category: '拉丁舞步',
    description: '恰恰舞的基本步法，节奏为"慢-慢-快-快-慢"，适合节奏感强的音乐。',
    steps: [
      '准备姿势：双脚并拢，膝盖微弯',
      '慢：左脚向左迈一步',
      '慢：右脚原地踏步',
      '快：左脚收回靠拢',
      '快：右脚原地踏步',
      '慢：左脚向左迈一步',
    ],
    tips: '注意胯部的摆动，脚步要轻快，重心在两只脚之间快速转换。',
  },
  {
    id: 4, name: '三步踩', difficulty: '入门', category: '基础步法',
    description: '三步踩是交谊舞基础步法，节奏为"嘭-嚓-嚓"，适合慢三拍音乐。',
    steps: [
      '第一拍：左脚向前迈一大步（嘭）',
      '第二拍：右脚向右前方迈一小步（嚓）',
      '第三拍：左脚并拢右脚（嚓）',
      '重复：换右脚前迈，镜像动作',
    ],
    tips: '第一步要大，后两步要小，身体起伏要自然，像波浪一样。',
  },
  {
    id: 5, name: '垫步', difficulty: '入门', category: '基础步法',
    description: '垫步是健身操常用步法，简单易学，适合热身和节奏较快的音乐。',
    steps: [
      '左脚向左迈一步，右脚脚尖在左脚旁垫一下',
      '右脚向右迈一步，左脚脚尖在右脚旁垫一下',
      '手臂配合：左迈时右臂上举，右迈时左臂上举',
      '可以加入转身动作增加趣味性',
    ],
    tips: '垫步时膝盖要放松，身体重心要稳，手臂动作要舒展。',
  },
  {
    id: 6, name: '伦巴步', difficulty: '进阶', category: '拉丁舞步',
    description: '伦巴舞基本步法，节奏为"慢-快-快"，动作舒展优美，适合抒情音乐。',
    steps: [
      '慢：左脚向前迈一步，重心前移，胯部前推',
      '快：右脚原地踏步，重心回移',
      '快：左脚收回靠拢右脚',
      '慢：右脚向后迈一步，重心后移',
      '快：左脚原地踏步',
      '快：右脚收回靠拢左脚',
    ],
    tips: '伦巴的精髓在于胯部的"8字"运动，动作要柔美流畅。',
  },
  {
    id: 7, name: '踢踏步', difficulty: '入门', category: '健身步法',
    description: '踢踏步是健身广场舞常用步法，模仿踢毽子动作，活泼有趣。',
    steps: [
      '左脚站立，右脚向前踢出（脚背绷直）',
      '右脚收回，脚尖在左脚旁点地',
      '右脚向右迈一步，左脚跟进点地',
      '换脚重复：右脚站立，左脚前踢',
    ],
    tips: '踢腿高度量力而行，不要过高，膝盖可以微弯，保持身体平衡。',
  },
  {
    id: 8, name: '四方步', difficulty: '入门', category: '基础步法',
    description: '四方步是广场舞编舞的核心步法，在四个方向移动，形成方形路线。',
    steps: [
      '面向正前方，左脚向前迈一步',
      '右脚向右横迈一步，身体转向右侧',
      '左脚向后迈一步（实际是向原方向右侧）',
      '右脚向左横迈一步，回到原位',
      '完成一个方块路线',
    ],
    tips: '每一步都要踩在节拍上，四个方向移动距离均匀，形成标准正方形。',
  },
  {
    id: 9, name: '云手步', difficulty: '进阶', category: '太极舞步',
    description: '结合太极拳云手动作的舞步，动作圆润流畅，适合慢节奏音乐。',
    steps: [
      '双脚分开与肩同宽，膝盖微弯',
      '重心移至右脚，左脚脚尖点地',
      '双手在胸前做云手画圆动作',
      '重心移至左脚，右脚脚尖点地',
      '双手继续画圆，身体随重心自然移动',
    ],
    tips: '云手动作要圆润，手臂画圆如抱球，眼神跟随手掌移动。',
  },
  {
    id: 10, name: '扇子舞步', difficulty: '进阶', category: '道具舞步',
    description: '手持扇子的广场舞步法，开扇合扇配合步伐，视觉效果优美。',
    steps: [
      '右手持扇，扇面收拢',
      '左脚前迈，同时右手向前展开扇面',
      '右脚跟进，扇面在胸前画弧',
      '左脚后退，扇面收拢',
      '右脚后退，扇面背在身后',
    ],
    tips: '扇子开合要干脆利落，与步伐节奏同步，扇面展开时手腕要有力度。',
  },
];

// ==================== 社区活动模板 ====================

const ACTIVITY_TEMPLATES = [
  {
    title: '社区广场舞交流赛', category: 'DANCE',
    description: '为丰富社区老年人文体生活，特举办广场舞交流赛。欢迎各舞蹈队报名参加，展示风采，以舞会友！',
    tags: ['广场舞', '比赛', '交流'],
  },
  {
    title: '老年人健康知识讲座', category: 'LECTURE',
    description: '邀请社区医生讲解老年人常见疾病预防与保健知识，包括高血压、糖尿病、骨质疏松等。现场免费测量血压血糖。',
    tags: ['健康', '讲座', '养生'],
  },
  {
    title: '端午节包粽子活动', category: 'FESTIVAL',
    description: '端午节来临之际，社区组织包粽子活动。提供粽叶、糯米等材料，大家一起动手包粽子，感受传统节日氛围。',
    tags: ['端午节', '传统', '手工'],
  },
  {
    title: '太极拳晨练班', category: 'SPORT',
    description: '每天早晨在社区广场开展太极拳晨练活动，由专业教练指导。适合各年龄段，强身健体，陶冶情操。',
    tags: ['太极拳', '晨练', '健身'],
  },
  {
    title: '老年合唱团排练', category: 'OTHER',
    description: '社区老年合唱团每周排练，学习经典红歌和民歌。欢迎喜欢唱歌的老年朋友加入，一起享受音乐的美好。',
    tags: ['合唱', '音乐', '排练'],
  },
  {
    title: '中秋赏月联欢会', category: 'FESTIVAL',
    description: '中秋节社区举办赏月联欢会，有文艺表演、猜灯谜、品月饼等活动。欢迎居民携家人参加，共度佳节。',
    tags: ['中秋节', '联欢', '猜灯谜'],
  },
  {
    title: '智能手机使用培训班', category: 'LECTURE',
    description: '帮助老年人学习智能手机基本操作：微信视频通话、健康码使用、网上挂号、拍照修图等。请携带手机参加。',
    tags: ['手机', '培训', '科技'],
  },
  {
    title: '春季健步走活动', category: 'SPORT',
    description: '春暖花开，社区组织健步走活动。路线沿社区绿道，全程约3公里。途中设有补给站和医疗点，适合各年龄段参与。',
    tags: ['健步走', '春季', '户外'],
  },
];

// ==================== 音乐创作知识库 ====================

const MUSIC_KNOWLEDGE = [
  {
    id: 1, category: 'SCALE', subCategory: '五声音阶', title: '中国五声音阶（宫商角徵羽）',
    difficulty: 'BEGINNER',
    description: '五声音阶是中国传统音乐的基础，由宫(do)、商(re)、角(mi)、徵(sol)、羽(la)五个音组成。',
    content: {
      notes: [
        { name: '宫', pitch: '1', description: '五声音阶的第一音，相当于do。音色沉稳庄重，常用于乐曲开头和结尾。' },
        { name: '商', pitch: '2', description: '五声音阶的第二音，相当于re。音色明亮，富有推进感。' },
        { name: '角', pitch: '3', description: '五声音阶的第三音，相当于mi。音色清亮，具有转折感。' },
        { name: '徵', pitch: '5', description: '五声音阶的第四音，相当于sol。音色高亢，富有激情。' },
        { name: '羽', pitch: '6', description: '五声音阶的第五音，相当于la。音色柔美，具有收束感。' },
      ],
      usage: '广场舞音乐以五声音阶为主，避免使用4(fa)和7(si)，使旋律更加流畅，适合中老年人演唱。',
    },
  },
  {
    id: 2, category: 'SCALE', subCategory: '民族调式', title: '中国民族五声调式',
    difficulty: 'INTERMEDIATE',
    description: '以五声音阶中每个音为主音，可构成五种不同的调式。',
    content: {
      modes: [
        { name: '宫调式', tonic: '宫(1)', character: '庄重、典雅', suitable: '颂歌、礼仪音乐' },
        { name: '商调式', tonic: '商(2)', character: '明亮、激昂', suitable: '进行曲、劳动号子' },
        { name: '角调式', tonic: '角(3)', character: '清新、活泼', suitable: '民谣、轻快舞曲' },
        { name: '徵调式', tonic: '徵(5)', character: '热烈、欢快', suitable: '节庆音乐、广场舞' },
        { name: '羽调式', tonic: '羽(6)', character: '柔美、抒情', suitable: '情歌、慢板舞曲' },
      ],
      recommendation: '广场舞推荐使用徵调式（欢快热烈）和宫调式（庄重大气），慢歌推荐羽调式。',
    },
  },
  {
    id: 3, category: 'RHYTHM', subCategory: '节奏型', title: '广场舞常用节奏型',
    difficulty: 'BEGINNER',
    description: '常见的广场舞音乐节奏型，以4/4拍为主，节奏鲜明。',
    content: {
      patterns: [
        { name: '基本节奏型', pattern: '咚 哒 咚 哒 |', bpm: '80-100', usage: '慢歌、太极拳配乐' },
        { name: '进行曲节奏', pattern: '咚 咚 哒 咚 |', bpm: '100-120', usage: '行进式广场舞、健身操' },
        { name: '快步节奏', pattern: '咚哒 咚哒 咚哒 咚哒 |', bpm: '120-140', usage: '快节奏广场舞、恰恰' },
        { name: '附点节奏', pattern: '咚.哒 咚.哒 |', bpm: '90-110', usage: '民族风广场舞、秧歌' },
        { name: '切分节奏', pattern: '咚 哒咚 哒 咚 |', bpm: '100-120', usage: '拉丁风格广场舞' },
      ],
      tips: '广场舞节奏不宜过快，BPM 90-120 最适合中老年人。每小节第一拍为重拍，方便舞者合拍。',
    },
  },
  {
    id: 4, category: 'HARMONY', subCategory: '和声', title: '中国民族和声进行',
    difficulty: 'INTERMEDIATE',
    description: '适合广场舞音乐的和声进行，以五声音阶为基础，简洁大气。',
    content: {
      progressions: [
        { name: '经典进行', chords: 'I - V - I', description: '最简单有力的进行，适合歌曲开头和结尾' },
        { name: '循环进行', chords: 'I - VI - II - V', description: '最常用的流行和声进行，适合主歌部分' },
        { name: '民族风进行', chords: 'I - V - VI - I', description: '具有中国民族特色的进行，适合副歌' },
        { name: '激昂进行', chords: 'IV - V - I - VI', description: '情绪推进，适合高潮部分' },
        { name: '柔情进行', chords: 'I - III - VI - V', description: '温柔抒情，适合慢板段落' },
      ],
      tips: '广场舞编曲和声不宜太复杂，以大三和弦为主，避免使用减三和弦和不协和音程。',
    },
  },
  {
    id: 5, category: 'INSTRUMENT', subCategory: '民族乐器', title: '二胡',
    difficulty: 'BEGINNER',
    description: '二胡是中国最重要的民族拉弦乐器，音色接近人声，擅长表现抒情、忧伤的情绪。',
    content: {
      type: '拉弦乐器',
      range: 'D4 - A6',
      character: '音色柔美、深沉，富有歌唱性',
      suitable: '抒情慢歌、叙事性旋律',
      famousPieces: ['二泉映月', '赛马', '良宵'],
      usage: '适合用作广场舞歌曲的前奏、间奏，或作为主旋律乐器表现深情主题。',
    },
  },
  {
    id: 6, category: 'INSTRUMENT', subCategory: '民族乐器', title: '笛子',
    difficulty: 'BEGINNER',
    description: '笛子是中国最古老的吹管乐器，音色清脆明亮，擅长表现欢快、活泼的情绪。',
    content: {
      type: '吹管乐器',
      range: 'C4 - C7',
      character: '音色清脆、嘹亮、穿透力强',
      suitable: '欢快旋律、引子、华彩段落',
      famousPieces: ['姑苏行', '扬鞭催马运粮忙', '牧民新歌'],
      usage: '适合用作广场舞歌曲的前奏引子，演奏欢快的旋律段落，增添喜庆氛围。',
    },
  },
  {
    id: 7, category: 'INSTRUMENT', subCategory: '民族乐器', title: '琵琶',
    difficulty: 'INTERMEDIATE',
    description: '琵琶是中国传统弹拨乐器，音色清脆明亮，演奏技巧丰富，表现力极强。',
    content: {
      type: '弹拨乐器',
      range: 'A2 - E6',
      character: '音色清脆、颗粒感强，能文能武',
      suitable: '节奏明快的舞曲、欢快的旋律',
      famousPieces: ['十面埋伏', '春江花月夜', '彝族舞曲'],
      usage: '适合用作广场舞歌曲的节奏伴奏，轮指技法可营造热烈氛围。',
    },
  },
  {
    id: 8, category: 'INSTRUMENT', subCategory: '民族乐器', title: '古筝',
    difficulty: 'BEGINNER',
    description: '古筝是中国传统弹拨乐器，音色优美，音域宽广，演奏技巧丰富。',
    content: {
      type: '弹拨乐器',
      range: 'D2 - D6',
      character: '音色优美、空灵、流水般流畅',
      suitable: '抒情段落、背景铺垫、华彩装饰',
      famousPieces: ['渔舟唱晚', '高山流水', '战台风'],
      usage: '适合用作广场舞歌曲的伴奏织体，刮奏技法可增添华丽感。',
    },
  },
  {
    id: 9, category: 'INSTRUMENT', subCategory: '民族乐器', title: '唢呐',
    difficulty: 'BEGINNER',
    description: '唢呐是中国传统吹管乐器，音色高亢嘹亮，极具穿透力，是民间喜庆活动的必备乐器。',
    content: {
      type: '吹管乐器',
      range: 'A3 - D6',
      character: '音色高亢、嘹亮、热烈喜庆',
      suitable: '节庆音乐、高潮段落、开场曲',
      famousPieces: ['百鸟朝凤', '一枝花', '打枣'],
      usage: '适合用作广场舞高潮部分的领奏乐器，渲染热烈气氛，是民族风广场舞的标志性音色。',
    },
  },
  {
    id: 10, category: 'MELODY', subCategory: '旋律创作', title: '广场舞旋律创作技巧',
    difficulty: 'INTERMEDIATE',
    description: '创作广场舞旋律的实用技巧，包括旋律走向、重复变化、高潮设计等。',
    content: {
      techniques: [
        { name: '重复法', description: '同一旋律片段重复出现，增强记忆点。广场舞歌曲的副歌应至少重复2-3次。' },
        { name: '模进法', description: '同一旋律型在不同音高上重复，产生推进感。如 123 变成 234 再变成 345。' },
        { name: '倒影法', description: '旋律走向反转，上行变下行。如 12345 变成 54321。' },
        { name: '加花法', description: '在骨干音之间加入装饰音，使旋律更丰富。五声音阶中常用上下邻音加花。' },
        { name: '高潮设计', description: '旋律逐步上行，节奏加密，达到最高音后回落。高潮通常放在全曲3/4处。' },
      ],
      example: '经典广场舞旋律结构：A段(8小节) → B段(8小节) → A段(8小节) → B段(8小节) → 尾声(4小节)',
    },
  },
  {
    id: 11, category: 'THEORY', subCategory: '曲式结构', title: '广场舞音乐曲式结构',
    difficulty: 'BEGINNER',
    description: '广场舞音乐的常见曲式结构和编曲布局。',
    content: {
      sections: [
        { name: '前奏', bars: '4-8小节', description: '引入主题，建立节奏感和调性。常用笛子或唢呐独奏引人。' },
        { name: '主歌A', bars: '8-16小节', description: '陈述主题，旋律平稳，节奏清晰。歌词讲述故事或描绘场景。' },
        { name: '副歌B', bars: '8-16小节', description: '高潮部分，旋律上行，节奏加密。歌词点题，情感升华。' },
        { name: '间奏', bars: '4-8小节', description: '器乐过渡段落，给舞者休息换气时间。' },
        { name: '尾声', bars: '4-8小节', description: '渐弱结束，给舞者收势。可重复最后一句渐慢。' },
      ],
      total: '一首标准广场舞曲约3-4分钟，总长度以32-48小节为宜。',
    },
  },
  {
    id: 12, category: 'THEORY', subCategory: '编曲配器', title: '广场舞编曲配器指南',
    difficulty: 'ADVANCED',
    description: '广场舞音乐的编曲配器方案，如何搭配民族乐器和现代乐器。',
    content: {
      orchestrations: [
        { name: '民族风配器', instruments: '唢呐(主旋律) + 琵琶(节奏) + 二胡(副旋律) + 笛子(装饰) + 锣鼓(打击乐)', style: '传统喜庆' },
        { name: '融合配器', instruments: '笛子(主旋律) + 电子鼓(节奏) + 古筝(织体) + 合成器(铺垫)', style: '现代民族风' },
        { name: '轻音乐配器', instruments: '二胡(主旋律) + 钢琴(伴奏) + 弦乐组(背景) + 轻打击乐', style: '抒情慢歌' },
        { name: '舞曲配器', instruments: '电子鼓(强节奏) + 合成器Bass + 笛子(旋律片段) + 人声采样', style: '健身广场舞' },
      ],
      tips: '编曲原则：节奏清晰（鼓点明确）、旋律突出（主奏乐器不混）、层次分明（每一层都能听清楚）。',
    },
  },
  // ==================== 国风音乐深度 ====================
  {
    id: 13, category: 'INSTRUMENT', subCategory: '民族乐器', title: '古琴 — 君子之器',
    difficulty: 'INTERMEDIATE',
    description: '古琴是中国最古老的弹拨乐器之一，有三千多年历史，位列"琴棋书画"之首，是文人雅士的修身之器。',
    content: {
      type: '弹拨乐器',
      range: 'C2 - D5',
      character: '音色深沉、悠远、含蓄内敛，余韵悠长',
      suitable: '冥想音乐、茶道配乐、古风歌曲引子',
      famousPieces: ['高山流水', '广陵散', '平沙落雁', '梅花三弄', '潇湘水云'],
      usage: '古琴音色古朴典雅，适合用作国风音乐的开场引子、过场间奏，营造空灵雅致的意境。与笛子、箫合奏效果极佳。',
    },
  },
  {
    id: 14, category: 'INSTRUMENT', subCategory: '民族乐器', title: '箫 — 清幽之音',
    difficulty: 'INTERMEDIATE',
    description: '箫是中国传统吹管乐器，音色柔和清幽，擅长表现深沉、悠远的情感。',
    content: {
      type: '吹管乐器',
      range: 'D3 - E5',
      character: '音色柔美、清幽、婉转，富有诗意',
      suitable: '抒情慢板、古风歌曲、影视配乐',
      famousPieces: ['梅花三弄', '妆台秋思', '平湖秋月'],
      usage: '箫适合演奏悠长绵延的旋律，与古琴合奏堪称绝配。在国风音乐中常用于表达思念、怀旧的情感段落。',
    },
  },
  {
    id: 15, category: 'INSTRUMENT', subCategory: '民族乐器', title: '扬琴 — 清脆明亮',
    difficulty: 'BEGINNER',
    description: '扬琴是中国传统击弦乐器，音色清脆明亮，颗粒感强，是民乐队中的"钢琴"。',
    content: {
      type: '击弦乐器',
      range: 'A2 - E6',
      character: '音色清脆、明亮、颗粒分明，节奏感强',
      suitable: '欢快旋律、节奏伴奏、装饰性华彩',
      famousPieces: ['春到清江', '苏武牧羊', '黄河船夫曲'],
      usage: '扬琴适合演奏快速流畅的旋律段落，也可作为节奏伴奏乐器，在国风音乐中增添灵动感。',
    },
  },
  {
    id: 16, category: 'INSTRUMENT', subCategory: '民族乐器', title: '阮 — 温润如玉',
    difficulty: 'BEGINNER',
    description: '阮是中国传统弹拨乐器，音色圆润饱满，有"中国吉他"之称。',
    content: {
      type: '弹拨乐器',
      range: 'G2 - C5',
      character: '音色圆润、饱满、温暖，共鸣好',
      suitable: '伴奏织体、中低声部填充、和声铺垫',
      famousPieces: ['丝路驼铃', '云南回忆', '满江红'],
      usage: '阮在国风音乐中担任和声铺垫角色，中阮和大阮的低音区可增加音乐厚度。',
    },
  },
  {
    id: 17, category: 'INSTRUMENT', subCategory: '民族乐器', title: '马头琴 — 草原之声',
    difficulty: 'ADVANCED',
    description: '马头琴是蒙古族拉弦乐器，音色深沉浑厚，极富表现力，被称为"草原上的小提琴"。',
    content: {
      type: '拉弦乐器',
      range: 'G2 - C5',
      character: '音色深沉、浑厚、苍凉辽阔，极富感染力',
      suitable: '草原风格音乐、抒情段落、叙事性旋律',
      famousPieces: ['万马奔腾', '草原上升起不落的太阳', '天边'],
      usage: '马头琴适合表达辽阔、苍茫的情感，在国风音乐中可用于草原主题、怀旧主题的创作。',
    },
  },
  {
    id: 18, category: 'THEORY', subCategory: '国风美学', title: '国风音乐创作美学',
    difficulty: 'INTERMEDIATE',
    description: '国风音乐的美学原则和创作理念，融合传统与现代。',
    content: {
      aesthetics: [
        { principle: '意境为先', description: '国风音乐重意境不重技巧，以音传情，以乐造境。先立意，后赋形。' },
        { principle: '留白之美', description: '音乐中的"留白"如同国画的留白，休止符和长音营造空灵感和想象空间。' },
        { principle: '虚实相生', description: '主旋律(实)与伴奏(虚)的对比，独奏(实)与合奏(虚)的交替，营造层次感。' },
        { principle: '古今融合', description: '传统乐器+现代编曲，古典旋律+电子音色，让国风既有传统韵味又有现代感。' },
        { principle: '诗词入乐', description: '将古诗词、古典词牌融入歌词创作，如《水调歌头》《虞美人》《青玉案》等。' },
      ],
      structure: '典型国风歌曲结构：引子(古琴/箫独奏) → 主歌A(轻柔叙述) → 副歌B(情感升华) → 间奏(器乐华彩) → 主歌A\' → 副歌B\' → 尾声(渐弱，余韵悠长)',
    },
  },
  {
    id: 19, category: 'THEORY', subCategory: '戏曲音乐', title: '中国戏曲音乐元素',
    difficulty: 'ADVANCED',
    description: '中国传统戏曲（京剧、昆曲、越剧等）中的音乐元素及其在国风创作中的运用。',
    content: {
      styles: [
        { name: '京剧', features: '西皮、二黄两大腔系，板式丰富，锣鼓经节奏鲜明', usage: '适合豪迈、激昂的国风歌曲，可融入"念白"元素' },
        { name: '昆曲', features: '水磨调，婉转细腻，一字多音，工尺谱记谱', usage: '适合唯美、古典的国风歌曲，可用"水磨腔"装饰旋律' },
        { name: '越剧', features: '尺调腔，柔美抒情，以女小生著称', usage: '适合江南风情的国风歌曲，旋律温婉动人' },
        { name: '黄梅戏', features: '花腔、彩腔，活泼明快，生活气息浓厚', usage: '适合轻快、活泼的国风歌曲，旋律朗朗上口' },
        { name: '秦腔', features: '高亢激越，慷慨悲壮，梆子腔', usage: '适合西北风、豪放风格的国风歌曲' },
      ],
      tips: '戏曲元素在国风音乐中的运用要点：1. 提取戏曲的旋律片段作为"基因"；2. 保留戏曲的装饰音（滑音、颤音）；3. 适当融入戏曲念白增加辨识度；4. 节奏上可借鉴戏曲板式变化。',
    },
  },
  {
    id: 20, category: 'MELODY', subCategory: '国风旋律', title: '国风旋律创作技法',
    difficulty: 'INTERMEDIATE',
    description: '国风音乐旋律创作的独特技法和注意事项。',
    content: {
      techniques: [
        { name: '五声音阶为主', description: '以宫商角徵羽(12356)为核心，避免或少用4(fa)和7(si)，保持纯正的中国味。' },
        { name: '装饰音运用', description: '大量使用倚音、波音、滑音、颤音等装饰音，模拟民族乐器的演奏特点。' },
        { name: '旋律线条', description: '国风旋律讲究"起承转合"，如同律诗的结构。旋律线条要流畅，避免大幅跳进。' },
        { name: '调式选择', description: '徵调式(欢快热烈)、羽调式(柔美抒情)、宫调式(庄重典雅)是国风最常用的三种调式。' },
        { name: '戏曲化处理', description: '在旋律中加入戏曲的"拖腔"、"甩腔"，让歌曲更有中国韵味。' },
      ],
      example: '国风旋律常见动机：宫调式 12356 | 羽调式 61235 | 徵调式 56123。以级进为主，跳进为辅。',
    },
  },
];

// ==================== 广场舞曲库（扩展版） ====================

const EXTENDED_DANCE_MUSIC = [
  { id: 16, title: '好日子', artist: '宋祖英', tempo: '中快', bpm: 126, genre: '民歌', tags: ['喜庆', '节日', '热门'] },
  { id: 17, title: '春天的故事', artist: '董文华', tempo: '中速', bpm: 98, genre: '爱国', tags: ['经典', '抒情'] },
  { id: 18, title: '走进新时代', artist: '张也', tempo: '中速', bpm: 104, genre: '爱国', tags: ['经典', '豪迈'] },
  { id: 19, title: '美丽中国', artist: '群星', tempo: '中快', bpm: 118, genre: '爱国', tags: ['现代', '优美'] },
  { id: 20, title: '天路', artist: '韩红', tempo: '慢速', bpm: 72, genre: '民歌', tags: ['经典', '抒情'] },
  { id: 21, title: '青藏高原', artist: '李娜', tempo: '慢速', bpm: 68, genre: '民歌', tags: ['经典', '高音'] },
  { id: 22, title: '辣妹子', artist: '宋祖英', tempo: '中快', bpm: 130, genre: '民歌', tags: ['欢快', '热门'] },
  { id: 23, title: '草原上升起不落的太阳', artist: '吴雁泽', tempo: '慢速', bpm: 76, genre: '草原', tags: ['经典', '抒情'] },
  { id: 24, title: '美丽的草原我的家', artist: '德德玛', tempo: '慢速', bpm: 80, genre: '草原', tags: ['经典', '优美'] },
  { id: 25, title: '在那遥远的地方', artist: '王洛宾', tempo: '慢速', bpm: 74, genre: '民歌', tags: ['经典', '抒情'] },
  { id: 26, title: '浏阳河', artist: '李谷一', tempo: '中速', bpm: 96, genre: '民歌', tags: ['经典', '优美'] },
  { id: 27, title: '南泥湾', artist: '郭兰英', tempo: '中速', bpm: 100, genre: '民歌', tags: ['经典', '红歌'] },
  { id: 28, title: '映山红', artist: '邓玉华', tempo: '慢速', bpm: 72, genre: '民歌', tags: ['经典', '抒情'] },
  { id: 29, title: '山丹丹花开红艳艳', artist: '贠恩凤', tempo: '中快', bpm: 116, genre: '民歌', tags: ['经典', '高音'] },
  { id: 30, title: '爱我中华', artist: '宋祖英', tempo: '中快', bpm: 124, genre: '爱国', tags: ['经典', '欢快'] },
];

// ==================== 广场舞曲库 ====================

function getDanceSteps() {
  return { steps: DANCE_STEPS, total: DANCE_STEPS.length };
}

function getDanceStepById(id) {
  return DANCE_STEPS.find((s) => s.id === id) || null;
}

function getDanceStepsByCategory(category) {
  return DANCE_STEPS.filter((s) => s.category === category);
}

function getExtendedDanceMusic() {
  return { songs: EXTENDED_DANCE_MUSIC, total: EXTENDED_DANCE_MUSIC.length };
}

// ==================== 社区活动 ====================

async function getActivities({ communityId, category, status, page = 1, pageSize = 10 } = {}) {
  const conn = await pool.getConnection();
  try {
    let sql = 'SELECT * FROM activity WHERE deleted = 0';
    const params = [];

    if (communityId) {
      sql += ' AND community_id = ?';
      params.push(communityId);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY start_time DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);

    const [rows] = await conn.query(sql, params);
    const [[{ total }]] = await conn.query(
      'SELECT COUNT(*) as total FROM activity WHERE deleted = 0' +
      (communityId ? ' AND community_id = ?' : '') +
      (category ? ' AND category = ?' : '') +
      (status ? ' AND status = ?' : ''),
      params.slice(0, -2)
    );

    return { activities: rows, total, page, pageSize };
  } finally {
    conn.release();
  }
}

async function getActivityById(id) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT * FROM activity WHERE id = ? AND deleted = 0', [id]);
    return rows[0] || null;
  } finally {
    conn.release();
  }
}

async function createActivity(data) {
  const conn = await pool.getConnection();
  try {
    const { title, category, description, location, startTime, endTime, maxParticipants, coverUrl, organizerId, communityId, tags } = data;
    const [result] = await conn.query(
      `INSERT INTO activity (title, category, description, location, start_time, end_time, max_participants, cover_url, organizer_id, community_id, tags, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED')`,
      [title, category, description, location, startTime, endTime, maxParticipants || null, coverUrl || null, organizerId, communityId, JSON.stringify(tags || [])]
    );
    return { id: result.insertId, ...data };
  } finally {
    conn.release();
  }
}

async function registerActivity(activityId, userId, data) {
  const conn = await pool.getConnection();
  try {
    const { name, phone, elderId, remark } = data;

    // 检查活动是否存在且可报名
    const [activities] = await conn.query('SELECT * FROM activity WHERE id = ? AND deleted = 0', [activityId]);
    if (!activities[0]) return { success: false, message: '活动不存在' };
    if (activities[0].status !== 'PUBLISHED') return { success: false, message: '活动当前不可报名' };
    if (activities[0].max_participants && activities[0].current_participants >= activities[0].max_participants) {
      return { success: false, message: '报名人数已满' };
    }

    // 检查是否已报名
    const [existing] = await conn.query(
      'SELECT id FROM activity_registration WHERE activity_id = ? AND user_id = ? AND deleted = 0',
      [activityId, userId]
    );
    if (existing[0]) return { success: false, message: '您已报名该活动' };

    // 创建报名
    const [result] = await conn.query(
      `INSERT INTO activity_registration (activity_id, user_id, elder_id, name, phone, remark)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [activityId, userId, elderId || null, name, phone, remark || null]
    );

    // 更新参与人数
    await conn.query('UPDATE activity SET current_participants = current_participants + 1 WHERE id = ?', [activityId]);

    return { success: true, message: '报名成功', id: result.insertId };
  } finally {
    conn.release();
  }
}

async function cancelRegistration(activityId, userId) {
  const conn = await pool.getConnection();
  try {
    const [existing] = await conn.query(
      'SELECT id FROM activity_registration WHERE activity_id = ? AND user_id = ? AND status = ? AND deleted = 0',
      [activityId, userId, 'REGISTERED']
    );
    if (!existing[0]) return { success: false, message: '未找到报名记录' };

    await conn.query('UPDATE activity_registration SET status = ? WHERE id = ?', ['CANCELLED', existing[0].id]);
    await conn.query('UPDATE activity SET current_participants = GREATEST(current_participants - 1, 0) WHERE id = ?', [activityId]);

    return { success: true, message: '取消报名成功' };
  } finally {
    conn.release();
  }
}

function getActivityTemplates() {
  return { templates: ACTIVITY_TEMPLATES, total: ACTIVITY_TEMPLATES.length };
}

// ==================== 音乐创作知识库 ====================

function getMusicKnowledge({ category, difficulty } = {}) {
  let result = [...MUSIC_KNOWLEDGE];
  if (category) result = result.filter((k) => k.category === category);
  if (difficulty) result = result.filter((k) => k.difficulty === difficulty);
  return { items: result, total: result.length };
}

function getMusicKnowledgeById(id) {
  return MUSIC_KNOWLEDGE.find((k) => k.id === id) || null;
}

function getMusicCategories() {
  const categories = new Set(MUSIC_KNOWLEDGE.map((k) => k.category));
  return Array.from(categories).map((name) => ({
    name,
    label: { SCALE: '音阶调式', RHYTHM: '节奏型', HARMONY: '和声', INSTRUMENT: '民族乐器', MELODY: '旋律创作', THEORY: '编曲理论' }[name] || name,
    count: MUSIC_KNOWLEDGE.filter((k) => k.category === name).length,
  }));
}

// ==================== 用户创作 ====================

async function getUserCreations({ userId, type, page = 1, pageSize = 10 } = {}) {
  const conn = await pool.getConnection();
  try {
    let sql = 'SELECT * FROM user_creation WHERE deleted = 0';
    const params = [];

    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY likes DESC, gmt_create DESC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);

    const [rows] = await conn.query(sql, params);
    const countParams = params.slice(0, -2);
    const [[{ total }]] = await conn.query(
      'SELECT COUNT(*) as total FROM user_creation WHERE deleted = 0' +
      (userId ? ' AND user_id = ?' : '') +
      (type ? ' AND type = ?' : ''),
      countParams
    );

    return { creations: rows, total, page, pageSize };
  } finally {
    conn.release();
  }
}

async function createUserCreation(data) {
  const conn = await pool.getConnection();
  try {
    const { userId, type, title, content, description } = data;
    const [result] = await conn.query(
      'INSERT INTO user_creation (user_id, type, title, content, description) VALUES (?, ?, ?, ?, ?)',
      [userId, type, title, JSON.stringify(content), description || null]
    );
    return { id: result.insertId, ...data };
  } finally {
    conn.release();
  }
}

async function likeCreation(id) {
  const conn = await pool.getConnection();
  try {
    await conn.query('UPDATE user_creation SET likes = likes + 1 WHERE id = ?', [id]);
    return { success: true, message: '点赞成功' };
  } finally {
    conn.release();
  }
}

// ==================== 评论 ====================

async function getComments(targetType, targetId, page = 1, pageSize = 20) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT * FROM comment WHERE target_type = ? AND target_id = ? AND deleted = 0 AND parent_id IS NULL
       ORDER BY gmt_create DESC LIMIT ? OFFSET ?`,
      [targetType, targetId, pageSize, (page - 1) * pageSize]
    );
    const [[{ total }]] = await conn.query(
      'SELECT COUNT(*) as total FROM comment WHERE target_type = ? AND target_id = ? AND deleted = 0 AND parent_id IS NULL',
      [targetType, targetId]
    );

    // 获取每条评论的回复
    const comments = [];
    for (const row of rows) {
      const [replies] = await conn.query(
        'SELECT * FROM comment WHERE parent_id = ? AND deleted = 0 ORDER BY gmt_create ASC',
        [row.id]
      );
      comments.push({ ...row, replies: replies || [] });
    }

    return { comments, total, page, pageSize };
  } finally {
    conn.release();
  }
}

async function addComment(data) {
  const conn = await pool.getConnection();
  try {
    const { targetType, targetId, userId, userName, content, parentId } = data;
    const [result] = await conn.query(
      `INSERT INTO comment (target_type, target_id, user_id, user_name, content, parent_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [targetType, targetId, userId, userName || '匿名用户', content, parentId || null]
    );

    // 更新目标评论数
    if (targetType === 'CREATION') {
      await conn.query('UPDATE user_creation SET comments_count = comments_count + 1 WHERE id = ?', [targetId]);
    }

    return { id: result.insertId, ...data };
  } finally {
    conn.release();
  }
}

async function deleteComment(id) {
  const conn = await pool.getConnection();
  try {
    await conn.query('UPDATE comment SET deleted = 1 WHERE id = ?', [id]);
    return { success: true, message: '评论已删除' };
  } finally {
    conn.release();
  }
}

// ==================== 通用点赞 ====================

async function toggleLike(targetType, targetId, userId) {
  const conn = await pool.getConnection();
  try {
    const [existing] = await conn.query(
      'SELECT id FROM activity_like WHERE target_type = ? AND target_id = ? AND user_id = ?',
      [targetType, targetId, userId]
    );

    if (existing[0]) {
      // 已点赞，取消点赞
      await conn.query('DELETE FROM activity_like WHERE id = ?', [existing[0].id]);
      return { success: true, liked: false, message: '已取消点赞' };
    } else {
      // 未点赞，添加点赞
      await conn.query(
        'INSERT INTO activity_like (target_type, target_id, user_id) VALUES (?, ?, ?)',
        [targetType, targetId, userId]
      );
      return { success: true, liked: true, message: '点赞成功' };
    }
  } finally {
    conn.release();
  }
}

async function getLikeCount(targetType, targetId) {
  const conn = await pool.getConnection();
  try {
    const [[{ count }]] = await conn.query(
      'SELECT COUNT(*) as count FROM activity_like WHERE target_type = ? AND target_id = ?',
      [targetType, targetId]
    );
    return { count };
  } finally {
    conn.release();
  }
}

async function getUserLikeStatus(targetType, targetId, userId) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      'SELECT id FROM activity_like WHERE target_type = ? AND target_id = ? AND user_id = ?',
      [targetType, targetId, userId]
    );
    return { liked: rows.length > 0 };
  } finally {
    conn.release();
  }
}

module.exports = {
  // 广场舞步法
  getDanceSteps,
  getDanceStepById,
  getDanceStepsByCategory,
  getExtendedDanceMusic,
  // 社区活动
  getActivities,
  getActivityById,
  createActivity,
  registerActivity,
  cancelRegistration,
  getActivityTemplates,
  // 音乐创作知识库
  getMusicKnowledge,
  getMusicKnowledgeById,
  getMusicCategories,
  // 用户创作
  getUserCreations,
  createUserCreation,
  likeCreation,
  // 评论
  getComments,
  addComment,
  deleteComment,
  // 通用点赞
  toggleLike,
  getLikeCount,
  getUserLikeStatus,
  // 常量
  DANCE_STEPS,
  MUSIC_KNOWLEDGE,
  EXTENDED_DANCE_MUSIC,
  ACTIVITY_TEMPLATES,
};