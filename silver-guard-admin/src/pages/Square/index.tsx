// ============================================================
// Silver Guard · 银龄广场页面
// 广场舞教学、社区活动、音乐创作知识库
// ============================================================
import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Typography,
  Space,
  Spin,
  Empty,
  Divider,
  List,
  message,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Tabs,
  Badge,
} from 'antd';
import {
  TeamOutlined,
  PlayCircleOutlined,
  CalendarOutlined,
  BookOutlined,
  SoundOutlined,
  TrophyOutlined,
  CompassOutlined,
  FormOutlined,
  PlusOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  StarOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import type {
  DanceStep,
  DanceSong,
  Activity,
  ActivityTemplate,
  MusicKnowledgeItem,
  MusicKnowledgeCategory,
  Comment,
  UserCreation,
} from '../../api/square';
import {
  getDanceSteps,
  getDanceSongs,
  getActivities,
  getActivityTemplates,
  getMusicKnowledge,
  getMusicKnowledgeCategories,
  getComments,
  addComment,
  toggleLike,
  getLikeCount,
  getLikeStatus,
  getUserCreations,
} from '../../api/square';
import {
  HeartOutlined,
  HeartFilled,
  MessageOutlined,
  SendOutlined,
} from '@ant-design/icons';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

// 活动类型映射
const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  DANCE: { label: '广场舞', color: 'pink' },
  LECTURE: { label: '讲座', color: 'blue' },
  FESTIVAL: { label: '节日活动', color: 'orange' },
  SPORT: { label: '运动健身', color: 'green' },
  OTHER: { label: '其他', color: 'default' },
};

// 创作类型映射
const CREATION_TYPE_MAP: Record<string, { label: string; color: string }> = {
  SONG: { label: '歌曲创作', color: 'purple' },
  LYRIC: { label: 'AI 作词', color: 'blue' },
  DANCE: { label: '舞步创作', color: 'pink' },
};

// 知识分类映射
const KNOWLEDGE_CATEGORY_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  SCALE: { label: '音阶调式', icon: <SoundOutlined /> },
  RHYTHM: { label: '节奏型', icon: <PlayCircleOutlined /> },
  HARMONY: { label: '和声', icon: <StarOutlined /> },
  INSTRUMENT: { label: '民族乐器', icon: <SoundOutlined /> },
  MELODY: { label: '旋律创作', icon: <FormOutlined /> },
  THEORY: { label: '编曲理论', icon: <BookOutlined /> },
};

// ==================== CommentSection 组件 ====================

