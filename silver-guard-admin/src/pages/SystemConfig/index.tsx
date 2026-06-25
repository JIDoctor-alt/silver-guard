import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  message,
  Spin,
  Typography,
  Space,
  Tag,
  Alert,
  Tooltip,
  Row,
  Col,
  Badge,
  Divider,
  Modal,
  Descriptions,
} from 'antd';
import {
  ApiOutlined,
  EditOutlined,
  EnvironmentOutlined,
  SaveOutlined,
  KeyOutlined,
  LinkOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import {
  getConfigList,
  updateConfig,
  testLLMConnection,
  type SystemConfig,
  type LLMTestResult,
} from '../../api/systemConfig';

const { Text, Title } = Typography;

// ==================== 常量 ====================

const DEFAULT_VALUES: Record<string, string> = {
  LLM_API_KEY: '',
  LLM_API_URL: 'https://api.deepseek.com',
  LLM_MODEL: 'deepseek-v4-pro',
};

// 根据 configKey 获取对应图标
function getConfigIcon(key: string) {
  if (key.includes('API_KEY') || key.includes('SECURITY_KEY') || key.includes('SECRET')) {
    return <KeyOutlined />;
  }
  if (key.includes('URL') || key.includes('ENDPOINT')) {
    return <LinkOutlined />;
  }
  if (key.includes('MODEL')) {
    return <RobotOutlined />;
  }
  return <EditOutlined />;
}

// 判断是否需要密码输入框
function isSecretField(configKey: string): boolean {
  const upper = configKey.toUpperCase();
  return upper.includes('KEY') || upper.includes('SECRET') || upper.includes('PASSWORD') || upper.includes('TOKEN');
}

// 判断是否需要多行文本
function isMultiline(config: SystemConfig): boolean {
  return (
    config.configType === 'TEXTAREA' ||
    (config.configValue && config.configValue.length > 120)
  );
}

// ==================== 连接状态类型 ====================
type ConnectionStatus = 'untested' | 'testing' | 'success' | 'failed';

export default function SystemConfigPage() {
  // ---- 数据状态 ----
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('llm');
  const [saveAllLoading, setSaveAllLoading] = useState(false);

  // ---- 连接测试状态 ----
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('untested');
  const [testResult, setTestResult] = useState<LLMTestResult | null>(null);
  const [testError, setTestError] = useState<string>('');
  const [testDetailOpen, setTestDetailOpen] = useState(false);

  // ======================== 加载配置 ========================
  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getConfigList();
      const list: SystemConfig[] = (res as any).data?.configs ?? (res as any).data ?? res ?? [];
      setConfigs(list);
      const values: Record<string, string> = {};
      list.forEach((c: SystemConfig) => {
        values[c.configKey] = c.configValue ?? '';
      });
      setEditingValues(values);
    } catch {
      message.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  // ======================== 值变更 ========================
  const handleValueChange = (key: string, value: string) => {
    setEditingValues((prev) => ({ ...prev, [key]: value }));
    // 修改 LLM 配置后重置连接状态
    if (key.startsWith('LLM_')) {
      setConnectionStatus('untested');
      setTestResult(null);
      setTestError('');
    }
  };

  // ======================== 保存单个配置 ========================
  const handleSave = async (configKey: string) => {
    setSavingKeys((prev) => new Set(prev).add(configKey));
    try {
      await updateConfig(configKey, editingValues[configKey] ?? '');
      message.success('保存成功');
      setConfigs((prev) =>
        prev.map((c) =>
          c.configKey === configKey ? { ...c, configValue: editingValues[configKey] } : c,
        ),
      );
    } catch {
      message.error('保存失败');
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev);
        next.delete(configKey);
        return next;
      });
    }
  };

  // ======================== 一键保存全部 LLM 配置 ========================
  const handleSaveAllLLM = async () => {
    setSaveAllLoading(true);
    const llmKeys = llmConfigs.filter((c) => c.isEditable === 1).map((c) => c.configKey);
    let successCount = 0;
    let failCount = 0;

    try {
      await Promise.all(
        llmKeys.map(async (key) => {
          try {
            await updateConfig(key, editingValues[key] ?? '');
            successCount++;
          } catch {
            failCount++;
          }
        }),
      );

      if (failCount === 0) {
        message.success(`全部保存成功（${successCount} 项）`);
      } else {
        message.warning(`保存完成：成功 ${successCount} 项，失败 ${failCount} 项`);
      }

      await loadConfigs();
      setConnectionStatus('untested');
      setTestResult(null);
    } catch {
      message.error('批量保存失败');
    } finally {
      setSaveAllLoading(false);
    }
  };

  // ======================== 重置为默认值 ========================
  const handleResetDefaults = () => {
    Modal.confirm({
      title: '重置为默认值',
      icon: <ExclamationCircleOutlined />,
      content: '将大模型连接配置恢复为默认值（DeepSeek），当前修改将丢失。确定要重置吗？',
      okText: '确定重置',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => {
        setEditingValues((prev) => ({
          ...prev,
          LLM_API_KEY: DEFAULT_VALUES.LLM_API_KEY,
          LLM_API_URL: DEFAULT_VALUES.LLM_API_URL,
          LLM_MODEL: DEFAULT_VALUES.LLM_MODEL,
        }));
        setConnectionStatus('untested');
        setTestResult(null);
        setTestError('');
        message.info('已重置为默认值，请点击「一键保存」使其生效');
      },
    });
  };

  // ======================== 测试连接 ========================
  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setTestError('');
    setTestResult(null);

    try {
      const res = await testLLMConnection({
        apiKey: editingValues.LLM_API_KEY,
        apiUrl: editingValues.LLM_API_URL,
        model: editingValues.LLM_MODEL,
      });
      const result: LLMTestResult = (res as any).data ?? res;
      setTestResult(result);
      setConnectionStatus('success');
      message.success(result.message || '连接成功');
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || '连接测试失败';
      setTestError(errMsg);
      setConnectionStatus('failed');
      message.error(errMsg);
    }
  };

  // ======================== 分类筛选 ========================
  const llmConfigs = configs.filter((c) => c.category === 'LLM');
  const promptConfigs = configs.filter((c) => c.category === 'PROMPT');
  const amapConfigs = configs.filter((c) => c.category === 'AMAP');

  // ======================== 连接状态徽标 ========================
  const connectionBadge = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Badge status="processing" text="测试中..." />;
      case 'success':
        return (
          <Badge
            status="success"
            text={
              <span>
                已连接（{testResult?.latency}ms）
                <Button
                  type="link"
                  size="small"
                  icon={<ThunderboltOutlined />}
                  onClick={() => setTestDetailOpen(true)}
                  style={{ padding: '0 4px' }}
                >
                  详情
                </Button>
              </span>
            }
          />
        );
      case 'failed':
        return (
          <Tooltip title={testError}>
            <Badge status="error" text="连接失败" />
          </Tooltip>
        );
      default:
        return <Badge status="default" text="未测试" />;
    }
  };

  // ======================== 渲染单个配置项 ========================
  const renderConfigItem = (config: SystemConfig) => {
    const isSaving = savingKeys.has(config.configKey);
    const multiline = isMultiline(config);
    const secret = isSecretField(config.configKey);

    return (
      <div key={config.configKey} style={{ marginBottom: 20 }}>
        <Form.Item
          label={
            <Tooltip title={config.description}>
              <Space size={4}>
                {getConfigIcon(config.configKey)}
                <span>{config.configName}</span>
                <Tag color="blue" style={{ fontSize: 11, lineHeight: '18px' }}>
                  {config.configKey}
                </Tag>
              </Space>
            </Tooltip>
          }
          extra={
            config.description ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {config.description}
              </Text>
            ) : undefined
          }
        >
          <Space.Compact style={{ width: '100%' }}>
            {multiline ? (
              <Input.TextArea
                value={editingValues[config.configKey] ?? ''}
                onChange={(e) => handleValueChange(config.configKey, e.target.value)}
                rows={5}
                autoSize={{ minRows: 3, maxRows: 15 }}
                placeholder={`请输入${config.configName}`}
                disabled={config.isEditable === 0}
              />
            ) : secret ? (
              <Input.Password
                value={editingValues[config.configKey] ?? ''}
                onChange={(e) => handleValueChange(config.configKey, e.target.value)}
                placeholder={`请输入${config.configName}`}
                disabled={config.isEditable === 0}
              />
            ) : (
              <Input
                value={editingValues[config.configKey] ?? ''}
                onChange={(e) => handleValueChange(config.configKey, e.target.value)}
                placeholder={`请输入${config.configName}`}
                disabled={config.isEditable === 0}
              />
            )}
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={isSaving}
              onClick={() => handleSave(config.configKey)}
              disabled={config.isEditable === 0}
            >
              保存
            </Button>
          </Space.Compact>
        </Form.Item>
      </div>
    );
  };

  // ======================== LLM 连接卡片 ========================
  const renderLLMCard = () => {
    const llmEditable = llmConfigs.filter((c) => c.isEditable === 1);

    return (
      <div>
        <Alert
          message="配置大模型 API 连接参数，用于 AI 对话、音乐生成、知识问答等功能。模型名称填写如 deepseek-v4-pro"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {llmConfigs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Text type="secondary">暂无大模型连接配置</Text>
          </div>
        ) : (
          <>
            {/* 连接状态栏 */}
            <Card size="small" style={{ marginBottom: 24, background: '#fafafa' }}>
              <Row align="middle" justify="space-between">
                <Col>
                  <Space size="middle">
                    <Text strong>连接状态：</Text>
                    {connectionBadge()}
                  </Space>
                </Col>
                <Col>
                  <Space>
                    <Button
                      type="primary"
                      icon={<ThunderboltOutlined />}
                      onClick={handleTestConnection}
                      loading={connectionStatus === 'testing'}
                    >
                      测试连接
                    </Button>
                    <Button icon={<UndoOutlined />} onClick={handleResetDefaults}>
                      重置默认
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* 表单区域：全部使用 Input 输入框 */}
            <Form layout="vertical">
              {llmConfigs.map((config) => renderConfigItem(config))}
            </Form>

            {/* 一键保存 */}
            <Divider />
            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button
                  type="primary"
                  size="large"
                  icon={<SaveOutlined />}
                  onClick={handleSaveAllLLM}
                  loading={saveAllLoading}
                  disabled={llmEditable.length === 0}
                >
                  一键保存全部配置
                </Button>
              </Space>
            </div>
          </>
        )}

        {/* 测试详情弹窗 */}
        <Modal
          title="连接测试详情"
          open={testDetailOpen}
          onCancel={() => setTestDetailOpen(false)}
          footer={null}
          width={480}
        >
          {testResult ? (
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="状态">
                <Tag color="success" icon={<CheckCircleOutlined />}>
                  连接成功
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="模型">{testResult.model}</Descriptions.Item>
              <Descriptions.Item label="延迟">{testResult.latency}ms</Descriptions.Item>
              <Descriptions.Item label="测试回复">
                {testResult.reply || '（无内容）'}
              </Descriptions.Item>
            </Descriptions>
          ) : testError ? (
            <Alert
              type="error"
              message="连接失败"
              description={testError}
              showIcon
              icon={<CloseCircleOutlined />}
            />
          ) : null}
        </Modal>
      </div>
    );
  };

  // ======================== 提示词卡片 ========================
  const renderPromptCard = (config: SystemConfig) => {
    const isSaving = savingKeys.has(config.configKey);

    return (
      <Card
        key={config.configKey}
        size="small"
        style={{ marginBottom: 12 }}
        title={
          <Space size={4}>
            <EditOutlined />
            <span>{config.configName}</span>
            <Tag color="purple" style={{ fontSize: 11, lineHeight: '18px' }}>
              {config.configKey}
            </Tag>
          </Space>
        }
        extra={
          <Button
            type="link"
            size="small"
            icon={<SaveOutlined />}
            loading={isSaving}
            onClick={() => handleSave(config.configKey)}
            disabled={config.isEditable === 0}
          >
            保存
          </Button>
        }
      >
        {config.description && (
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
            {config.description}
          </Text>
        )}
        <Input.TextArea
          value={editingValues[config.configKey] ?? ''}
          onChange={(e) => handleValueChange(config.configKey, e.target.value)}
          rows={8}
          autoSize={{ minRows: 4, maxRows: 20 }}
          placeholder={`请输入${config.configName}`}
          disabled={config.isEditable === 0}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
      </Card>
    );
  };

  // ======================== Tab 配置 ========================
  const tabItems = [
    {
      key: 'llm',
      label: (
        <span>
          <ApiOutlined /> 大模型连接
        </span>
      ),
      children: renderLLMCard(),
    },
    {
      key: 'prompt',
      label: (
        <span>
          <EditOutlined /> 提示词配置
        </span>
      ),
      children: (
        <div>
          <Alert
            message="配置 AI 提示词模板，用于控制大模型的行为和输出风格。支持 {{placeholder}} 变量替换。"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          {promptConfigs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Text type="secondary">暂无提示词配置</Text>
            </div>
          ) : (
            <div>{promptConfigs.map((config) => renderPromptCard(config))}</div>
          )}
        </div>
      ),
    },
    {
      key: 'amap',
      label: (
        <span>
          <EnvironmentOutlined /> 高德地图
        </span>
      ),
      children: (
        <div>
          <Alert
            message="配置高德地图 API 密钥，用于天气查询、周边搜索、路径规划等功能"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          {amapConfigs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Text type="secondary">暂无高德地图配置</Text>
            </div>
          ) : (
            <Form layout="vertical">
              {amapConfigs.map((config) => renderConfigItem(config))}
            </Form>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card
        style={{ marginBottom: 16 }}
        title={
          <Space>
            <RobotOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>
              大模型配置
            </Title>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            style={{ minHeight: 300 }}
          />
        </Spin>
      </Card>
    </div>
  );
}