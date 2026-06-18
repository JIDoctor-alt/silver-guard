// ============================================================
// 乐龄守护 · RAG 智能问答服务
// 基于 LangChain + OpenAI + Redis 向量检索
// 支持：文档问答、老人护理知识、巡检规范查询、实时对话
// ============================================================
const { OpenAIEmbeddings } = require('@langchain/openai');
const { OpenAI } = require('openai');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { RedisVectorStore } = require('@langchain/community/vectorstores/redis');
const { ChatOpenAI } = require('@langchain/openai');
const { createStuffDocumentsChain } = require('langchain/chains/combine_documents');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { createRetrievalChain } = require('langchain/chains/retrieval');
const { Document } = require('langchain/document');
const { v4: uuidv4 } = require('uuid');
const redisClient = require('../db/redis');

const config = require('../config');

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
  baseURL: config.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

let vectorStore = null;
let retrievalChain = null;

const DEFAULT_KNOWLEDGE_BASE = [
  {
    title: '社区养老服务规范',
    content: `社区养老服务规范
1. 服务对象：60岁以上独居老人、空巢老人、困难老人
2. 服务内容：
   - 定期上门探访（每周至少1次）
   - 健康监测（血压、心率、睡眠）
   - 生活照料（代购、打扫、做饭）
   - 心理慰藉（陪伴聊天、情感支持）
3. 服务流程：
   - 建档评估 → 制定计划 → 上门服务 → 回访跟踪
4. 紧急响应：
   - 24小时热线：400-123-4567
   - 紧急事件5分钟内响应
   - 老人跌倒后10分钟内到达现场`,
  },
  {
    title: '智能设备使用指南',
    content: `智能设备使用指南
1. 毫米波雷达：
   - 安装位置：卧室天花板中央
   - 功能：监测人体存在、呼吸、跌倒检测
   - 预警条件：30分钟无活动、跌倒姿态
2. SOS呼叫器：
   - 佩戴方式：挂绳佩戴在胸前
   - 使用方法：红色按钮长按3秒
   - 响应时间：5分钟内网格员联系
3. 智能手环：
   - 功能：心率监测、定位、紧急呼叫
   - 充电时间：2小时可充至80%
4. 红外传感器：
   - 安装位置：门口、卫生间
   - 功能：监测出入情况
   - 异常预警：夜间频繁出入`,
  },
  {
    title: '老人健康护理知识',
    content: `老人健康护理知识
1. 饮食护理：
   - 低盐低脂饮食，每日盐摄入量<5g
   - 多吃蔬菜水果，补充维生素
   - 少量多餐，避免过饱
2. 运动护理：
   - 每日适当运动（散步、太极拳）
   - 运动时间：上午9-10点，下午3-4点
   - 避免剧烈运动，防止跌倒
3. 用药护理：
   - 按时服药，不擅自增减药量
   - 药品分类存放，定期检查有效期
   - 特殊药品需家属或网格员监督
4. 安全护理：
   - 家中保持干燥，防止滑倒
   - 夜间开灯，避免磕碰
   - 定期检查家中安全隐患`,
  },
  {
    title: '巡检工作流程',
    content: `巡检工作流程
1. 准备阶段：
   - 查看今日巡检清单
   - 检查设备电量
   - 准备巡检记录表
2. 巡检阶段：
   - 按路线顺序走访
   - 敲门问候老人
   - 检查设备运行状态
   - 记录老人健康状况
   - 处理发现的问题
3. 收尾阶段：
   - 填写巡检报告
   - 上传照片和记录
   - 提交待办事项
   - 整理明日计划`,
  },
  {
    title: '预警事件处理规范',
    content: `预警事件处理规范
1. 预警等级：
   - L1(一般)：设备离线、轻微异常
   - L2(关注)：跌倒预警、健康指标异常
   - L3(紧急)：长时间无活动、SOS呼叫
   - L4(严重)：长时间失联、生命体征异常
2. 处理时限：
   - L1：24小时内处理
   - L2：2小时内处理
   - L3：15分钟内响应，30分钟内到达
   - L4：5分钟内响应，10分钟内到达
3. 处理流程：
   - 接收预警 → 确认信息 → 分派处理 → 现场核实 → 反馈结果 → 归档记录`,
  },
];

async function initVectorStore() {
  try {
    if (!config.OPENAI_API_KEY) {
      console.warn('[RAG] 未配置 OPENAI_API_KEY，使用模拟模式');
      return;
    }

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.OPENAI_API_KEY,
      baseURL: config.OPENAI_BASE_URL,
      model: config.EMBEDDING_MODEL || 'text-embedding-3-small',
    });

    const redisUrl = `redis://${config.REDIS_HOST || 'localhost'}:${config.REDIS_PORT || 6379}`;

    vectorStore = await RedisVectorStore.fromExistingIndex(embeddings, {
      redisUrl,
      indexName: 'leling-guardian-rag',
    });

    console.log('[RAG] 向量存储初始化完成');
  } catch (error) {
    console.error('[RAG] 向量存储初始化失败:', error.message);
  }
}

async function loadKnowledgeBase() {
  if (!config.OPENAI_API_KEY || !vectorStore) return;

  try {
    const docs = DEFAULT_KNOWLEDGE_BASE.map((item, index) => {
      return new Document({
        pageContent: item.content,
        metadata: {
          id: `kb_${index}`,
          title: item.title,
          source: 'knowledge_base',
        },
      });
    });

    await vectorStore.addDocuments(docs);
    console.log('[RAG] 知识库加载完成，共', docs.length, '条文档');
  } catch (error) {
    console.error('[RAG] 知识库加载失败:', error.message);
  }
}

