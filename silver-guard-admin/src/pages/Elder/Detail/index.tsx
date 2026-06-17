import { useEffect, useState } from 'react';
import { Card, Descriptions, Tag, Button, Spin, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { getElderDetail, type Elder } from '../../api';

export default function ElderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [elder, setElder] = useState<Elder | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const result = await getElderDetail(Number(id));
        if (result.code === 200) setElder(result.data);
      } catch (error) {
        message.error('加载老人详情失败');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const riskLevelColor = (level: number) => {
    const colors = ['green', 'orange', 'red', 'magenta'];
    return colors[level - 1] || 'default';
  };

  const genderText = (gender: number) => gender === 1 ? '男' : gender === 2 ? '女' : '未知';

  if (loading) return <Spin size="large" />;
  if (!elder) return <div>老人不存在</div>;

  return (
    <Card
      title={`老人档案 - ${elder.name}`}
      extra={<Button onClick={() => navigate('/elder')}>返回列表</Button>}
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="姓名">{elder.name}</Descriptions.Item>
        <Descriptions.Item label="性别">{genderText(elder.gender)}</Descriptions.Item>
        <Descriptions.Item label="年龄">{elder.age} 岁</Descriptions.Item>
        <Descriptions.Item label="风险等级">
          <Tag color={riskLevelColor(elder.riskLevel)}>L{elder.riskLevel}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="标签">
          {elder.tags?.map(t => <Tag key={t}>{t}</Tag>)}
        </Descriptions.Item>
        <Descriptions.Item label="状态">{elder.status === 1 ? '正常' : '停用'}</Descriptions.Item>
        <Descriptions.Item label="网格员">{elder.gridUserName || '未分配'}</Descriptions.Item>
        <Descriptions.Item label="家属电话">
          {elder.guardianPhones?.join(', ') || '无'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}