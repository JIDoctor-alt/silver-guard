import { useEffect, useState } from 'react';
import { Table, Card, Button, Tag, Space, Select, Spin, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getElderList, deleteElder, type Elder } from '../../../api';
import { useAppStore } from '../../../stores';

export default function ElderListPage() {
  const [loading, setLoading] = useState(true);
  const [elders, setElders] = useState<Elder[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [filters, setFilters] = useState({ riskLevel: undefined as number | undefined });
  const navigate = useNavigate();
  const { communityId } = useAppStore();

  const fetchData = async (cursor?: number) => {
    setLoading(true);
    try {
      const result = await getElderList({
        communityId,
        riskLevel: filters.riskLevel,
        cursor,
        size: 20,
      });
      if (result.code === 200) {
        if (cursor) {
          setElders(prev => [...prev, ...result.data.records]);
        } else {
          setElders(result.data.records);
        }
        setHasMore(result.data.hasMore);
        setNextCursor(result.data.nextCursor);
      }
    } catch (error) {
      message.error('加载老人列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [communityId, filters.riskLevel]);

  const handleDelete = async (id: number) => {
    try {
      const result = await deleteElder(id);
      if (result.code === 200) {
        message.success('删除成功');
        setElders(prev => prev.filter(e => e.id !== id));
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const riskLevelColor = (level: number) => {
    const colors = ['green', 'orange', 'red', 'magenta'];
    return colors[level - 1] || 'default';
  };

  const genderText = (gender: number) => gender === 1 ? '男' : gender === 2 ? '女' : '未知';

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '姓名', dataIndex: 'name', width: 100 },
    { title: '性别', dataIndex: 'gender', width: 60, render: genderText },
    { title: '年龄', dataIndex: 'age', width: 60 },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      width: 80,
      render: (level: number) => <Tag color={riskLevelColor(level)}>L{level}</Tag>,
    },
    { title: '标签', dataIndex: 'tags', render: (tags: string[]) => tags?.map(t => <Tag key={t}>{t}</Tag>) },
    { title: '网格员', dataIndex: 'gridUserName', width: 100 },
    {
      title: '操作',
      width: 150,
      render: (record: Elder) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/elder/${record.id}`)}>查看</Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="老人档案"
      extra={
        <Space>
          <Select
            placeholder="风险等级"
            allowClear
            style={{ width: 120 }}
            onChange={(val) => setFilters(prev => ({ ...prev, riskLevel: val }))}
            options={[
              { value: 1, label: 'L1 低风险' },
              { value: 2, label: 'L2 中风险' },
              { value: 3, label: 'L3 高风险' },
              { value: 4, label: 'L4 极高风险' },
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/elder/new')}>
            新增
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Table
          dataSource={elders}
          columns={columns}
          rowKey="id"
          pagination={false}
        />
        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button onClick={() => fetchData(nextCursor)}>加载更多</Button>
          </div>
        )}
      </Spin>
    </Card>
  );
}