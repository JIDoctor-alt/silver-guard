// ============================================================
// 乐龄守护 · 系统配置路由
// ============================================================
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { ok, fail } = require('../middleware/response');
const configService = require('../services/systemConfigService');
const appConfig = require('../config');

const router = express.Router();

// GET /api/system-config/list — 获取所有配置列表（可按分类过滤）
router.get('/list', requireAuth, async (req, res) => {
  try {
    const { category } = req.query;
    const configs = await configService.getAllConfigs(category || null);
    return ok(res, { configs, total: configs.length });
  } catch (err) {
    console.error('查询系统配置列表失败:', err);
    return fail(res, 500, '查询失败');
  }
});

// GET /api/system-config/map — 获取配置键值对映射（可按分类过滤）
router.get('/map', requireAuth, async (req, res) => {
  try {
    const { category } = req.query;
    const map = await configService.getConfigMap(category || null);
    return ok(res, map);
  } catch (err) {
    console.error('查询系统配置映射失败:', err);
    return fail(res, 500, '查询失败');
  }
});

// PUT /api/system-config/:key — 更新配置值
router.put('/:key', requireAuth, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined || value === null) {
      return fail(res, 400, 'value 不能为空');
    }

    const config = await configService.getConfigByKey(key);
    if (!config) {
      return fail(res, 404, '配置项不存在');
    }

    if (!config.isEditable) {
      return fail(res, 403, '该配置项不可编辑');
    }

    const affectedRows = await configService.updateConfig(key, String(value));
    if (affectedRows === 0) {
      return fail(res, 500, '更新失败');
    }

    // 配置更新后立即重载到内存
    await appConfig.reloadFromDb();

    return ok(res, null, '更新成功');
  } catch (err) {
    console.error('更新系统配置失败:', err);
    return fail(res, 500, '更新失败');
  }
});

// POST /api/system-config/test-llm — 测试大模型连接
router.post('/test-llm', requireAuth, async (req, res) => {
  try {
    const { apiKey, apiUrl, model } = req.body;

    const key = apiKey || appConfig.LLM_API_KEY;
    const url = apiUrl || appConfig.LLM_API_URL;
    const modelName = model || appConfig.LLM_MODEL;

    if (!key) {
      return fail(res, 400, '请先配置 API Key');
    }
    if (!url) {
      return fail(res, 400, '请先配置 API 地址');
    }

    const endpoint = `${url}/chat/completions`;
    const startedAt = Date.now();

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'user', content: 'Hello, respond with just "OK" in Chinese.' },
        ],
        max_tokens: 10,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const latency = Date.now() - startedAt;

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      let errMsg = `HTTP ${response.status}`;
      if (response.status === 401) errMsg = 'API Key 无效（401 Unauthorized）';
      else if (response.status === 403) errMsg = '无权限访问（403 Forbidden）';
      else if (response.status === 404) errMsg = 'API 地址不存在（404 Not Found）';
      else if (response.status === 429) errMsg = '请求过于频繁，请稍后重试（429）';
      else errMsg = `HTTP ${response.status}: ${errText.slice(0, 100)}`;
      return fail(res, 400, `连接失败：${errMsg}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';

    return ok(res, {
      success: true,
      model: modelName,
      latency,
      reply,
      message: `连接成功！模型 ${modelName} 响应正常，延迟 ${latency}ms`,
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return fail(res, 400, '连接超时（15秒），请检查 API 地址是否正确');
    }
    console.error('测试 LLM 连接失败:', err);
    return fail(res, 500, `连接失败：${err.message}`);
  }
});

// POST /api/system-config/list-models — 获取可用模型列表
router.post('/list-models', requireAuth, async (req, res) => {
  try {
    const { apiKey, apiUrl } = req.body;

    const key = apiKey || appConfig.LLM_API_KEY;
    const url = apiUrl || appConfig.LLM_API_URL;

    if (!key) {
      return fail(res, 400, '请先配置 API Key');
    }
    if (!url) {
      return fail(res, 400, '请先配置 API 地址');
    }

    const endpoint = `${url}/models`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      let errMsg = `HTTP ${response.status}`;
      if (response.status === 401) errMsg = 'API Key 无效（401 Unauthorized）';
      else if (response.status === 403) errMsg = '无权限访问（403 Forbidden）';
      else if (response.status === 404) errMsg = 'API 地址不支持 /models 接口（404 Not Found）';
      else errMsg = `HTTP ${response.status}: ${errText.slice(0, 100)}`;
      return fail(res, 400, `获取模型列表失败：${errMsg}`);
    }

    const data = await response.json();
    const models = (data.data || []).map((m) => ({
      id: m.id,
      ownedBy: m.owned_by || '',
    }));

    return ok(res, { models, total: models.length });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return fail(res, 400, '请求超时（10秒），请检查 API 地址是否正确');
    }
    console.error('获取模型列表失败:', err);
    return fail(res, 500, `获取模型列表失败：${err.message}`);
  }
});

module.exports = router;