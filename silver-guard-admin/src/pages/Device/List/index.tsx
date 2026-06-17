import { useEffect, useState } from 'react';
import { Table, Card, Tag, Spin, message } from 'antd';
import { getDeviceList, type Device } from '../../../api';
import { useAppStore } from '../../../stores';
import dayjs from 'dayjs';

export default function DeviceListPage() {
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<Device[]>([]);
  const { communityId } = useAppStore();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const result = await getDeviceList({ size: 50 });
        if (result.code === 200) setDevices(result.data.records);
      } catch (error) {
        message.error('加载设备列表失败');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [communityId]);

  const statusColor = (status: number) => {
    const colors: Record<number, string> = {
      0: 'default',
      1: 'green',
      2: 'red',
      3: 'default',
    };
    return colors[status] || 'default';
  };

  const statusText = (status: number) => {
    const texts: Record<number, string> = {
      0: '离线',
      1: '在线',
      2: '故障',
      3: '已拆除',
    };
    return texts[status] || '未知';
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '设备类型', dataIndex: 'deviceType' },
    { title: '厂商', dataIndex: 'vendor' },
    { title: '序列号', dataIndex: 'sn' },
    { title: '名称', dataIndex: 'name' },
    { title: '位置', dataIndex: 'location' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: number) => <Tag color={statusColor(status)}>{statusText(status)}</Tag>,
    },
    { title: '离线次数', dataIndex: 'offlineCount' },
    { title: '绑定老人', dataIndex: 'elderId', render: (id: number) => id || '未绑定' },
    {
      title: '创建时间',
      dataIndex: 'gmtCreate',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD'),
    },
  ];

  return (
    <Card title="设备管理">
      <Spin spinning={loading}>
        <Table dataSource={devices} columns={columns} rowKey="id" pagination={{ pageSize: 20 }} />
      </Spin>
    </Card>
  );
}