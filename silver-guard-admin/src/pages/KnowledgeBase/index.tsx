import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Tag,
  Select,
  message,
  Spin,
  Row,
  Col,
  Tabs,
  Typography,
  Space,
  Badge,
  Empty,
  Divider,
  Modal,
  Button,
  Form,
  Input,
  Upload,
  Popconfirm,
} from 'antd';
import {
  SafetyCertificateOutlined,
  FileProtectOutlined,
  WarningOutlined,
  SafetyOutlined,
  ReadOutlined,
  BookOutlined,
  PlusOutlined,
  CloudUploadOutlined,
  FileTextOutlined,
  InboxOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  getAntiFraudKnowledge,
  getPolicyKnowledge,
  addAntiFraudKnowledge,
  addPolicyKnowledge,
  type AntiFraudKnowledge,
  type PolicyKnowledge,
} from '../../api/knowledge';
import {
  ragKnowledge,
  ragAddKnowledge,
  ragUserKnowledge,
  ragDeleteKnowledge,
  type RAGKnowledgeItem,
} from '../../api/ai';

const { Paragraph, Text } = Typography;

const antiFraudCategories = [
  { value: 'ALL', label: '全部' },
  { value: 'PHONE', label: '电话诈骗' },
  { value: 'NETWORK', label: '网络诈骗' },
  { value: 'DOOR', label: '上门诈骗' },
  { value: 'HEALTH', label: '保健品诈骗' },
  { value: 'INVESTMENT', label: '投资诈骗' },
];

const policyCategories = [
  { value: 'ALL', label: '全部' },
  { value: 'PENSION', label: '养老保险' },
  { value: 'MEDICAL', label: '医疗保险' },
  { value: 'SUBSIDY', label: '补贴政策' },
  { value: 'CARE', label: '养老服务' },
  { value: 'HOUSING', label: '住房保障' },
];

const literarySubCategories = [
  { value: 'ALL', label: '全部' },
  { value: '格律', label: '诗词格律' },
  { value: '押韵', label: '押韵技法' },
  { value: '意象', label: '诗词意象' },
  { value: '作词', label: '作词结构' },
  { value: '名句', label: '经典名句' },
  { value: '四季', label: '四季素材' },
  { value: '主题', label: '创作主题' },
];

const riskLevelConfig: Record<string, { color: string; text: string }> = {
  HIGH: { color: 'red', text: '高风险' },
  MEDIUM: { color: 'orange', text: '中风险' },
  LOW: { color: 'green', text: '低风险' },
};

