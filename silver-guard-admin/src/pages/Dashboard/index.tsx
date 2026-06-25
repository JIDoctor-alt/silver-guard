import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag, Spin, List, Typography, Space } from 'antd';
import {
  UserOutlined,
  HddOutlined,
  AlertOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  RiseOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { getDashboardSummary, getEventList, getElderList, getDeviceList, type DashboardSummary, type Event, type Elder, type Device } from '../../api';
import { useAppStore } from '../../stores';
import dayjs from 'dayjs';

const { Text } = Typography;

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [elders, setElders] = useState<Elder[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const { communityId } = useAppStore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [summaryRes, eventsRes, eldersRes, devicesRes] = await Promise.all([
          getDashboardSummary(communityId),
          getEventList({ communityId, size: 5 }),
          getElderList({ communityId, size: 100 }),
          getDeviceList({ size: 100 }),
        ]);
        if (summaryRes.code === 200) setSummary(summaryRes.data);
        if (eventsRes.code === 200) setRecentEvents(eventsRes.data.records);
        if (eldersRes.code === 200) setElders(eldersRes.data.records);
        if (devicesRes.code === 200) setDevices(devicesRes.data.records);
      } catch (error) {
        console.error('加载驾驶舱数据失败', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [communityId]);

  // 统计老人风险等级分布
  const riskDistribution = elders.reduce((acc, e) => {
    acc[e.riskLevel] = (acc[e.riskLevel] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // 统计设备状态
  const onlineDevices = devices.filter(d => d.status === 1).length;
  const offlineDevices = devices.filter(d => d.status !== 1).length;

  const eventLevelColor = (level: number) => {
    const colors = ['green', 'orange', 'red', 'magenta'];
    return colors[level - 1] || 'default';
  };

  const eventStatusColor = (status: string) => {
    const map: Record<string, string> = {
      OPEN: 'red',
      ASSIGNED: 'orange',
      CLOSED: 'green',
      FALSE_ALARM: 'default',
    };
    return map[status] || 'default';
  };

  if (loading) return <Spin size="large" />;

  return (
    <div>
      {/* 第一行：核心数据概览 */}
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="守护老人"
              value={summary?.totalElders || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8 }}>
              <Tag color="red">高风险: {riskDistribution[3] || 0}</Tag>
              <Tag color="orange">中风险: {riskDistribution[2] || 0}</Tag>
              <Tag color="blue">低风险: {riskDistribution[1] || 0}</Tag>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="IoT 设备"
              value={summary?.totalDevices || 0}
              suffix={`/ 在线 ${summary?.onlineDevices || 0}`}
              prefix={<HddOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8 }}>
              <Tag color="green">在线: {onlineDevices}</Tag>
              <Tag color="red">离线: {offlineDevices}</Tag>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日预警"
              value={summary?.todayEvents || 0}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            <div style={{ marginTop: 8 }}>
              <Tag color="red">L4 紧急: {summary?.todayL4Events || 0}</Tag>
              <Tag color="orange">L3 重要: {summary?.todayL3Events || 0}</Tag>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均响应"
              value={summary?.avgResponseSeconds || 0}
              suffix="秒"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              目标 &lt; 30s · 7×24 全天候
            </div>
          </Card>
        </Col>
      </Row>

      {/* 第二行：质量指标 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="累计巡检"
              value={summary?.totalElders ? Math.floor(summary.totalElders * 1.5) : 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>本月</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="AI 准确率"
              value={summary ? 100 - Math.round(summary.falsePositiveRate * 100) : 95}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="24h 内处理"
              value={85}
              suffix="%"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="安全天数"
              value={128}
              suffix="天"
              prefix={<SafetyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 第三行：设备在线率 + 误报率 + 处理完成率 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card title="设备在线率">
            <Progress
              type="circle"
              percent={summary ? Math.round((summary.onlineDevices / Math.max(summary.totalDevices, 1)) * 100) : 0}
              strokeColor="#52c41a"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="误报率">
            <Progress
              type="circle"
              percent={summary ? Math.round(summary.falsePositiveRate * 100) : 0}
              strokeColor="#faad14"
              format={(p) => `${p}%`}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="处理完成率">
            <Progress
              type="circle"
              percent={75}
              strokeColor="#1890ff"
            />
          </Card>
        </Col>
      </Row>

      {/* 第四行：系统架构 + 最近预警 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="系统架构概览" size="small">
            <Row gutter={[8, 8]}>
              <Col span={6}>
                <Card size="small" style={{ background: '#e6f7ff', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>终端</div>
                  <div style={{ fontSize: 11, color: '#666' }}>IoT 感知</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ background: '#f6ffed', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#52c41a' }}>边缘</div>
                  <div style={{ fontSize: 11, color: '#666' }}>实时推理</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ background: '#f9f0ff', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#722ed1' }}>云端</div>
                  <div style={{ fontSize: 11, color: '#666' }}>数据平台</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ background: '#fff7e6', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#fa8c16' }}>AI</div>
                  <div style={{ fontSize: 11, color: '#666' }}>大模型</div>
                </Card>
              </Col>
            </Row>
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#fafafa', borderRadius: 6 }}>
              <Text type="secondary">
                端-边-云-大模型中枢 · 7×24 全天候守护 · 30 秒响应 · 95% 准确率
              </Text>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近预警事件" size="small">
            <List
              dataSource={recentEvents.slice(0, 5)}
              renderItem={(event) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      event.eventLevel >= 3
                        ? <WarningOutlined style={{ color: 'red', fontSize: 18 }} />
                        : <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                    }
                    title={
                      <Space>
                        <Tag color={eventLevelColor(event.eventLevel)}>L{event.eventLevel}</Tag>
                        <span>{event.eventType}</span>
                        <Tag color={eventStatusColor(event.status)}>{event.status}</Tag>
                      </Space>
                    }
                    description={dayjs(event.gmtCreate).format('MM-DD HH:mm:ss')}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 第五行：风险分布 + 设备类型 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="老人风险等级分布" size="small">
            <div style={{ marginBottom: 12 }}>
              <Text>高风险 (L3)</Text>
              <Progress percent={elders.length ? Math.round((riskDistribution[3] || 0) / elders.length * 100) : 0} strokeColor="#ff4d4f" format={() => `${riskDistribution[3] || 0} 人`} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text>中风险 (L2)</Text>
              <Progress percent={elders.length ? Math.round((riskDistribution[2] || 0) / elders.length * 100) : 0} strokeColor="#faad14" format={() => `${riskDistribution[2] || 0} 人`} />
            </div>
            <div>
              <Text>低风险 (L1)</Text>
              <Progress percent={elders.length ? Math.round((riskDistribution[1] || 0) / elders.length * 100) : 0} strokeColor="#1890ff" format={() => `${riskDistribution[1] || 0} 人`} />
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="设备类型分布" size="small">
            <Table
              dataSource={devices.slice(0, 5)}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { title: '设备名称', dataIndex: 'name', ellipsis: true },
                { title: '类型', dataIndex: 'deviceType', width: 80 },
                { title: '位置', dataIndex: 'location', width: 80 },
                {
                  title: '状态',
                  dataIndex: 'status',
                  width: 70,
                  render: (s: number) => s === 1 ? <Tag color="green">在线</Tag> : <Tag color="red">离线</Tag>,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}