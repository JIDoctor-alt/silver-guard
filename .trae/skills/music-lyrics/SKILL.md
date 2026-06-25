---
name: "music-lyrics"
description: "AI 音乐作词技能，为老年人创作广场舞、民歌、怀旧金曲风格的歌词。当用户需要创作歌词、写歌、生成歌词、音乐作词时调用。支持健康养生、岁月情怀、社区生活、家国情怀等主题，LLM 生成失败时自动降级为模板。"
---

# 音乐作词 Skill

为乐龄守护项目中的老年人用户创作歌词，支持 AI 大模型生成和模板兜底两种模式。

## 调用方式

当用户提出以下需求时，应调用此 skill：
- "帮我写一首歌词"
- "创作一首关于XX的歌"
- "生成广场舞歌词"
- "作词"
- 任何与歌词创作相关的请求

## 支持的接口

### 后端 API

项目已实现完整的作词链路：

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取分类 | GET | `/api/music/categories` | 获取可用主题、风格、体裁 |
| AI 作词 | POST | `/api/music/lyrics` | 生成歌词，Body: `{ theme, genre }` |
| 获取作品 | GET | `/api/music/my-works` | 获取已保存的作品列表 |
| 保存作品 | POST | `/api/music/save` | 保存歌词作品 |

### 核心服务

代码位置：`server/src/services/aiService.js`

```javascript
// 作词统一入口，自动选择 LLM 或模板
const lyrics = await aiService.composeLyrics({ theme, genre });
// 返回: { title, theme, genre, content, lineCount, description, generatedBy }
```

## 可用主题（theme）

| 主题 ID | 名称 | 说明 |
|---------|------|------|
| 健康养生 | 健康养生 | 饮食、运动、作息等健康主题 |
| 岁月情怀 | 岁月情怀 | 怀旧、青春回忆、夕阳红 |
| 社区生活 | 社区生活 | 邻里关系、社区活动、广场舞 |
| 家国情怀 | 家国情怀 | 爱国、家乡、传统节日 |

## 可用体裁（genre）

| 体裁 | 说明 |
|------|------|
| 民歌 | 传统民歌风格，朗朗上口 |
| 流行 | 现代流行风格 |
| 民族风 | 民族特色，如草原风 |
| 古典 | 古风诗词风格 |

## 生成流程

```
用户输入(主题 + 体裁)
  → 检查 LLM 是否可用（config.LLM_API_KEY）
  → 有 API Key → 调用 LLM 生成（OpenAI 兼容接口）
    → 发送 system prompt + user prompt
    → 解析 JSON 返回 { title, content, ... }
  → 无 API Key → 使用内置模板兜底
    → 从 LYRIC_TEMPLATES 中按主题随机选取
  → 返回歌词结果
```

## 提示词模板

LLM 生成时使用的提示词可通过环境变量 `LLM_LYRICS_SYSTEM_PROMPT` 和 `LLM_LYRICS_USER_PROMPT` 自定义，也可在系统配置页面「提示词配置」tab 中修改。

默认提示词要点：
1. 歌词主题积极向上，适合 50-80 岁中老年人
2. 语言通俗易懂，每句 7-10 个字，押韵工整
3. 结构：主歌(A) + 副歌(B) + 主歌(A) + 副歌(B)，共 16-20 句
4. 避免网络流行语、英文、生僻字
5. 适合广场舞配乐

## 模板兜底词库

当 LLM 不可用时，系统内置了以下模板：

| 主题 | 模板歌曲 |
|------|---------|
| 健康养生 | 《晨练歌》《养生谣》 |
| 岁月情怀 | 《夕阳红》《青春回忆》 |
| 社区生活 | 《邻里情》《快乐广场》 |
| 家国情怀 | 《祖国颂》《家乡美》 |

## 使用示例

### 通过 API 调用

```bash
curl -X POST http://localhost:8090/api/music/lyrics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"theme": "健康养生", "genre": "民歌"}'
```

### 响应示例

```json
{
  "code": 0,
  "message": "作词成功",
  "data": {
    "title": "晨练歌",
    "theme": "健康养生",
    "genre": "民歌",
    "content": "清晨太阳升起来，走出家门运动来\n伸伸胳膊踢踢腿，身体健康乐开怀\n...",
    "lineCount": 16,
    "description": "这是一首以"健康养生"为主题的民歌风格歌词，共16句。",
    "generatedBy": "LLM"
  }
}
```

### 前端页面

前端音乐创作页面位于：`silver-guard-admin/src/pages/MusicCreation/index.tsx`
路由：`/music-creation`