import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Select,
  Button,
  message,
  Spin,
  Row,
  Col,
  Modal,
  Form,
  Tabs,
  InputNumber,
  DatePicker,
  Typography,
  Descriptions,
  List,
  Space,
  Empty,
  Divider,
} from 'antd';
import {
  ExperimentOutlined,
  EnvironmentOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { Elder } from '../../api';
import { getElderList } from '../../api';
import {
  getConstitutionAssessments,
  addConstitutionAssessment,
  getSolarTermHealth,
  getSolarTermList,
  type ConstitutionAssessment,
  type SolarTermHealth,
} from '../../api/knowledge';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const constitutionTypes = [
  { name: '平和质', color: 'green', description: '阴阳气血调和，体态适中，面色润泽' },
  { name: '气虚质', color: 'blue', description: '元气不足，疲乏、气短、自汗等气虚表现' },
  { name: '阳虚质', color: 'cyan', description: '阳气不足，以畏寒怕冷、手足不温等虚寒表现' },
  { name: '阴虚质', color: 'orange', description: '阴液亏少，以口燥咽干、手足心热等虚热表现' },
  { name: '痰湿质', color: 'lime', description: '痰湿凝聚，以形体肥胖、腹部肥满、口黏苔腻' },
  { name: '湿热质', color: 'gold', description: '湿热内蕴，以面垢油光、口苦、苔黄腻等' },
  { name: '血瘀质', color: 'red', description: '血行不畅，以肤色晦暗、舌质紫暗等血瘀表现' },
  { name: '气郁质', color: 'purple', description: '气机郁滞，以神情抑郁、忧虑脆弱等' },
  { name: '特禀质', color: 'magenta', description: '先天失常，以生理缺陷、过敏反应等' },
];

export default function ConstitutionPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('assessment');
  const [elders, setElders] = useState<Elder[]>([]);
  const [assessments, setAssessments] = useState<ConstitutionAssessment[]>([]);
  const [selectedElderId, setSelectedElderId] = useState<number | undefined>(undefined);
  const [assessModalOpen, setAssessModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assessForm] = Form.useForm();

  const [currentTerm, setCurrentTerm] = useState<SolarTermHealth | null>(null);
  const [terms, setTerms] = useState<SolarTermHealth[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<SolarTermHealth | null>(null);
  const [termModalOpen, setTermModalOpen] = useState(false);

  useEffect(() => {
    const fetchElders = async () => {
      try {
        const res = await getElderList({ size: 200 });
        if (res.code === 200) setElders(res.data.records);
      } catch {
        message.error('加载老人列表失败');
      }
    };
    fetchElders();
  }, []);

  useEffect(() => {
    if (!selectedElderId) {
      setAssessments([]);
      return;
    }
    const fetchAssessments = async () => {
      setLoading(true);
      try {
        const res = await getConstitutionAssessments(selectedElderId);
        if (res.code === 200) {
          setAssessments(res.data as unknown as ConstitutionAssessment[]);
        }
      } catch {
        message.error('加载体质评估记录失败');
      } finally {
        setLoading(false);
      }
    };
    fetchAssessments();
  }, [selectedElderId]);

  useEffect(() => {
    const fetchSolarTerms = async () => {
      try {
        const [currentRes, listRes] = await Promise.all([
          getSolarTermHealth(),
          getSolarTermList(),
        ]);
        if (currentRes.code === 200) setCurrentTerm(currentRes.data as SolarTermHealth);
        if (listRes.code === 200) setTerms(listRes.data as unknown as SolarTermHealth[]);
      } catch {
        message.error('加载节气数据失败');
      }
    };
    if (activeTab === 'solar') {
      fetchSolarTerms();
    }
  }, [activeTab]);

  const handleStartAssess = () => {
    if (!selectedElderId) {
      message.warning('请先选择老人');
      return;
    }
    assessForm.resetFields();
    setAssessModalOpen(true);
  };

  const handleSubmitAssess = async () => {
    try {
      const values = await assessForm.validateFields();
      setSubmitting(true);
      const res = await addConstitutionAssessment({
        elderId: selectedElderId!,
        assessDate: values.assessDate.format('YYYY-MM-DD'),
        constitution: values.constitution,
        score: values.score,
        features: values.features,
        recommendations: values.recommendations,
      });
      if (res.code === 200) {
        message.success('评估提交成功');
        setAssessModalOpen(false);
        const listRes = await getConstitutionAssessments(selectedElderId!);
        if (listRes.code === 200) {
          setAssessments(listRes.data as unknown as ConstitutionAssessment[]);
        }
      }
    } catch {
      // validation error
    } finally {
      setSubmitting(false);
    }
  };

  const handleTermClick = (term: SolarTermHealth) => {
    setSelectedTerm(term);
    setTermModalOpen(true);
  };

  const assessmentColumns = [
    {
      title: '评估日期',
      dataIndex: 'assess_date',
      width: 110,
      render: (d: string) => dayjs(d).format('YYYY-MM-DD'),
    },
    {
      title: '体质类型',
      dataIndex: 'constitution',
      width: 100,
      render: (v: string) => {
        const ct = constitutionTypes.find((c) => c.name === v);
        return <Tag color={ct?.color || 'default'}>{v}</Tag>;
      },
    },
    { title: '评分', dataIndex: 'score', width: 70 },
    {
      title: '特征',
      dataIndex: 'features',
      render: (f: string[]) =>
        f?.map((item) => <Tag key={item}>{item}</Tag>),
    },
    {
      title: '建议',
      dataIndex: 'recommendations',
      render: (r: string[]) =>
        r?.map((item) => <Tag key={item} color="blue">{item}</Tag>),
    },
    { title: '评估人', dataIndex: 'assessed_by', width: 100, render: (v: string | null) => v || '系统' },
  ];

  const tabItems = [
    {
      key: 'assessment',
      label: (
        <span>
          <ExperimentOutlined /> 体质评估
        </span>
      ),
      children: (
        <div>
          <Space style={{ marginBottom: 16 }} wrap>
            <Select
              placeholder="选择老人"
              style={{ width: 200 }}
              showSearch
              allowClear
              filterOption={(input, option) =>
                (option?.label as string)?.includes(input) ?? false
              }
              value={selectedElderId}
              onChange={(val) => setSelectedElderId(val)}
              options={elders.map((e) => ({
                value: e.id,
                label: `${e.name} (${e.age}岁)`,
              }))}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!selectedElderId}
              onClick={handleStartAssess}
            >
              开始评估
            </Button>
          </Space>

          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            {constitutionTypes.map((ct) => (
              <Col span={8} key={ct.name}>
                <Card size="small" hoverable>
                  <Tag color={ct.color} style={{ marginBottom: 8 }}>
                    {ct.name}
                  </Tag>
                  <Paragraph
                    type="secondary"
                    style={{ fontSize: 12, marginBottom: 0 }}
                    ellipsis={{ rows: 2 }}
                  >
                    {ct.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>

          <Spin spinning={loading}>
            {selectedElderId ? (
              <Table
                dataSource={assessments}
                columns={assessmentColumns}
                rowKey="id"
                pagination={{ pageSize: 10, showSizeChanger: false }}
                size="small"
                scroll={{ x: 700 }}
              />
            ) : (
              <Empty description="请选择老人查看评估记录" style={{ padding: 40 }} />
            )}
          </Spin>

          <Modal
            title="中医体质评估"
            open={assessModalOpen}
            onCancel={() => setAssessModalOpen(false)}
            onOk={handleSubmitAssess}
            confirmLoading={submitting}
            okText="提交评估"
            cancelText="取消"
            destroyOnClose
            width={600}
          >
            <Form form={assessForm} layout="vertical" style={{ marginTop: 16 }}>
              <Form.Item
                name="assessDate"
                label="评估日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name="constitution"
                label="体质类型"
                rules={[{ required: true, message: '请选择体质类型' }]}
              >
                <Select
                  placeholder="选择体质类型"
                  options={constitutionTypes.map((ct) => ({
                    value: ct.name,
                    label: ct.name,
                  }))}
                />
              </Form.Item>
              <Form.Item
                name="score"
                label="评估分数"
                rules={[{ required: true, message: '请输入分数' }]}
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100" />
              </Form.Item>
              <Form.Item name="features" label="体质特征">
                <Select
                  mode="tags"
                  placeholder="输入特征后回车添加"
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item name="recommendations" label="调理建议">
                <Select
                  mode="tags"
                  placeholder="输入建议后回车添加"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Form>
          </Modal>
        </div>
      ),
    },
    {
      key: 'solar',
      label: (
        <span>
          <EnvironmentOutlined /> 节气养生
        </span>
      ),
      children: (
        <div>
          {currentTerm && (
            <Card
              title={
                <Space>
                  <EnvironmentOutlined />
                  <span>当前节气：{currentTerm.term_name}</span>
                  <Tag color="blue">{currentTerm.season}</Tag>
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="概述">
                  {currentTerm.summary}
                </Descriptions.Item>
                <Descriptions.Item label="饮食建议">
                  {currentTerm.diet?.join('、')}
                </Descriptions.Item>
                <Descriptions.Item label="运动建议">
                  {currentTerm.exercise?.join('、')}
                </Descriptions.Item>
                <Descriptions.Item label="穴位保健">
                  {currentTerm.acupoints?.join('、')}
                </Descriptions.Item>
                <Descriptions.Item label="生活起居">
                  {currentTerm.lifestyle}
                </Descriptions.Item>
                <Descriptions.Item label="推荐食谱">
                  {currentTerm.recipes?.join('、')}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          <Title level={5}>二十四节气养生</Title>
          <Row gutter={[12, 12]}>
            {terms.map((term) => (
              <Col span={6} key={term.id}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => handleTermClick(term)}
                  style={{
                    cursor: 'pointer',
                    borderColor:
                      currentTerm?.term_name === term.term_name
                        ? '#1890ff'
                        : undefined,
                  }}
                >
                  <Space direction="vertical" size={2}>
                    <Text strong>{term.term_name}</Text>
                    <Tag color="blue" style={{ fontSize: 11 }}>
                      {term.season}
                    </Tag>
                    <Paragraph
                      type="secondary"
                      style={{ fontSize: 11, marginBottom: 0 }}
                      ellipsis={{ rows: 2 }}
                    >
                      {term.summary}
                    </Paragraph>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          <Modal
            title={
              <Space>
                <EnvironmentOutlined />
                <span>{selectedTerm?.term_name}</span>
                <Tag color="blue">{selectedTerm?.season}</Tag>
              </Space>
            }
            open={termModalOpen}
            onCancel={() => setTermModalOpen(false)}
            footer={null}
            width={680}
          >
            {selectedTerm && (
              <div>
                <Paragraph style={{ marginTop: 16 }}>{selectedTerm.summary}</Paragraph>
                <Divider orientation="left">饮食建议</Divider>
                <List
                  size="small"
                  dataSource={selectedTerm.diet}
                  renderItem={(item) => <List.Item>{item}</List.Item>}
                />
                <Divider orientation="left">运动建议</Divider>
                <List
                  size="small"
                  dataSource={selectedTerm.exercise}
                  renderItem={(item) => <List.Item>{item}</List.Item>}
                />
                <Divider orientation="left">穴位保健</Divider>
                <List
                  size="small"
                  dataSource={selectedTerm.acupoints}
                  renderItem={(item) => <List.Item>{item}</List.Item>}
                />
                <Divider orientation="left">生活起居</Divider>
                <Paragraph>{selectedTerm.lifestyle}</Paragraph>
                <Divider orientation="left">推荐食谱</Divider>
                <List
                  size="small"
                  dataSource={selectedTerm.recipes}
                  renderItem={(item) => <List.Item>{item}</List.Item>}
                />
              </div>
            )}
          </Modal>
        </div>
      ),
    },
  ];

  return (
    <Card title="中医体质辨识">
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        items={tabItems}
      />
    </Card>
  );
}