async function buildRetrievalChain() {
  if (!config.OPENAI_API_KEY) return;

  try {
    const llm = new ChatOpenAI({
      openAIApiKey: config.OPENAI_API_KEY,
      baseURL: config.OPENAI_BASE_URL,
      model: config.CHAT_MODEL || 'gpt-4o-mini',
      temperature: 0.3,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `你是乐龄守护智能助手，专业的社区养老服务顾问。
请根据提供的知识库内容回答问题，回答要简洁明了，符合老人和网格员的需求。

知识库：
{context}

如果问题不在知识库范围内，请礼貌告知用户无法回答。`],
      ['human', '{input}'],
    ]);

    const documentChain = await createStuffDocumentsChain({ llm, prompt });

    retrievalChain = await createRetrievalChain({
      retriever: vectorStore.asRetriever({ k: 3 }),
      combineDocsChain: documentChain,
    });

    console.log('[RAG] 检索链构建完成');
  } catch (error) {
    console.error('[RAG] 检索链构建失败:', error.message);
  }
}

async function queryRAG(query) {
  if (!retrievalChain) {
    return getMockResponse(query);
  }

  try {
    const result = await retrievalChain.invoke({ input: query });
    return {
      answer: result.answer,
      sources: result.context.map(doc => doc.metadata.title),
      isMock: false,
    };
  } catch (error) {
    console.error('[RAG] 查询失败:', error.message);
    return getMockResponse(query);
  }
}

function getMockResponse(query) {
  const keywords = {
    '养老': '社区养老服务包括定期探访、健康监测、生活照料和心理慰藉等内容。',
    '设备': '智能设备包括毫米波雷达、SOS呼叫器、智能手环和红外传感器。',
    '跌倒': '老人跌倒后，系统会立即发出预警，网格员会在10分钟内到达现场。',
    '巡检': '巡检流程包括准备阶段、巡检阶段和收尾阶段，每日至少走访一次。',
    '预警': '预警分为四个等级：L1一般、L2关注、L3紧急、L4严重，处理时限各不相同。',
    '健康': '老人健康护理包括饮食、运动、用药和安全四个方面。',
    'SOS': 'SOS呼叫器红色按钮长按3秒即可触发紧急呼叫，5分钟内网格员会联系。',
    '社区': '社区养老服务对象为60岁以上独居老人、空巢老人和困难老人。',
  };

  for (const [keyword, response] of Object.entries(keywords)) {
    if (query.includes(keyword)) {
      return {
        answer: response,
        sources: ['知识库'],
        isMock: true,
      };
    }
  }

  return {
    answer: '抱歉，我暂时无法回答这个问题。请联系社区网格员获取帮助。',
    sources: [],
    isMock: true,
  };
}

async function streamChat(query, onChunk) {
  if (!config.OPENAI_API_KEY) {
    const mockResponse = getMockResponse(query);
    const chunks = mockResponse.answer.split('');
    for (const char of chunks) {
      await new Promise(resolve => setTimeout(resolve, 50));
      onChunk(char);
    }
    return {
      answer: mockResponse.answer,
      sources: mockResponse.sources,
      isMock: true,
    };
  }

  try {
    const ragResult = await queryRAG(query);

    const stream = await openai.chat.completions.create({
      model: config.CHAT_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '你是乐龄守护智能助手，专业的社区养老服务顾问。请用简洁温暖的语言回答问题。',
        },
        {
          role: 'user',
          content: `基于以下知识回答问题：\n${ragResult.sources.join('\n')}\n\n问题：${query}`,
        },
      ],
      stream: true,
      temperature: 0.3,
    });

    let fullAnswer = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullAnswer += content;
      if (content) {
        onChunk(content);
      }
    }

    return {
      answer: fullAnswer,
      sources: ragResult.sources,
      isMock: false,
    };
  } catch (error) {
    console.error('[RAG] 流式对话失败:', error.message);
    const mockResponse = getMockResponse(query);
    const chunks = mockResponse.answer.split('');
    for (const char of chunks) {
      await new Promise(resolve => setTimeout(resolve, 50));
      onChunk(char);
    }
    return {
      answer: mockResponse.answer,
      sources: mockResponse.sources,
      isMock: true,
    };
  }
}

async function addDocument(title, content) {
  if (!vectorStore) return { success: false, message: '向量存储未初始化' };

  try {
    const doc = new Document({
      pageContent: content,
      metadata: {
        id: uuidv4(),
        title,
        source: 'user_upload',
      },
    });

    await vectorStore.addDocuments([doc]);
    return { success: true, message: '文档添加成功' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function searchDocuments(query, limit = 5) {
  if (!vectorStore) {
    return DEFAULT_KNOWLEDGE_BASE.slice(0, limit).map(item => ({
      title: item.title,
      snippet: item.content.substring(0, 100) + '...',
      isMock: true,
    }));
  }

  try {
    const results = await vectorStore.similaritySearch(query, limit);
    return results.map(doc => ({
      title: doc.metadata.title,
      snippet: doc.pageContent.substring(0, 100) + '...',
      isMock: false,
    }));
  } catch (error) {
    return DEFAULT_KNOWLEDGE_BASE.slice(0, limit).map(item => ({
      title: item.title,
      snippet: item.content.substring(0, 100) + '...',
      isMock: true,
    }));
  }
}

async function init() {
  if (!config.OPENAI_API_KEY) {
    console.warn('[RAG] OPENAI_API_KEY 未配置，将使用模拟模式');
    return;
  }

  await initVectorStore();
  await loadKnowledgeBase();
  await buildRetrievalChain();
}

module.exports = {
  init,
  queryRAG,
  streamChat,
  addDocument,
  searchDocuments,
};
