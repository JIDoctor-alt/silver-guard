import { useState, useEffect } from 'react';
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
  Checkbox,
} from 'antd';
import {
  SafetyCertificateOutlined,
  FileProtectOutlined,
  WarningOutlined,
  SafetyOutlined,
  ReadOutlined,
  BookOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  getAntiFraudKnowledge,
  getPolicyKnowledge,
  addAntiFraudKnowledge,
  addPolicyKnowledge,
  type AntiFraudKnowledge,
  type PolicyKnowledge,
} from '../../api/knowledge';
import { ragKnowledge, type RAGKnowledgeItem } from '../../api/ai';

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
    </Card>
  );
}