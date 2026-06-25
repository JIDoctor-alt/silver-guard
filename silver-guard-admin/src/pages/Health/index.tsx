import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Select,
  Button,
  message,
  Spin,
  Statistic,
  Row,
  Col,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Space,
  Empty,
} from 'antd';
import { PlusOutlined, HeartOutlined } from '@ant-design/icons';
import type { Elder } from '../../api';
import { getElderList } from '../../api';
import {
  getHealthRecords,
  getHealthTrend,
  getHealthSummary,
  addHealthRecord,
  type HealthRecord,
  type HealthTrend,
  type HealthSummary,
} from '../../api/health';
import dayjs from 'dayjs';

const moodOptions = ['开心', '平静', '焦虑', '低落', '烦躁'];
const moodColors: Record<string, string> = {
  开心: 'green',
  平静: 'blue',
  焦虑: 'orange',
  低落: 'purple',
  烦躁: 'red',
};

const barColors: Record<string, string> = {
  blood_pressure_sys: '#ff4d4f',
  blood_pressure_dia: '#ff7a45',
  blood_glucose: '#faad14',
  heart_rate: '#52c41a',
  sleep_hours: '#722ed1',
  steps: '#1890ff',
};

function PureBarChart({
  labels,
  datasets,
}: {
  labels: string[];
  datasets: { label: string; data: (number | null)[]; color: string }[];
}) {
  const maxVal = Math.max(
    ...datasets.flatMap((d) => d.data.filter((v): v is number => v !== null)),
    1,
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {datasets.map((ds) => (
        <div key={ds.label}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{ds.label}</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
            {ds.data.map((val, i) => {
              const h = val != null ? Math.max(4, (val / maxVal) * 80) : 0;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    height: '100%',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 24,
                      height: h,
                      backgroundColor: val != null ? ds.color : '#eee',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.3s',
                    }}
                    title={val != null ? `${ds.label}: ${val}` : ''}
                  />
                  {labels.length <= 14 && (
                    <div
                      style={{
                        fontSize: 10,
                        color: '#999',
                        marginTop: 2,
                        writingMode: labels.length > 7 ? 'vertical-rl' : 'horizontal-tb',
                        maxWidth: 40,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {labels[i]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HealthPage() {
  const [loading, setLoading] = useState(false);
  const [elders, setElders] = useState<Elder[]>([]);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [trend, setTrend] = useState<HealthTrend | null>(null);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [selectedElderId, setSelectedElderId] = useState<number | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchElders = async () => {
      try {
        const res = await getElderList({ size: 200 });
        if (res.code === 200) {
          setElders(res.data.records);
        }
      } catch {
        message.error('加载老人列表失败');
      }
    };
    fetchElders();
  }, []);

  useEffect(() => {
    if (!selectedElderId) {
      setRecords([]);
      setTrend(null);
      setSummary(null);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        const [recordsRes, trendRes, summaryRes] = await Promise.all([
          getHealthRecords(selectedElderId, 30),
          getHealthTrend(selectedElderId, 30),
          getHealthSummary(selectedElderId, 30),
        ]);
        if (recordsRes.code === 200) setRecords(recordsRes.data as unknown as HealthRecord[]);
        if (trendRes.code === 200) setTrend(trendRes.data as HealthTrend);
        if (summaryRes.code === 200) setSummary(summaryRes.data as HealthSummary);
      } catch {
        message.error('加载健康数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedElderId]);

  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const res = await addHealthRecord({
        elderId: selectedElderId!,
        record_date: values.recordDate.format('YYYY-MM-DD'),
        blood_pressure_sys: values.bloodPressureSys,
        blood_pressure_dia: values.bloodPressureDia,
        blood_glucose: values.bloodGlucose,
        heart_rate: values.heartRate,
        blood_oxygen: values.bloodOxygen,
        sleep_hours: values.sleepHours,
        steps: values.steps,
        mood: values.mood,
        source: '手动录入',
      });
      if (res.code === 200) {
        message.success('添加记录成功');
        setModalOpen(false);
        form.resetFields();
        if (selectedElderId) {
          const [recordsRes, trendRes, summaryRes] = await Promise.all([
            getHealthRecords(selectedElderId, 30),
            getHealthTrend(selectedElderId, 30),
            getHealthSummary(selectedElderId, 30),
          ]);
          if (recordsRes.code === 200) setRecords(recordsRes.data as unknown as HealthRecord[]);
          if (trendRes.code === 200) setTrend(trendRes.data as HealthTrend);
          if (summaryRes.code === 200) setSummary(summaryRes.data as HealthSummary);
        }
      }
    } catch {
      // validation error
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: '日期',
      dataIndex: 'record_date',
      width: 110,
      render: (d: string) => dayjs(d).format('MM-DD'),
    },
    {
      title: '血压',
      width: 110,
      render: (_: unknown, r: HealthRecord) =>
        r.blood_pressure_sys && r.blood_pressure_dia
          ? `${r.blood_pressure_sys}/${r.blood_pressure_dia}`
          : '-',
    },
    {
      title: '血糖',
      dataIndex: 'blood_glucose',
      width: 80,
      render: (v: number | null) => (v != null ? `${v} mmol/L` : '-'),
    },
    {
      title: '心率',
      dataIndex: 'heart_rate',
      width: 80,
      render: (v: number | null) => (v != null ? `${v} bpm` : '-'),
    },
    {
      title: '血氧',
      dataIndex: 'blood_oxygen',
      width: 80,
      render: (v: number | null) => (v != null ? `${v}%` : '-'),
    },
    {
      title: '睡眠',
      dataIndex: 'sleep_hours',
      width: 80,
      render: (v: number | null) => (v != null ? `${v}h` : '-'),
    },
    {
      title: '步数',
      dataIndex: 'steps',
      width: 80,
      render: (v: number | null) => (v != null ? v : '-'),
    },
    {
      title: '心情',
      dataIndex: 'mood',
      width: 80,
      render: (v: string | null) =>
        v ? <Tag color={moodColors[v] || 'default'}>{v}</Tag> : '-',
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 80,
      render: (v: string) => <Tag>{v}</Tag>,
    },
  ];

  return (
    <Card
      title="健康档案"
      extra={
        <Space>
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
            notFoundContent={<Empty description="暂无老人数据" />}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={!selectedElderId}
            onClick={() => setModalOpen(true)}
          >
            添加记录
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        {!selectedElderId ? (
          <Empty description="请选择一位老人查看健康档案" style={{ padding: 60 }} />
        ) : (
          <>
            {summary && (
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={4}>
                  <Card size="small">
                    <Statistic
                      title="平均血压"
                      value={
                        summary.avg.blood_pressure_sys != null
                          ? `${summary.avg.blood_pressure_sys?.toFixed(0)}/${summary.avg.blood_pressure_dia?.toFixed(0)}`
                          : '-'
                      }
                      prefix={<HeartOutlined />}
                      valueStyle={{ color: '#ff4d4f', fontSize: 20 }}
                    />
                  </Card>
                </Col>
                <Col span={4}>
                  <Card size="small">
                    <Statistic
                      title="平均血糖"
                      value={summary.avg.blood_glucose?.toFixed(1) ?? '-'}
                      suffix="mmol/L"
                      valueStyle={{ color: '#faad14', fontSize: 20 }}
                    />
                  </Card>
                </Col>
                <Col span={4}>
                  <Card size="small">
                    <Statistic
                      title="平均心率"
                      value={summary.avg.heart_rate?.toFixed(0) ?? '-'}
                      suffix="bpm"
                      valueStyle={{ color: '#52c41a', fontSize: 20 }}
                    />
                  </Card>
                </Col>
                <Col span={4}>
                  <Card size="small">
                    <Statistic
                      title="平均睡眠"
                      value={summary.avg.sleep_hours?.toFixed(1) ?? '-'}
                      suffix="h"
                      valueStyle={{ color: '#722ed1', fontSize: 20 }}
                    />
                  </Card>
                </Col>
                <Col span={4}>
                  <Card size="small">
                    <Statistic
                      title="平均步数"
                      value={summary.avg.steps?.toFixed(0) ?? '-'}
                      suffix="步"
                      valueStyle={{ color: '#1890ff', fontSize: 20 }}
                    />
                  </Card>
                </Col>
                <Col span={4}>
                  <Card size="small">
                    <Statistic
                      title="总记录数"
                      value={summary.total_records ?? 0}
                      suffix="条"
                      valueStyle={{ color: '#13c2c2', fontSize: 20 }}
                    />
                  </Card>
                </Col>
              </Row>
            )}

            {trend && (
              <Card title="健康趋势" size="small" style={{ marginBottom: 24 }}>
                <Row gutter={[24, 24]}>
                  <Col span={12}>
                    <PureBarChart
                      labels={trend.dates.map((d) => dayjs(d).format('MM-DD'))}
                      datasets={[
                        {
                          label: '收缩压',
                          data: trend.blood_pressure_sys,
                          color: barColors.blood_pressure_sys,
                        },
                        {
                          label: '舒张压',
                          data: trend.blood_pressure_dia,
                          color: barColors.blood_pressure_dia,
                        },
                      ]}
                    />
                  </Col>
                  <Col span={12}>
                    <PureBarChart
                      labels={trend.dates.map((d) => dayjs(d).format('MM-DD'))}
                      datasets={[
                        {
                          label: '血糖',
                          data: trend.blood_glucose,
                          color: barColors.blood_glucose,
                        },
                      ]}
                    />
                  </Col>
                  <Col span={12}>
                    <PureBarChart
                      labels={trend.dates.map((d) => dayjs(d).format('MM-DD'))}
                      datasets={[
                        {
                          label: '心率',
                          data: trend.heart_rate,
                          color: barColors.heart_rate,
                        },
                      ]}
                    />
                  </Col>
                  <Col span={12}>
                    <PureBarChart
                      labels={trend.dates.map((d) => dayjs(d).format('MM-DD'))}
                      datasets={[
                        {
                          label: '睡眠',
                          data: trend.sleep_hours,
                          color: barColors.sleep_hours,
                        },
                      ]}
                    />
                  </Col>
                </Row>
              </Card>
            )}

            <Card title="健康记录" size="small">
              <Table
                dataSource={records}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 10, showSizeChanger: false }}
                size="small"
                scroll={{ x: 900 }}
              />
            </Card>
          </>
        )}
      </Spin>

      <Modal
        title="添加健康记录"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={handleAdd}
        confirmLoading={submitting}
        okText="提交"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="recordDate"
            label="记录日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bloodPressureSys" label="收缩压 (mmHg)">
                <InputNumber min={60} max={250} style={{ width: '100%' }} placeholder="120" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bloodPressureDia" label="舒张压 (mmHg)">
                <InputNumber min={30} max={150} style={{ width: '100%' }} placeholder="80" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bloodGlucose" label="血糖 (mmol/L)">
                <InputNumber min={1} max={30} step={0.1} style={{ width: '100%' }} placeholder="5.6" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="heartRate" label="心率 (bpm)">
                <InputNumber min={30} max={220} style={{ width: '100%' }} placeholder="72" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bloodOxygen" label="血氧 (%)">
                <InputNumber min={70} max={100} style={{ width: '100%' }} placeholder="98" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sleepHours" label="睡眠 (小时)">
                <InputNumber min={0} max={24} step={0.5} style={{ width: '100%' }} placeholder="7.5" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="steps" label="步数">
                <InputNumber min={0} max={100000} style={{ width: '100%' }} placeholder="8000" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="mood" label="心情">
                <Select
                  placeholder="选择心情"
                  options={moodOptions.map((m) => ({ value: m, label: m }))}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
}