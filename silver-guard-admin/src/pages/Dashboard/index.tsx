import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag, Spin } from 'antd';
import {
  UserOutlined,
  HddOutlined,
  AlertOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { getDashboardSummary, getEventList, type DashboardSummary, type Event } from '../../api';
import { useAppStore } from '../../stores';
import dayjs from 'dayjs';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const { communityId } = useAppStore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [summaryRes, eventsRes] = await Promise.all([
          getDashboardSummary(communityId),
          getEventList({ communityId, size: 10 }),
        ]);
        if (summaryRes.code === 200) setSummary(summaryRes.data);
        if (eventsRes.code === 200) setRecentEvents(eventsRes.data.records);
      } catch (error) {
        console.error('加载驾驶舱数据失败', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [communityId]);

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
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="老人总数"
              value={summary?.totalElders || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="设备总数 / 在线"
              value={summary?.totalDevices || 0}
              suffix={`/ ${summary?.onlineDevices || 0}`}
              prefix={<HddOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
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
              <Tag color="red">L4: {summary?.todayL4Events || 0}</Tag>
              <Tag color="orange">L3: {summary?.todayL3Events || 0}</Tag>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均响应时间"
              value={summary?.avgResponseSeconds || 0}
              suffix="秒"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card title="设备在线率">
            <Progress
              type="circle"
              percent={summary ? Math.round((summary.onlineDevices / summary.totalDevices) * 100) : 0}
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

      <Card title="最近预警事件" style={{ marginTop: 16 }}>
        <Table
          dataSource={recentEvents}
          rowKey="id"
          pagination={false}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 60 },
            { title: '老人ID', dataIndex: 'elderId', width: 80 },
            { title: '类型', dataIndex: 'eventType' },
            {
              title: '等级',
              dataIndex: 'eventLevel',
              render: (level: number) => <Tag color={eventLevelColor(level)}>L{level}</Tag>,
            },
            {
              title: '状态',
              dataIndex: 'status',
              render: (status: string) => <Tag color={eventStatusColor(status)}>{status}</Tag>,
            },
            {
              title: '时间',
              dataIndex: 'gmtCreate',
              render: (time: string) => dayjs(time).format('MM-DD HH:mm'),
            },
          ]}
        />
      </Card>
    </div>
  );
}