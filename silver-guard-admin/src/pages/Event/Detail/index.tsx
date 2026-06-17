import { useEffect, useState } from 'react';
import { Card, Descriptions, Tag, Button, Spin, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventDetail, type Event } from '../../../api';
import dayjs from 'dayjs';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const result = await getEventDetail(Number(id));
        if (result.code === 200) setEvent(result.data);
      } catch (error) {
        message.error('加载事件详情失败');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

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
  if (!event) return <div>事件不存在</div>;

  return (
    <Card
      title={`预警事件 #${event.id}`}
      extra={<Button onClick={() => navigate('/event')}>返回列表</Button>}
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="老人ID">{event.elderId}</Descriptions.Item>
        <Descriptions.Item label="设备ID">{event.deviceId || '无'}</Descriptions.Item>
        <Descriptions.Item label="事件类型">{event.eventType}</Descriptions.Item>
        <Descriptions.Item label="预警等级">
          <Tag color={eventLevelColor(event.eventLevel)}>L{event.eventLevel}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="置信度">{Math.round(event.confidence * 100)}%</Descriptions.Item>
        <Descriptions.Item label="来源">{event.source}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={eventStatusColor(event.status)}>{event.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="处理人">{event.assignedUserId || '未分配'}</Descriptions.Item>
        <Descriptions.Item label="首次上报">{dayjs(event.gmtCreate).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
        <Descriptions.Item label="关闭时间">{event.closedAt ? dayjs(event.closedAt).format('YYYY-MM-DD HH:mm:ss') : '未关闭'}</Descriptions.Item>
        <Descriptions.Item label="关闭原因">{event.closeReason || '无'}</Descriptions.Item>
      </Descriptions>
    </Card>
  );
}