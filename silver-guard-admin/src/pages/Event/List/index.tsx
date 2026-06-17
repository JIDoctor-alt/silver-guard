import { useEffect, useState } from 'react';
import { Table, Card, Button, Tag, Space, Select, Spin, message, Modal, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getEventList, assignEvent, handleEvent, markFalseAlarm, type Event } from '../../api';
import { useAppStore, useAuthStore } from '../../stores';
import dayjs from 'dayjs';

export default function EventListPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [filters, setFilters] = useState({ status: undefined as string | undefined, eventLevel: undefined as number | undefined });
  const [actionModal, setActionModal] = useState<{ type: 'handle' | 'falseAlarm'; event: Event | null }>({ type: 'handle', event: null });
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();
  const { communityId } = useAppStore();
  const { user } = useAuthStore();

  const fetchData = async (cursor?: number) => {
    setLoading(true);
    try {
      const result = await getEventList({
        communityId,
        status: filters.status,
        eventLevel: filters.eventLevel,
        cursor,
        size: 20,
      });
      if (result.code === 200) {
        if (cursor) {
          setEvents(prev => [...prev, ...result.data.records]);
        } else {
          setEvents(result.data.records);
        }
        setHasMore(result.data.hasMore);
        setNextCursor(result.data.nextCursor);
      }
    } catch (error) {
      message.error('加载事件列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [communityId, filters.status, filters.eventLevel]);

  const handleAssign = async (eventId: number) => {
    try {
      const result = await assignEvent(eventId, user?.id || 0);
      if (result.code === 200) {
        message.success('已分配给自己');
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'ASSIGNED', assignedUserId: user?.id } : e));
      }
    } catch (error) {
      message.error('分配失败');
    }
  };

  const handleAction = async () => {
    if (!actionModal.event) return;
    setActionLoading(true);
    try {
      let result;
      if (actionModal.type === 'handle') {
        result = await handleEvent(actionModal.event.id, actionReason);
      } else {
        result = await markFalseAlarm(actionModal.event.id, actionReason);
      }
      if (result.code === 200) {
        message.success(actionModal.type === 'handle' ? '已处理' : '已标记误报');
        setEvents(prev => prev.map(e => 
          e.id === actionModal.event!.id 
            ? { ...e, status: actionModal.type === 'handle' ? 'CLOSED' : 'FALSE_ALARM', closeReason: actionReason }
            : e
        ));
        setActionModal({ type: 'handle', event: null });
        setActionReason('');
      }
    } catch (error) {
      message.error('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

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

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '老人ID', dataIndex: 'elderId', width: 80 },
    { title: '类型', dataIndex: 'eventType' },
    {
      title: '等级',
      dataIndex: 'eventLevel',
      width: 80,
      render: (level: number) => <Tag color={eventLevelColor(level)}>L{level}</Tag>,
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      width: 80,
      render: (val: number) => `${Math.round(val * 100)}%`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => <Tag color={eventStatusColor(status)}>{status}</Tag>,
    },
    {
      title: '时间',
      dataIndex: 'gmtCreate',
      render: (time: string) => dayjs(time).format('MM-DD HH:mm'),
    },
    {
      title: '操作',
      width: 200,
      render: (record: Event) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/event/${record.id}`)}>查看</Button>
          {record.status === 'OPEN' && (
            <Button type="link" onClick={() => handleAssign(record.id)}>分配</Button>
          )}
          {record.status === 'ASSIGNED' && (
            <>
              <Button type="link" onClick={() => setActionModal({ type: 'handle', event: record })}>处理</Button>
              <Button type="link" onClick={() => setActionModal({ type: 'falseAlarm', event: record })}>误报</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="预警事件"
      extra={
        <Space>
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 120 }}
            onChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
            options={[
              { value: 'OPEN', label: '待处理' },
              { value: 'ASSIGNED', label: '已分配' },
              { value: 'CLOSED', label: '已关闭' },
              { value: 'FALSE_ALARM', label: '误报' },
            ]}
          />
          <Select
            placeholder="等级"
            allowClear
            style={{ width: 120 }}
            onChange={(val) => setFilters(prev => ({ ...prev, eventLevel: val }))}
            options={[
              { value: 1, label: 'L1 提示' },
              { value: 2, label: 'L2 关注' },
              { value: 3, label: 'L3 严重' },
              { value: 4, label: 'L4 紧急' },
            ]}
          />
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Table dataSource={events} columns={columns} rowKey="id" pagination={false} />
        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button onClick={() => fetchData(nextCursor)}>加载更多</Button>
          </div>
        )}
      </Spin>

      <Modal
        title={actionModal.type === 'handle' ? '处理事件' : '标记误报'}
        open={actionModal.event !== null}
        onCancel={() => setActionModal({ type: 'handle', event: null })}
        onOk={handleAction}
        confirmLoading={actionLoading}
      >
        <Input.TextArea
          placeholder="请输入原因"
          value={actionReason}
          onChange={(e) => setActionReason(e.target.value)}
          rows={3}
        />
      </Modal>
    </Card>
  );
}