function CommentSection({ targetType, targetId }: { targetType: string; targetId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const loadComments = async () => {
    try {
      const res = await getComments(targetType, targetId);
      setComments(res.data.comments);
      setTotal(res.data.total);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadComments(); }, [targetId]);

  const handleSubmit = async () => {
    if (!commentText.trim()) return;
    setLoading(true);
    try {
      await addComment({
        targetType,
        targetId,
        userId: 1,
        userName: '社区用户',
        content: commentText.trim(),
        parentId: replyTo?.id,
      });
      message.success(replyTo ? '回复成功' : '评论成功');
      setCommentText('');
      setReplyTo(null);
      loadComments();
    } catch {
      message.error('评论失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <Divider style={{ margin: '12px 0' }} />
      <Space style={{ marginBottom: 8 }}>
        <MessageOutlined />
        <Text strong>评论 ({total})</Text>
      </Space>

      {/* 评论输入 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {replyTo && (
          <Tag closable onClose={() => setReplyTo(null)} color="blue">
            回复 @{replyTo.name}
          </Tag>
        )}
        <TextArea
          rows={2}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={replyTo ? `回复 @${replyTo.name}...` : '写评论...'}
          maxLength={500}
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSubmit}
          loading={loading}
          disabled={!commentText.trim()}
        >
          发送
        </Button>
      </div>

      {/* 评论列表 */}
      {comments.length === 0 ? (
        <Text type="secondary">暂无评论，快来抢沙发吧~</Text>
      ) : (
        <List
          size="small"
          dataSource={comments}
          renderItem={(c) => (
            <List.Item>
              <div style={{ width: '100%' }}>
                <Space style={{ marginBottom: 4 }}>
                  <Text strong style={{ fontSize: 13 }}>{c.user_name}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(c.gmt_create).toLocaleString('zh-CN')}
                  </Text>
                </Space>
                <div style={{ marginBottom: 4 }}>
                  <Text>{c.content}</Text>
                </div>
                <Space size={16}>
                  <Button
                    type="link"
                    size="small"
                    icon={<MessageOutlined />}
                    onClick={() => setReplyTo({ id: c.id, name: c.user_name })}
                  >
                    回复
                  </Button>
                </Space>

                {/* 回复列表 */}
                {c.replies && c.replies.length > 0 && (
                  <div style={{ marginTop: 8, marginLeft: 24, padding: 8, background: '#fafafa', borderRadius: 4 }}>
                    {c.replies.map((r) => (
                      <div key={r.id} style={{ marginBottom: 4 }}>
                        <Space size={4}>
                          <Text strong style={{ fontSize: 12 }}>{r.user_name}</Text>
                          {r.parent_id && <Text type="secondary" style={{ fontSize: 11 }}>回复</Text>}
                        </Space>
                        <Text style={{ fontSize: 13 }}>：{r.content}</Text>
                        <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                          {new Date(r.gmt_create).toLocaleString('zh-CN')}
                        </Text>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}

// ==================== LikeButton 组件 ====================

function LikeButton({ targetType, targetId }: { targetType: string; targetId: number }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    getLikeCount(targetType, targetId).then((res) => setCount(res.data.count));
    getLikeStatus(targetType, targetId, 1).then((res) => setLiked(res.data.liked));
  }, [targetId]);

  const handleToggle = async () => {
    try {
      const res = await toggleLike(targetType, targetId, 1);
      setLiked(res.data.liked);
      setCount((c) => (res.data.liked ? c + 1 : Math.max(0, c - 1)));
    } catch { /* ignore */ }
  };

  return (
    <Button
      type={liked ? 'primary' : 'default'}
      size="small"
      icon={liked ? <HeartFilled /> : <HeartOutlined />}
      danger={liked}
      onClick={handleToggle}
    >
      {count}
    </Button>
  );
}

// ==================== 主页面 ====================

export default function SquarePage() {
  const [activeTab, setActiveTab] = useState('dance');
  const [loading, setLoading] = useState(false);

  // 广场舞
  const [danceSteps, setDanceSteps] = useState<DanceStep[]>([]);
  const [danceSongs, setDanceSongs] = useState<DanceSong[]>([]);
  const [selectedStep, setSelectedStep] = useState<DanceStep | null>(null);
  const [stepModalVisible, setStepModalVisible] = useState(false);

  // 活动
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityTemplates, setActivityTemplates] = useState<ActivityTemplate[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [activityFilter, setActivityFilter] = useState<string>('');

  // 音乐创作知识库
  const [knowledgeItems, setKnowledgeItems] = useState<MusicKnowledgeItem[]>([]);
  const [knowledgeCategories, setKnowledgeCategories] = useState<MusicKnowledgeCategory[]>([]);
  const [selectedKnowledge, setSelectedKnowledge] = useState<MusicKnowledgeItem | null>(null);
  const [knowledgeModalVisible, setKnowledgeModalVisible] = useState(false);
  const [knowledgeFilter, setKnowledgeFilter] = useState<{ category?: string; difficulty?: string }>({});

  // 创作广场
  const [creations, setCreations] = useState<UserCreation[]>([]);

  // 创建活动表单
  const [createForm] = Form.useForm();

  useEffect(() => {
    loadDanceData();
    loadActivities();
    loadActivityTemplates();
    loadKnowledgeData();
    loadCreations();
  }, []);

  const loadDanceData = async () => {
    setLoading(true);
    try {
      const [stepsRes, songsRes] = await Promise.all([getDanceSteps(), getDanceSongs()]);
      setDanceSteps(stepsRes.data.steps);
      setDanceSongs(songsRes.data.songs);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const res = await getActivities({ status: 'PUBLISHED', pageSize: 20 });
      setActivities(res.data.activities);
    } catch {
      // ignore
    }
  };

  const loadActivityTemplates = async () => {
    try {
      const res = await getActivityTemplates();
      setActivityTemplates(res.data.templates);
    } catch {
      // ignore
    }
  };

  const loadKnowledgeData = async () => {
    try {
      const [itemsRes, catRes] = await Promise.all([getMusicKnowledge(), getMusicKnowledgeCategories()]);
      setKnowledgeItems(itemsRes.data.items);
      setKnowledgeCategories(catRes.data.categories);
    } catch {
      // ignore
    }
  };

  const loadCreations = async () => {
    try {
      const res = await getUserCreations({ pageSize: 20 });
      setCreations(res.data.creations);
    } catch {
      // ignore
    }
  };

  const filteredActivities = activityFilter
    ? activities.filter((a) => a.category === activityFilter)
    : activities;

  const filteredKnowledge = knowledgeItems.filter((item) => {
    if (knowledgeFilter.category && item.category !== knowledgeFilter.category) return false;
    if (knowledgeFilter.difficulty && item.difficulty !== knowledgeFilter.difficulty) return false;
    return true;
  });

  const tabItems = [
    { key: 'dance', label: '广场舞', icon: <PlayCircleOutlined /> },
    { key: 'activity', label: '社区活动', icon: <CalendarOutlined /> },
    { key: 'knowledge', label: '音乐创作', icon: <BookOutlined /> },
    { key: 'creations', label: '创作广场', icon: <HeartOutlined /> },
  ];

  return (
    <div>
      {/* 标题区 */}
      <Card style={{ marginBottom: 16 }}>
        <Space align="center" size="large">
          <TrophyOutlined style={{ fontSize: 32, color: '#fa8c16' }} />
          <div>
            <Title level={4} style={{ margin: 0 }}>银龄广场</Title>
            <Text type="secondary">广场舞教学 · 社区活动 · 音乐创作知识库</Text>
          </div>
        </Space>
      </Card>

      {/* 标签切换 */}
      <Card
        tabList={tabItems as never}
        activeTabKey={activeTab}
        onTabChange={(key) => setActiveTab(key)}
      >
        <Spin spinning={loading}>
          {/* ==================== 广场舞 ==================== */}
          {activeTab === 'dance' && (
            <div>
              <Tabs
                items={[
                  {
                    key: 'steps',
                    label: <Space><CompassOutlined />舞步教学</Space>,
                    children: (
                      <Row gutter={[16, 16]}>
                        {danceSteps.map((step) => (
                          <Col xs={24} sm={12} md={8} lg={6} key={step.id}>
                            <Card
                              hoverable
                              size="small"
                              onClick={() => {
                                setSelectedStep(step);
                                setStepModalVisible(true);
                              }}
                            >
                              <Card.Meta
                                title={
                                  <Space>
                                    <Text strong>{step.name}</Text>
                                    <Tag color={step.difficulty === '入门' ? 'green' : 'orange'}>
                                      {step.difficulty}
                                    </Tag>
                                  </Space>
                                }
                                description={
                                  <div>
                                    <Tag color="purple">{step.category}</Tag>
                                    <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                                      {step.description.slice(0, 50)}...
                                    </Text>
                                  </div>
                                }
                              />
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    ),
                  },
                  {
                    key: 'songs',
                    label: <Space><SoundOutlined />广场舞曲库</Space>,
                    children: (
                      <List
                        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 5 }}
                        dataSource={danceSongs}
                        renderItem={(song) => (
                          <List.Item>
                            <Card hoverable size="small">
                              <Card.Meta
                                title={
                                  <Space>
                                    <Text strong>{song.title}</Text>
                                    <Tag color="pink">{song.tempo}</Tag>
                                  </Space>
                                }
                                description={
                                  <div>
                                    <Text type="secondary">{song.artist}</Text>
                                    <br />
                                    <Space size={4} wrap style={{ marginTop: 4 }}>
                                      <Tag color="purple">{song.genre}</Tag>
                                      <Tag>BPM {song.bpm}</Tag>
                                    </Space>
                                    <div style={{ marginTop: 4 }}>
                                      {song.tags.map((t) => (
                                        <Tag key={t} color="blue">{t}</Tag>
                                      ))}
                                    </div>
                                  </div>
                                }
                              />
                            </Card>
                          </List.Item>
                        )}
                      />
                    ),
                  },
                ]}
              />
            </div>
          )}

          {/* ==================== 社区活动 ==================== */}
          {activeTab === 'activity' && (
            <div>
              <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                  <Space>
                    <Text strong>筛选类型：</Text>
                    <Select
                      allowClear
                      placeholder="全部类型"
                      style={{ width: 140 }}
                      value={activityFilter || undefined}
                      onChange={(v) => setActivityFilter(v || '')}
                      options={Object.entries(CATEGORY_MAP).map(([k, v]) => ({
                        label: v.label,
                        value: k,
                      }))}
                    />
                  </Space>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalVisible(true)}
                  >
                    发布活动
                  </Button>
                </Col>
              </Row>

              {filteredActivities.length === 0 ? (
                <Empty description="暂无活动" />
              ) : (
                <List
                  grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
                  dataSource={filteredActivities}
                  renderItem={(activity) => {
                    const cat = CATEGORY_MAP[activity.category] || { label: activity.category, color: 'default' };
                    return (
                      <List.Item>
                        <Card
                          hoverable
                          size="small"
                          onClick={() => {
                            setSelectedActivity(activity);
                            setActivityModalVisible(true);
                          }}
                        >
                          <Card.Meta
                            title={
                              <Space>
                                <Tag color={cat.color}>{cat.label}</Tag>
                                <Text strong>{activity.title}</Text>
                              </Space>
                            }
                            description={
                              <div>
                                <div style={{ marginBottom: 8 }}>
                                  <Space size={4}>
                                    <EnvironmentOutlined />
                                    <Text type="secondary">{activity.location}</Text>
                                  </Space>
                                  <br />
                                  <Space size={4}>
                                    <ClockCircleOutlined />
                                    <Text type="secondary">
                                      {new Date(activity.start_time).toLocaleDateString('zh-CN')}
                                    </Text>
                                  </Space>
                                </div>
                                <Space>
                                  <Badge
                                    count={`${activity.current_participants}人已报名`}
                                    style={{ backgroundColor: '#52c41a' }}
                                  />
                                  {activity.max_participants && (
                                    <Text type="secondary">/ {activity.max_participants}人</Text>
                                  )}
                                </Space>
                                {activity.tags && activity.tags.length > 0 && (
                                  <div style={{ marginTop: 4 }}>
                                    {activity.tags.map((t: string) => (
                                      <Tag key={t} color="blue">{t}</Tag>
                                    ))}
                                  </div>
                                )}
                              </div>
                            }
                          />
                        </Card>
                      </List.Item>
                    );
                  }}
                />
              )}
            </div>
          )}

          {/* ==================== 音乐创作知识库 ==================== */}
          {activeTab === 'knowledge' && (
            <div>
              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col>
                  <Select
                    allowClear
                    placeholder="知识分类"
                    style={{ width: 150 }}
                    value={knowledgeFilter.category}
                    onChange={(v) => setKnowledgeFilter((p) => ({ ...p, category: v }))}
                    options={knowledgeCategories.map((c) => ({ label: c.label, value: c.name }))}
                  />
                </Col>
                <Col>
                  <Select
                    allowClear
                    placeholder="难度"
                    style={{ width: 120 }}
                    value={knowledgeFilter.difficulty}
                    onChange={(v) => setKnowledgeFilter((p) => ({ ...p, difficulty: v }))}
                    options={[
                      { label: '入门', value: 'BEGINNER' },
                      { label: '进阶', value: 'INTERMEDIATE' },
                      { label: '高级', value: 'ADVANCED' },
                    ]}
                  />
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                {filteredKnowledge.map((item) => {
                  const cat = KNOWLEDGE_CATEGORY_MAP[item.category] || { label: item.category, icon: <BookOutlined /> };
                  return (
                    <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                      <Card
                        hoverable
                        size="small"
                        onClick={() => {
                          setSelectedKnowledge(item);
                          setKnowledgeModalVisible(true);
                        }}
                      >
                        <Card.Meta
                          title={
                            <Space>
                              {cat.icon}
                              <Text strong style={{ fontSize: 14 }}>{item.title}</Text>
                            </Space>
                          }
                          description={
                            <div>
                              <Space size={4} style={{ marginBottom: 4 }}>
                                <Tag color="blue">{cat.label}</Tag>
                                <Tag color={item.difficulty === 'BEGINNER' ? 'green' : item.difficulty === 'INTERMEDIATE' ? 'orange' : 'red'}>
                                  {item.difficulty === 'BEGINNER' ? '入门' : item.difficulty === 'INTERMEDIATE' ? '进阶' : '高级'}
                                </Tag>
                              </Space>
                              <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                                {item.description.slice(0, 60)}...
                              </Text>
                            </div>
                          }
                        />
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </div>
          )}

          {/* ==================== 创作广场 ==================== */}
          {activeTab === 'creations' && (
            <div>
              {creations.length === 0 ? (
                <Empty description="暂无创作作品，快去创作吧~" />
              ) : (
                <List
                  grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
                  dataSource={creations}
                  renderItem={(creation) => {
                    const typeInfo = CREATION_TYPE_MAP[creation.type] || { label: creation.type, color: 'default' };
                    return (
                      <List.Item>
                        <Card
                          size="small"
                          title={
                            <Space>
                              <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
                              <Text strong>{creation.title}</Text>
                            </Space>
                          }
                          extra={
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {new Date(creation.gmt_create).toLocaleDateString('zh-CN')}
                            </Text>
                          }
                        >
                          {creation.description && (
                            <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginBottom: 12 }}>
                              {creation.description}
                            </Paragraph>
                          )}
                          <Space style={{ marginBottom: 8 }}>
                            <LikeButton targetType="CREATION" targetId={creation.id} />
                            <span style={{ fontSize: 12, color: '#999' }}>
                              <MessageOutlined /> {creation.comments_count ?? 0}
                            </span>
                          </Space>
                          <CommentSection targetType="CREATION" targetId={creation.id} />
                        </Card>
                      </List.Item>
                    );
                  }}
                />
              )}
            </div>
          )}
        </Spin>
      </Card>

      {/* ==================== 舞步详情弹窗 ==================== */}
      <Modal
        title={selectedStep?.name}
        open={stepModalVisible}
        onCancel={() => setStepModalVisible(false)}
        footer={null}
        width={640}
      >
        {selectedStep && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Tag color={selectedStep.difficulty === '入门' ? 'green' : 'orange'}>
                {selectedStep.difficulty}
              </Tag>
              <Tag color="purple">{selectedStep.category}</Tag>
            </Space>
            <Paragraph>{selectedStep.description}</Paragraph>
            <Divider>步法分解</Divider>
            <List
              size="small"
              dataSource={selectedStep.steps}
              renderItem={(step, i) => (
                <List.Item>
                  <Space>
                    <Tag color="blue">{i + 1}</Tag>
                    <Text>{step}</Text>
                  </Space>
                </List.Item>
              )}
            />
            <Divider>小贴士</Divider>
            <Paragraph type="success">
              <BulbOutlined /> {selectedStep.tips}
            </Paragraph>
          </div>
        )}
      </Modal>

      {/* ==================== 活动详情弹窗 ==================== */}
      <Modal
        title={selectedActivity?.title}
        open={activityModalVisible}
        onCancel={() => setActivityModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setActivityModalVisible(false)}>关闭</Button>,
          <Button key="register" type="primary" icon={<TeamOutlined />}>
            我要报名
          </Button>,
        ]}
        width={640}
      >
        {selectedActivity && (
          <div>
            <Space style={{ marginBottom: 16 }} size={8}>
              <Tag color={CATEGORY_MAP[selectedActivity.category]?.color}>
                {CATEGORY_MAP[selectedActivity.category]?.label}
              </Tag>
              {selectedActivity.tags?.map((t: string) => (
                <Tag key={t} color="blue">{t}</Tag>
              ))}
            </Space>
            <Paragraph>{selectedActivity.description}</Paragraph>
            <Divider />
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space>
                <EnvironmentOutlined />
                <Text strong>地点：</Text>
                <Text>{selectedActivity.location}</Text>
              </Space>
              <Space>
                <ClockCircleOutlined />
                <Text strong>时间：</Text>
                <Text>
                  {new Date(selectedActivity.start_time).toLocaleString('zh-CN')} ~ {new Date(selectedActivity.end_time).toLocaleString('zh-CN')}
                </Text>
              </Space>
              <Space>
                <TeamOutlined />
                <Text strong>报名：</Text>
                <Text>
                  {selectedActivity.current_participants} 人已报名
                  {selectedActivity.max_participants && ` / ${selectedActivity.max_participants} 人上限`}
                </Text>
              </Space>
            </Space>
          </div>
        )}
      </Modal>

      {/* ==================== 创建活动弹窗 ==================== */}
      <Modal
        title="发布社区活动"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => createForm.submit()}
        width={640}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={() => {
            message.success('活动发布成功！');
            setCreateModalVisible(false);
            createForm.resetFields();
          }}
        >
          <Form.Item name="title" label="活动标题" rules={[{ required: true, message: '请输入活动标题' }]}>
            <Input placeholder="请输入活动标题" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="活动类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Select
                  placeholder="选择类型"
                  options={Object.entries(CATEGORY_MAP).map(([k, v]) => ({ label: v.label, value: k }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="活动地点" rules={[{ required: true, message: '请输入地点' }]}>
                <Input placeholder="活动地点" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startTime" label="开始时间" rules={[{ required: true, message: '请选择' }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endTime" label="结束时间" rules={[{ required: true, message: '请选择' }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="maxParticipants" label="人数上限（可选）">
            <InputNumber min={1} placeholder="不填则不限制" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="活动描述" rules={[{ required: true, message: '请输入活动描述' }]}>
            <TextArea rows={4} placeholder="请输入活动描述" />
          </Form.Item>
          <Divider>使用模板快速创建</Divider>
          <Row gutter={[8, 8]}>
            {activityTemplates.map((t, i) => (
              <Col key={i}>
                <Tag
                  color="blue"
                  style={{ cursor: 'pointer', padding: '4px 8px' }}
                  onClick={() => {
                    createForm.setFieldsValue({
                      title: t.title,
                      category: t.category,
                      description: t.description,
                      tags: t.tags,
                    });
                  }}
                >
                  {t.title}
                </Tag>
              </Col>
            ))}
          </Row>
        </Form>
      </Modal>

      {/* ==================== 知识详情弹窗 ==================== */}
      <Modal
        title={selectedKnowledge?.title}
        open={knowledgeModalVisible}
        onCancel={() => setKnowledgeModalVisible(false)}
        footer={null}
        width={720}
      >
        {selectedKnowledge && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Tag color="blue">
                {KNOWLEDGE_CATEGORY_MAP[selectedKnowledge.category]?.label}
              </Tag>
              <Tag color={selectedKnowledge.difficulty === 'BEGINNER' ? 'green' : 'orange'}>
                {selectedKnowledge.difficulty === 'BEGINNER' ? '入门' : selectedKnowledge.difficulty === 'INTERMEDIATE' ? '进阶' : '高级'}
              </Tag>
              {selectedKnowledge.subCategory && (
                <Tag>{selectedKnowledge.subCategory}</Tag>
              )}
            </Space>
            <Paragraph>{selectedKnowledge.description}</Paragraph>
            <Divider />
            {renderKnowledgeContent(selectedKnowledge)}
          </div>
        )}
      </Modal>
    </div>
  );
}

// 渲染知识内容
function renderKnowledgeContent(item: MusicKnowledgeItem) {
  const content = item.content as Record<string, unknown>;

  // 音阶
  if (item.category === 'SCALE' && content.notes) {
    return (
      <div>
        {(content.notes as Array<Record<string, string>>)?.map((note, i) => (
          <Card key={i} size="small" style={{ marginBottom: 8 }}>
            <Text strong>{note.name}</Text>（{note.pitch}）- {note.description}
          </Card>
        ))}
        {content.usage && <Paragraph type="secondary">{content.usage as string}</Paragraph>}
      </div>
    );
  }

  // 调式
  if (item.category === 'SCALE' && content.modes) {
    return (
      <List
        size="small"
        dataSource={content.modes as Array<Record<string, string>>}
        renderItem={(mode) => (
          <List.Item>
            <Space>
              <Tag color="purple">{mode.name}</Tag>
              <Text>主音：{mode.tonic}</Text>
              <Tag>{mode.character}</Tag>
              <Text type="secondary">适合：{mode.suitable}</Text>
            </Space>
          </List.Item>
        )}
      />
    );
  }

  // 节奏型
  if (item.category === 'RHYTHM' && content.patterns) {
    return (
      <List
        size="small"
        dataSource={content.patterns as Array<Record<string, string>>}
        renderItem={(p) => (
          <List.Item>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Tag color="blue">{p.name}</Tag>
                <Text code>{p.pattern}</Text>
                <Tag>BPM {p.bpm}</Tag>
              </Space>
              <Text type="secondary">{p.usage}</Text>
            </Space>
          </List.Item>
        )}
      />
    );
  }

  // 和声
  if (item.category === 'HARMONY' && content.progressions) {
    return (
      <List
        size="small"
        dataSource={content.progressions as Array<Record<string, string>>}
        renderItem={(p) => (
          <List.Item>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Tag color="orange">{p.name}</Tag>
                <Text code>{p.chords}</Text>
              </Space>
              <Text type="secondary">{p.description}</Text>
            </Space>
          </List.Item>
        )}
      />
    );
  }

  // 乐器
  if (item.category === 'INSTRUMENT') {
    return (
      <div>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space>
            <Tag>{content.type as string}</Tag>
            <Tag>音域：{content.range as string}</Tag>
          </Space>
          <Paragraph><Text strong>音色特点：</Text>{content.character as string}</Paragraph>
          <Paragraph><Text strong>适用场景：</Text>{content.suitable as string}</Paragraph>
          <Paragraph><Text strong>代表曲目：</Text>{(content.famousPieces as string[])?.join('、')}</Paragraph>
          <Paragraph><Text strong>编曲建议：</Text>{content.usage as string}</Paragraph>
        </Space>
      </div>
    );
  }

  // 旋律创作
  if (item.category === 'MELODY' && content.techniques) {
    return (
      <List
        size="small"
        dataSource={content.techniques as Array<Record<string, string>>}
        renderItem={(t) => (
          <List.Item>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.name}</Text>
              <Text type="secondary">{t.description}</Text>
            </Space>
          </List.Item>
        )}
      />
    );
  }

  // 编曲理论
  if (item.category === 'THEORY' && content.sections) {
    return (
      <List
        size="small"
        dataSource={content.sections as Array<Record<string, string>>}
        renderItem={(s) => (
          <List.Item>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Tag color="purple">{s.name}</Tag>
                <Text code>{s.bars}</Text>
              </Space>
              <Text type="secondary">{s.description}</Text>
            </Space>
          </List.Item>
        )}
      />
    );
  }

  if (item.category === 'THEORY' && content.orchestrations) {
    return (
      <List
        size="small"
        dataSource={content.orchestrations as Array<Record<string, string>>}
        renderItem={(o) => (
          <List.Item>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{o.name}</Text>
              <Text type="secondary">{o.instruments}</Text>
              <Tag>{o.style}</Tag>
            </Space>
          </List.Item>
        )}
      />
    );
  }

  // 国风美学
  if (content.aesthetics) {
    return (
      <div>
        <List
          size="small"
          dataSource={content.aesthetics as Array<Record<string, string>>}
          renderItem={(a) => (
            <List.Item>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{a.principle}</Text>
                <Text type="secondary">{a.description}</Text>
              </Space>
            </List.Item>
          )}
        />
        {content.structure && (
          <>
            <Divider>曲式结构</Divider>
            <Paragraph type="secondary">{content.structure as string}</Paragraph>
          </>
        )}
      </div>
    );
  }

  // 戏曲音乐
  if (content.styles) {
    return (
      <div>
        <List
          size="small"
          dataSource={content.styles as Array<Record<string, string>>}
          renderItem={(s) => (
            <List.Item>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <Tag color="red">{s.name}</Tag>
                  <Text strong>{s.features}</Text>
                </Space>
                <Text type="secondary">{s.usage}</Text>
              </Space>
            </List.Item>
          )}
        />
        {content.tips && (
          <>
            <Divider>运用要点</Divider>
            <Paragraph type="secondary">{content.tips as string}</Paragraph>
          </>
        )}
      </div>
    );
  }

  return <Paragraph>{JSON.stringify(content, null, 2)}</Paragraph>;
}