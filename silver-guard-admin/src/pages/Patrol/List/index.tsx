import { useEffect, useState } from 'react';
import { Table, Card, Button, Tag, Spin, message } from 'antd';
import { getPatrolList, type PatrolRecord } from '../../../api';
import { useAppStore } from '../../../stores';
import dayjs from 'dayjs';

export default function PatrolListPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<PatrolRecord[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const { communityId } = useAppStore();

  const fetchData = async (cursor?: number) => {
    setLoading(true);
    try {
      const result = await getPatrolList({ size: 20, cursor });
      if (result.code === 200) {
        if (cursor) {
          setRecords(prev => [...prev, ...result.data.records]);
        } else {
          setRecords(result.data.records);
        }
        setHasMore(result.data.hasMore);
        setNextCursor(result.data.nextCursor);
      }
    } catch (error) {
      message.error('加载巡检记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [communityId]);

  const taskTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      ROUTINE: 'blue',
      EMERGENCY: 'red',
      FOLLOW_UP: 'orange',
    };
    return colors[type] || 'default';
  };

  const elderStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NORMAL: 'green',
      ABNORMAL: 'red',
      CANNOT_CONTACT: 'orange',
      REFUSED: 'default',
    };
    return colors[status] || 'default';
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '老人ID', dataIndex: 'elderId', width: 80 },
    { title: '网格员ID', dataIndex: 'userId', width: 80 },
    {
      title: '任务类型',
      dataIndex: 'taskType',
      render: (type: string) => <Tag color={taskTypeColor(type)}>{type}</Tag>,
    },
    {
      title: '打卡时间',
      dataIndex: 'checkinAt',
      render: (time: string) => dayjs(time).format('MM-DD HH:mm'),
    },
    {
      title: '老人状态',
      dataIndex: 'elderStatus',
      render: (status: string) => <Tag color={elderStatusColor(status)}>{status}</Tag>,
    },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
    {
      title: '需回访',
      dataIndex: 'followUpFlag',
      render: (flag: boolean) => flag ? <Tag color="orange">是</Tag> : <Tag>否</Tag>,
    },
  ];

  return (
    <Card title="巡检记录">
      <Spin spinning={loading}>
        <Table dataSource={records} columns={columns} rowKey="id" pagination={false} />
        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button onClick={() => fetchData(nextCursor)}>加载更多</Button>
          </div>
        )}
      </Spin>
    </Card>
  );
}