export default function KnowledgeBasePage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('antiFraud');
  const [antiFraudList, setAntiFraudList] = useState<AntiFraudKnowledge[]>([]);
  const [policyList, setPolicyList] = useState<PolicyKnowledge[]>([]);
  const [fraudCategory, setFraudCategory] = useState('ALL');
  const [policyCategory, setPolicyCategory] = useState('ALL');
  const [selectedFraud, setSelectedFraud] = useState<AntiFraudKnowledge | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyKnowledge | null>(null);
  const [fraudModalOpen, setFraudModalOpen] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [addFraudModalOpen, setAddFraudModalOpen] = useState(false);
  const [addPolicyModalOpen, setAddPolicyModalOpen] = useState(false);
  const [addFraudLoading, setAddFraudLoading] = useState(false);
  const [addPolicyLoading, setAddPolicyLoading] = useState(false);
  const [addFraudForm] = Form.useForm();
  const [addPolicyForm] = Form.useForm();
  const [literaryList, setLiteraryList] = useState<RAGKnowledgeItem[]>([]);
  const [literaryLoading, setLiteraryLoading] = useState(false);
  const [literaryFilter, setLiteraryFilter] = useState('ALL');
  const [selectedLiterary, setSelectedLiterary] = useState<RAGKnowledgeItem | null>(null);
  const [literaryModalOpen, setLiteraryModalOpen] = useState(false);

  // RAG 自定义知识库相关
  const [userKnowledgeList, setUserKnowledgeList] = useState<RAGKnowledgeItem[]>([]);
  const [userKnowledgeLoading, setUserKnowledgeLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadForm] = Form.useForm();
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileContentRef = useRef<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getAntiFraudKnowledge(
          fraudCategory === 'ALL' ? undefined : fraudCategory,
        );
        if (res.code === 200) {
          setAntiFraudList(res.data as unknown as AntiFraudKnowledge[]);
        }
      } catch {
        message.error('加载反诈知识失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fraudCategory]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getPolicyKnowledge(
          policyCategory === 'ALL' ? undefined : policyCategory,
        );
        if (res.code === 200) {
          setPolicyList(res.data as unknown as PolicyKnowledge[]);
        }
      } catch {
        message.error('加载政策知识失败');
      } finally {
        setLoading(false);
      }
    };
    if (activeTab === 'policy') {
      fetchData();
    }
  }, [policyCategory, activeTab]);

  useEffect(() => {
    const fetchLiterary = async () => {
      setLiteraryLoading(true);
      try {
        const res = await ragKnowledge();
        if (res.code === 0) {
          const items = (res.data as { items: RAGKnowledgeItem[] }).items || [];
          // 筛选文学经典分类
          const literary = items.filter((item) => item.category === '文学经典');
          setLiteraryList(literary);
        }
      } catch {
        message.error('加载文学经典失败');
      } finally {
        setLiteraryLoading(false);
      }
    };
    if (activeTab === 'literary') {
      fetchLiterary();
    }
  }, [activeTab]);

  const handleAddFraud = async () => {
    try {
      const values = await addFraudForm.validateFields();
      setAddFraudLoading(true);
      const res = await addAntiFraudKnowledge({
        ...values,
        warning_signs: values.warning_signs || [],
      });
      if (res.code === 200) {
        message.success('添加成功');
        setAddFraudModalOpen(false);
        addFraudForm.resetFields();
        const refreshRes = await getAntiFraudKnowledge(
          fraudCategory === 'ALL' ? undefined : fraudCategory,
        );
        if (refreshRes.code === 200) {
          setAntiFraudList(refreshRes.data as unknown as AntiFraudKnowledge[]);
        }
      } else {
        message.error(res.message || '添加失败');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        // 表单验证错误，不提示
      } else {
        message.error('添加失败');
      }
    } finally {
      setAddFraudLoading(false);
    }
  };

  const handleAddPolicy = async () => {
    try {
      const values = await addPolicyForm.validateFields();
      setAddPolicyLoading(true);
      const keywords = values.keywords
        ? values.keywords.split('\n').filter((k: string) => k.trim())
        : [];
      const res = await addPolicyKnowledge({
        ...values,
        keywords: keywords,
      });
      if (res.code === 200) {
        message.success('添加成功');
        setAddPolicyModalOpen(false);
        addPolicyForm.resetFields();
        const refreshRes = await getPolicyKnowledge(
          policyCategory === 'ALL' ? undefined : policyCategory,
        );
        if (refreshRes.code === 200) {
          setPolicyList(refreshRes.data as unknown as PolicyKnowledge[]);
        }
      } else {
        message.error(res.message || '添加失败');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        // 表单验证错误，不提示
      } else {
        message.error('添加失败');
      }
    } finally {
      setAddPolicyLoading(false);
    }
  };

  // ==================== RAG 自定义知识库 ====================

  const fetchUserKnowledge = async () => {
    setUserKnowledgeLoading(true);
    try {
      const res = await ragUserKnowledge();
      if (res.code === 0) {
        setUserKnowledgeList(
          (res.data as { items: RAGKnowledgeItem[]; total: number }).items || [],
        );
      }
    } catch {
      message.error('加载自定义知识库失败');
    } finally {
      setUserKnowledgeLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'custom') {
      fetchUserKnowledge();
    }
  }, [activeTab]);

  const handleFileRead = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') resolve(text);
        else reject(new Error('文件读取失败'));
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      // txt 和 md 等纯文本使用 utf-8
      reader.readAsText(file, 'utf-8');
    });
  };

  const beforeUpload = async (file: File) => {
    // 检查文件大小（限制 5MB）
    if (file.size > 5 * 1024 * 1024) {
      message.error('文件大小不能超过 5MB');
      return Upload.LIST_IGNORE;
    }
    // 检查文件类型
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['txt', 'md', 'json'].includes(ext || '')) {
      message.error('仅支持 .txt、.md、.json 文件');
      return Upload.LIST_IGNORE;
    }
    try {
      const text = await handleFileRead(file);
      fileContentRef.current = text;
      setUploadedFileName(file.name);
      // 自动用文件名（去掉后缀）作为标题
      const titleFromFile = file.name.replace(/\.[^.]+$/, '');
      uploadForm.setFieldValue('title', uploadForm.getFieldValue('title') || titleFromFile);
      message.success(`已读取文件：${file.name}（${(file.size / 1024).toFixed(1)} KB）`);
    } catch (e) {
      message.error('文件读取失败');
    }
    return false; // 阻止自动上传
  };

  const handleUploadSubmit = async () => {
    try {
      const values = await uploadForm.validateFields();
      const content = values.content || fileContentRef.current;
      if (!content || !content.trim()) {
        message.error('请输入内容或上传文件');
        return;
      }
      setUploadLoading(true);
      const keywords = values.keywords
        ? values.keywords.split(/[,,，\s\n]+/).filter((k: string) => k.trim())
        : [];
      const res = await ragAddKnowledge({
        title: values.title,
        content,
        category: values.category || '自定义知识',
        keywords,
        source: uploadedFileName ? `file:${uploadedFileName}` : 'manual',
      });
      if (res.code === 0) {
        message.success(`添加成功！当前知识库共 ${res.data.totalKnowledge} 条`);
        setUploadModalOpen(false);
        uploadForm.resetFields();
        setUploadedFileName('');
        fileContentRef.current = '';
        fetchUserKnowledge();
      } else {
        message.error(res.message || '添加失败');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        // 表单验证错误
      } else {
        message.error('添加失败');
      }
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteUserKnowledge = async (id: number) => {
    try {
      const res = await ragDeleteKnowledge(id);
      if (res.code === 0) {
        message.success('删除成功');
        fetchUserKnowledge();
      } else {
        message.error(res.message || '删除失败');
      }
    } catch {
      message.error('删除失败');
    }
  };

  const tabItems = [
    {
      key: 'antiFraud',
      label: (
        <span>
          <SafetyCertificateOutlined /> 反诈防骗
        </span>
      ),
      children: (
        <div>
          <Space style={{ marginBottom: 16 }}>
            <Text strong>分类筛选：</Text>
            <Select
              value={fraudCategory}
              onChange={(val) => setFraudCategory(val)}
              style={{ width: 140 }}
              options={antiFraudCategories}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddFraudModalOpen(true)}
            >
              添加反诈知识
            </Button>
          </Space>
          <Spin spinning={loading}>
            {antiFraudList.length === 0 ? (
              <Empty description="暂无数据" style={{ padding: 40 }} />
            ) : (
              <Row gutter={[16, 16]}>
                {antiFraudList.map((item) => {
                  const risk = riskLevelConfig[item.risk_level] || {
                    color: 'default',
                    text: item.risk_level,
                  };
                  return (
                    <Col span={8} key={item.id}>
                      <Card
                        hoverable
                        size="small"
                        onClick={() => {
                          setSelectedFraud(item);
                          setFraudModalOpen(true);
                        }}
                        title={
                          <Space>
                            <Badge color={risk.color} />
                            <Text strong ellipsis style={{ maxWidth: 180 }}>
                              {item.title}
                            </Text>
                          </Space>
                        }
                        extra={
                          <Tag color={risk.color}>{risk.text}</Tag>
                        }
                        style={{ height: '100%' }}
                      >
                        <Paragraph
                          type="secondary"
                          ellipsis={{ rows: 3 }}
                          style={{ fontSize: 13, marginBottom: 8 }}
                        >
                          {item.description}
                        </Paragraph>
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <WarningOutlined /> 警示信号：
                          </Text>
                          {item.warning_signs?.slice(0, 3).map((s) => (
                            <Tag key={s} color="orange" style={{ fontSize: 11, marginTop: 4 }}>
                              {s}
                            </Tag>
                          ))}
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Spin>

          <Modal
            title={
              <Space>
                <SafetyCertificateOutlined />
                <span>{selectedFraud?.title}</span>
                {selectedFraud && (
                  <Tag
                    color={
                      riskLevelConfig[selectedFraud.risk_level]?.color || 'default'
                    }
                  >
                    {riskLevelConfig[selectedFraud.risk_level]?.text ||
                      selectedFraud.risk_level}
                  </Tag>
                )}
              </Space>
            }
            open={fraudModalOpen}
            onCancel={() => setFraudModalOpen(false)}
            footer={null}
            width={640}
          >
            {selectedFraud && (
              <div style={{ marginTop: 16 }}>
                <Paragraph>{selectedFraud.description}</Paragraph>
                <Divider orientation="left">
                  <WarningOutlined /> 警示信号
                </Divider>
                {selectedFraud.warning_signs?.map((s, i) => (
                  <Tag color="orange" key={i} style={{ marginBottom: 8, fontSize: 13 }}>
                    {s}
                  </Tag>
                ))}
                <Divider orientation="left">
                  <SafetyOutlined /> 防范措施
                </Divider>
                <Paragraph>{selectedFraud.prevention}</Paragraph>
              </div>
            )}
          </Modal>
        </div>
      ),
    },
    {
      key: 'policy',
      label: (
        <span>
          <FileProtectOutlined /> 养老政策
        </span>
      ),
      children: (
        <div>
          <Space style={{ marginBottom: 16 }}>
            <Text strong>分类筛选：</Text>
            <Select
              value={policyCategory}
              onChange={(val) => setPolicyCategory(val)}
              style={{ width: 140 }}
              options={policyCategories}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddPolicyModalOpen(true)}
            >
              添加政策知识
            </Button>
          </Space>
          <Spin spinning={loading}>
            {policyList.length === 0 ? (
              <Empty description="暂无数据" style={{ padding: 40 }} />
            ) : (
              <Row gutter={[16, 16]}>
                {policyList.map((item) => (
                  <Col span={8} key={item.id}>
                    <Card
                      hoverable
                      size="small"
                      onClick={() => {
                        setSelectedPolicy(item);
                        setPolicyModalOpen(true);
                      }}
                      title={
                        <Text strong ellipsis style={{ maxWidth: 200 }}>
                          {item.title}
                        </Text>
                      }
                      extra={
                        item.applicable_region ? (
                          <Tag color="blue">{item.applicable_region}</Tag>
                        ) : null
                      }
                      style={{ height: '100%' }}
                    >
                      <Paragraph
                        type="secondary"
                        ellipsis={{ rows: 3 }}
                        style={{ fontSize: 13, marginBottom: 8 }}
                      >
                        {item.summary}
                      </Paragraph>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          关键词：
                        </Text>
                        {item.keywords?.slice(0, 4).map((k) => (
                          <Tag key={k} style={{ fontSize: 11, marginTop: 4 }}>
                            {k}
                          </Tag>
                        ))}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Spin>

          <Modal
            title={
              <Space>
                <FileProtectOutlined />
                <span>{selectedPolicy?.title}</span>
              </Space>
            }
            open={policyModalOpen}
            onCancel={() => setPolicyModalOpen(false)}
            footer={null}
            width={680}
          >
            {selectedPolicy && (
              <div style={{ marginTop: 16 }}>
                <Paragraph>{selectedPolicy.summary}</Paragraph>
                {selectedPolicy.detail && (
                  <>
                    <Divider orientation="left">
                      <ReadOutlined /> 政策详情
                    </Divider>
                    <Paragraph>{selectedPolicy.detail}</Paragraph>
                  </>
                )}
                <Divider orientation="left">基本信息</Divider>
                <Space wrap>
                  {selectedPolicy.applicable_region && (
                    <Tag color="blue">适用地区：{selectedPolicy.applicable_region}</Tag>
                  )}
                  {selectedPolicy.effective_date && (
                    <Tag color="green">
                      生效日期：{selectedPolicy.effective_date}
                    </Tag>
                  )}
                  {selectedPolicy.keywords?.map((k) => (
                    <Tag key={k}>{k}</Tag>
                  ))}
                </Space>
              </div>
            )}
          </Modal>
        </div>
      ),
    },
    {
      key: 'literary',
      label: (
        <span>
          <BookOutlined /> 文学经典
        </span>
      ),
      children: (
        <div>
          <Space style={{ marginBottom: 16 }}>
            <Text strong>分类筛选：</Text>
            <Select
              value={literaryFilter}
              onChange={(val) => setLiteraryFilter(val)}
              style={{ width: 140 }}
              options={literarySubCategories}
            />
          </Space>
          <Spin spinning={literaryLoading}>
            {literaryList.length === 0 ? (
              <Empty description="暂无文学经典数据" style={{ padding: 40 }} />
            ) : (
              <Row gutter={[16, 16]}>
                {(literaryFilter === 'ALL'
                  ? literaryList
                  : literaryList.filter(
                      (item) =>
                        item.title.includes(literaryFilter) ||
                        item.keywords?.some((k) => k.includes(literaryFilter)),
                    )
                ).map((item) => (
                  <Col span={8} key={item.id}>
                    <Card
                      hoverable
                      size="small"
                      onClick={() => {
                        setSelectedLiterary(item);
                        setLiteraryModalOpen(true);
                      }}
                      title={
                        <Text strong ellipsis style={{ maxWidth: 200 }}>
                          {item.title}
                        </Text>
                      }
                      style={{ height: '100%' }}
                    >
                      <Paragraph
                        type="secondary"
                        ellipsis={{ rows: 3 }}
                        style={{ fontSize: 13, marginBottom: 8 }}
                      >
                        {item.content}
                      </Paragraph>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          关键词：
                        </Text>
                        {item.keywords?.slice(0, 4).map((k) => (
                          <Tag key={k} style={{ fontSize: 11, marginTop: 4 }}>
                            {k}
                          </Tag>
                        ))}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Spin>

          <Modal
            title={
              <Space>
                <BookOutlined />
                <span>{selectedLiterary?.title}</span>
              </Space>
            }
            open={literaryModalOpen}
            onCancel={() => setLiteraryModalOpen(false)}
            footer={null}
            width={680}
          >
            {selectedLiterary && (
              <div style={{ marginTop: 16 }}>
                <Divider orientation="left">
                  <ReadOutlined /> 内容
                </Divider>
                <Paragraph style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                  {selectedLiterary.content}
                </Paragraph>
                <Divider orientation="left">关键词</Divider>
                <Space wrap>
                  {selectedLiterary.keywords?.map((k) => (
                    <Tag key={k} color="purple">
                      {k}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
          </Modal>
        </div>
      ),
    },
    {
      key: 'custom',
      label: (
        <span>
          <CloudUploadOutlined /> 自定义知识
        </span>
      ),
      children: (
        <div>
          <Space style={{ marginBottom: 16 }}>
            <Text strong>自定义知识库：</Text>
            <Text type="secondary">支持上传 .txt / .md / .json 文件或直接输入内容</Text>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={() => setUploadModalOpen(true)}
            >
              上传文件 / 添加条目
            </Button>
            <Button onClick={fetchUserKnowledge}>刷新</Button>
          </Space>
          <Spin spinning={userKnowledgeLoading}>
            {userKnowledgeList.length === 0 ? (
              <Empty
                description={
                  <div>
                    <p>暂无自定义知识</p>
                    <Text type="secondary">点击「上传文件」按钮添加您的第一条知识</Text>
                  </div>
                }
                style={{ padding: 40 }}
              >
                <Button
                  type="primary"
                  icon={<CloudUploadOutlined />}
                  onClick={() => setUploadModalOpen(true)}
                >
                  立即添加
                </Button>
              </Empty>
            ) : (
              <Row gutter={[16, 16]}>
                {userKnowledgeList.map((item) => (
                  <Col span={8} key={item.id}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <FileTextOutlined style={{ color: '#1890ff' }} />
                          <Text strong ellipsis style={{ maxWidth: 200 }}>
                            {item.title}
                          </Text>
                        </Space>
                      }
                      extra={
                        <Space>
                          <Tag color="cyan">{item.category}</Tag>
                          <Popconfirm
                            title="确定删除该知识条目？"
                            onConfirm={() => handleDeleteUserKnowledge(item.id)}
                            okText="删除"
                            cancelText="取消"
                          >
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                            />
                          </Popconfirm>
                        </Space>
                      }
                      style={{ height: '100%' }}
                    >
                      <Paragraph
                        type="secondary"
                        ellipsis={{ rows: 3 }}
                        style={{ fontSize: 13, marginBottom: 8 }}
                      >
                        {item.content}
                      </Paragraph>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          关键词：
                        </Text>
                        {item.keywords?.slice(0, 4).map((k) => (
                          <Tag key={k} color="blue" style={{ fontSize: 11, marginTop: 4 }}>
                            {k}
                          </Tag>
                        ))}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Spin>
        </div>
      ),
    },
  ];

  return (
    <Card title="知识库">
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        items={tabItems}
      />

      {/* 添加反诈知识 Modal */}
      <Modal
        title={<Space><SafetyCertificateOutlined /><span>添加反诈知识</span></Space>}
        open={addFraudModalOpen}
        onCancel={() => { setAddFraudModalOpen(false); addFraudForm.resetFields(); }}
        onOk={handleAddFraud}
        confirmLoading={addFraudLoading}
        width={600}
      >
        <Form form={addFraudForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入反诈知识标题" />
          </Form.Item>
          <Form.Item name="category" label="分类" initialValue="NETWORK">
            <Select options={antiFraudCategories.filter(c => c.value !== 'ALL')} />
          </Form.Item>
          <Form.Item name="description" label="案例描述" rules={[{ required: true, message: '请输入案例描述' }]}>
            <Input.TextArea rows={3} placeholder="请输入案例描述" />
          </Form.Item>
          <Form.Item name="warning_signs" label="警示信号">
            <Input.TextArea rows={2} placeholder="每行一个警示信号" />
          </Form.Item>
          <Form.Item name="prevention" label="防范措施">
            <Input.TextArea rows={2} placeholder="请输入防范措施" />
          </Form.Item>
          <Form.Item name="risk_level" label="风险等级" initialValue="MEDIUM">
            <Select options={[
              { value: 'LOW', label: '低风险' },
              { value: 'MEDIUM', label: '中风险' },
              { value: 'HIGH', label: '高风险' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加政策知识 Modal */}
      <Modal
        title={<Space><FileProtectOutlined /><span>添加政策知识</span></Space>}
        open={addPolicyModalOpen}
        onCancel={() => { setAddPolicyModalOpen(false); addPolicyForm.resetFields(); }}
        onOk={handleAddPolicy}
        confirmLoading={addPolicyLoading}
        width={600}
      >
        <Form form={addPolicyForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="政策标题" rules={[{ required: true, message: '请输入政策标题' }]}>
            <Input placeholder="请输入政策标题" />
          </Form.Item>
          <Form.Item name="category" label="政策类型" initialValue="PENSION">
            <Select options={policyCategories.filter(c => c.value !== 'ALL')} />
          </Form.Item>
          <Form.Item name="summary" label="政策摘要" rules={[{ required: true, message: '请输入政策摘要' }]}>
            <Input.TextArea rows={3} placeholder="请输入政策摘要" />
          </Form.Item>
          <Form.Item name="detail" label="详细内容">
            <Input.TextArea rows={4} placeholder="请输入详细内容（可选）" />
          </Form.Item>
          <Form.Item name="applicable_region" label="适用地区">
            <Input placeholder="请输入适用地区（可选）" />
          </Form.Item>
          <Form.Item name="effective_date" label="生效日期">
            <Input placeholder="请输入生效日期，格式如 2024-01-01（可选）" />
          </Form.Item>
          <Form.Item name="keywords" label="关键词">
            <Input.TextArea rows={2} placeholder="每行一个关键词（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 上传文件 / 添加自定义知识 Modal */}
      <Modal
        title={
          <Space>
            <CloudUploadOutlined />
            <span>上传文件 / 添加知识条目</span>
          </Space>
        }
        open={uploadModalOpen}
        onCancel={() => {
          setUploadModalOpen(false);
          uploadForm.resetFields();
          setUploadedFileName('');
          fileContentRef.current = '';
        }}
        onOk={handleUploadSubmit}
        confirmLoading={uploadLoading}
        width={680}
        okText="添加"
      >
        <Form form={uploadForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="上传文件">
            <Upload.Dragger
              name="file"
              multiple={false}
              beforeUpload={beforeUpload}
              showUploadList={false}
              accept=".txt,.md,.json"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint" style={{ fontSize: 12 }}>
                支持 .txt / .md / .json 格式，单文件不超过 5MB
                {uploadedFileName && (
                  <Text type="success" style={{ marginLeft: 8 }}>
                    ✓ 已选择：{uploadedFileName}
                  </Text>
                )}
              </p>
            </Upload.Dragger>
          </Form.Item>

          <Divider plain style={{ margin: '12px 0' }}>或者直接输入</Divider>

          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入知识标题' }]}
          >
            <Input placeholder="请输入知识标题，如：冬季养生要点" />
          </Form.Item>

          <Form.Item name="category" label="分类" initialValue="自定义知识">
            <Input placeholder="如：健康知识 / 政策法规 / 本地服务" />
          </Form.Item>

          <Form.Item
            name="content"
            label="内容"
            extra="如已上传文件，可留空（使用文件内容）；也可直接输入或修改文件内容"
          >
            <Input.TextArea
              rows={6}
              placeholder="请输入知识内容..."
            />
          </Form.Item>

          <Form.Item name="keywords" label="关键词" extra="用逗号、空格或换行分隔，留空将自动从内容中提取">
            <Input placeholder="如：冬季, 养生, 保暖" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}