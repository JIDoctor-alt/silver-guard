// ============================================================
// Silver Guard · AI 音乐陪伴页面
// 作曲、作词、广场舞曲推荐与生成
// ============================================================
import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Select,
  Tag,
  Typography,
  Space,
  Spin,
  Empty,
  Divider,
  List,
  message,
  Radio,
  Descriptions,
} from 'antd';
import {
  CustomerServiceOutlined,
  AudioOutlined,
  EditOutlined,
  PlayCircleOutlined,
  FireOutlined,
  HeartOutlined,
  StarOutlined,
  ReloadOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import type {
  DanceSong,
  MusicComposition,
  LyricsComposition,
  MusicCategories,
} from '../../api/ai';
import {
  getDanceSongs,
  composeMusic,
  composeLyrics,
  getMusicCategories,
} from '../../api/ai';

const { Text, Title, Paragraph } = Typography;

export default function MusicPage() {
  const [activeTab, setActiveTab] = useState<'dance' | 'compose' | 'lyrics'>('dance');
  const [categories, setCategories] = useState<MusicCategories | null>(null);
  const [loading, setLoading] = useState(false);

  // 广场舞曲
  const [songs, setSongs] = useState<DanceSong[]>([]);
  const [danceFilter, setDanceFilter] = useState<{ tempo?: string; genre?: string }>({});

  // 作曲
  const [composeParams, setComposeParams] = useState({
    theme: '欢快',
    tempo: '中速',
    style: '民族风',
    mood: '愉快',
  });
  const [composition, setComposition] = useState<MusicComposition | null>(null);

  // 作词
  const [lyricsParams, setLyricsParams] = useState({
    theme: '健康养生',
    genre: '民歌',
  });
  const [lyrics, setLyrics] = useState<LyricsComposition | null>(null);

  useEffect(() => {
    loadCategories();
    loadDanceSongs();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await getMusicCategories();
      setCategories(res.data);
    } catch {
      // ignore
    }
  };

  const loadDanceSongs = async () => {
    setLoading(true);
    try {
      const res = await getDanceSongs(danceFilter);
      setSongs(res.data.songs);
    } catch {
      message.error('加载广场舞曲失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCompose = async () => {
    setLoading(true);
    try {
      const res = await composeMusic(composeParams);
      setComposition(res.data);
      message.success('作曲完成！');
    } catch {
      message.error('作曲失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleLyrics = async () => {
    setLoading(true);
    try {
      const res = await composeLyrics(lyricsParams);
      setLyrics(res.data);
      message.success('作词完成！');
    } catch {
      message.error('作词失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    { key: 'dance' as const, label: '广场舞曲', icon: <PlayCircleOutlined /> },
    { key: 'compose' as const, label: 'AI 作曲', icon: <AudioOutlined /> },
    { key: 'lyrics' as const, label: 'AI 作词', icon: <EditOutlined /> },
  ];

  return (
    <div>
      {/* 标题区 */}
      <Card style={{ marginBottom: 16 }}>
        <Space align="center" size="large">
          <CustomerServiceOutlined style={{ fontSize: 32, color: '#eb2f96' }} />
          <div>
            <Title level={4} style={{ margin: 0 }}>AI 音乐陪伴</Title>
            <Text type="secondary">为长者提供广场舞曲推荐、AI 作曲与作词服务</Text>
          </div>
        </Space>
      </Card>

      {/* 标签切换 */}
      <Card
        tabList={tabItems as never}
        activeTabKey={activeTab}
        onTabChange={(key) => setActiveTab(key as typeof activeTab)}
      >
        {/* ==================== 广场舞曲 ==================== */}
        {activeTab === 'dance' && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col>
                <Select
                  placeholder="节奏"
                  allowClear
                  style={{ width: 120 }}
                  value={danceFilter.tempo}
                  onChange={(v) => setDanceFilter((p) => ({ ...p, tempo: v }))}
                  options={categories?.tempos?.map((t) => ({ label: t, value: t })) || []}
                />
              </Col>
              <Col>
                <Select
                  placeholder="流派"
                  allowClear
                  style={{ width: 120 }}
                  value={danceFilter.genre}
                  onChange={(v) => setDanceFilter((p) => ({ ...p, genre: v }))}
                  options={categories?.genres?.map((g) => ({ label: g, value: g })) || []}
                />
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={loadDanceSongs}
                  loading={loading}
                >
                  换一批
                </Button>
              </Col>
            </Row>

            <Spin spinning={loading}>
              {songs.length === 0 ? (
                <Empty description="暂无匹配的广场舞曲" />
              ) : (
                <List
                  grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
                  dataSource={songs}
                  renderItem={(song) => (
                    <List.Item>
                      <Card
                        hoverable
                        size="small"
                        actions={[
                          <PlayCircleOutlined key="play" />,
                          <HeartOutlined key="like" />,
                          <StarOutlined key="star" />,
                        ]}
                      >
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
                                <Tag>{song.duration}</Tag>
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
              )}
            </Spin>

            {categories && (
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Text type="secondary">
                  共 {categories.totalSongs} 首广场舞曲 | 流派：{categories.genres.join('、')} | 节奏：{categories.tempos.join('、')}
                </Text>
              </div>
            )}
          </div>
        )}

        {/* ==================== AI 作曲 ==================== */}
        {activeTab === 'compose' && (
          <Row gutter={24}>
            <Col xs={24} md={10}>
              <Card title="作曲参数设置" size="small">
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <Text strong>主题</Text>
                    <Select
                      style={{ width: '100%', marginTop: 4 }}
                      value={composeParams.theme}
                      onChange={(v) => setComposeParams((p) => ({ ...p, theme: v }))}
                      options={[
                        { label: '🎵 欢快', value: '欢快' },
                        { label: '🌸 优美', value: '优美' },
                        { label: '🏔️ 豪迈', value: '豪迈' },
                        { label: '🍃 清新', value: '清新' },
                        { label: '🎊 喜庆', value: '喜庆' },
                      ]}
                    />
                  </div>

                  <div>
                    <Text strong>节奏</Text>
                    <Radio.Group
                      value={composeParams.tempo}
                      onChange={(e) => setComposeParams((p) => ({ ...p, tempo: e.target.value }))}
                      style={{ display: 'block', marginTop: 4 }}
                    >
                      <Radio.Button value="慢速">慢速</Radio.Button>
                      <Radio.Button value="中速">中速</Radio.Button>
                      <Radio.Button value="中快">中快</Radio.Button>
                      <Radio.Button value="快速">快速</Radio.Button>
                    </Radio.Group>
                  </div>

                  <div>
                    <Text strong>风格</Text>
                    <Select
                      style={{ width: '100%', marginTop: 4 }}
                      value={composeParams.style}
                      onChange={(v) => setComposeParams((p) => ({ ...p, style: v }))}
                      options={[
                        { label: '民族风', value: '民族风' },
                        { label: '流行', value: '流行' },
                        { label: '古典', value: '古典' },
                        { label: '民歌', value: '民歌' },
                        { label: '草原', value: '草原' },
                      ]}
                    />
                  </div>

                  <div>
                    <Text strong>心情</Text>
                    <Select
                      style={{ width: '100%', marginTop: 4 }}
                      value={composeParams.mood}
                      onChange={(v) => setComposeParams((p) => ({ ...p, mood: v }))}
                      options={[
                        { label: '😊 愉快', value: '愉快' },
                        { label: '😌 平静', value: '平静' },
                        { label: '🎉 兴奋', value: '兴奋' },
                        { label: '🤗 温馨', value: '温馨' },
                      ]}
                    />
                  </div>

                  <Button
                    type="primary"
                    icon={<CompassOutlined />}
                    block
                    size="large"
                    onClick={handleCompose}
                    loading={loading}
                  >
                    开始作曲
                  </Button>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={14}>
              <Card
                title={
                  <Space>
                    <AudioOutlined />
                    <span>AI 作曲结果</span>
                  </Space>
                }
                size="small"
              >
                {composition ? (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <PlayCircleOutlined style={{ fontSize: 48, color: '#722ed1' }} />
                      <Title level={3} style={{ marginTop: 8 }}>{composition.title}</Title>
                      <Space size={8}>
                        <Tag color="purple">{composition.style}</Tag>
                        <Tag color="pink">{composition.tempo}</Tag>
                        <Tag color="blue">BPM {composition.bpm}</Tag>
                        <Tag color="orange">{composition.mood}</Tag>
                      </Space>
                    </div>

                    <Descriptions bordered size="small" column={2}>
                      <Descriptions.Item label="调式">{composition.key}</Descriptions.Item>
                      <Descriptions.Item label="拍号">{composition.timeSignature}</Descriptions.Item>
                      <Descriptions.Item label="主题">{composition.theme}</Descriptions.Item>
                      <Descriptions.Item label="风格">{composition.style}</Descriptions.Item>
                    </Descriptions>

                    <Divider>旋律简谱</Divider>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                      {composition.melody.map((note, i) => (
                        <Tag key={i} color="geekblue" style={{ fontSize: 16, padding: '4px 10px' }}>
                          {note.note}
                        </Tag>
                      ))}
                    </div>

                    <Divider>AI 描述</Divider>
                    <Paragraph>{composition.description}</Paragraph>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {composition.caution}
                    </Text>
                  </div>
                ) : (
                  <Empty description="点击「开始作曲」生成您的专属旋律" />
                )}
              </Card>
            </Col>
          </Row>
        )}

        {/* ==================== AI 作词 ==================== */}
        {activeTab === 'lyrics' && (
          <Row gutter={24}>
            <Col xs={24} md={10}>
              <Card title="作词参数设置" size="small">
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <Text strong>主题</Text>
                    <Select
                      style={{ width: '100%', marginTop: 4 }}
                      value={lyricsParams.theme}
                      onChange={(v) => setLyricsParams((p) => ({ ...p, theme: v }))}
                      options={categories?.lyricThemes?.map((t) => ({ label: t, value: t })) || [
                        { label: '健康养生', value: '健康养生' },
                        { label: '岁月情怀', value: '岁月情怀' },
                        { label: '社区生活', value: '社区生活' },
                        { label: '家国情怀', value: '家国情怀' },
                      ]}
                    />
                  </div>

                  <div>
                    <Text strong>体裁</Text>
                    <Select
                      style={{ width: '100%', marginTop: 4 }}
                      value={lyricsParams.genre}
                      onChange={(v) => setLyricsParams((p) => ({ ...p, genre: v }))}
                      options={[
                        { label: '民歌', value: '民歌' },
                        { label: '流行', value: '流行' },
                        { label: '民族风', value: '民族风' },
                      ]}
                    />
                  </div>

                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    block
                    size="large"
                    onClick={handleLyrics}
                    loading={loading}
                  >
                    开始作词
                  </Button>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={14}>
              <Card
                title={
                  <Space>
                    <EditOutlined />
                    <span>AI 作词结果</span>
                  </Space>
                }
                size="small"
              >
                {lyrics ? (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <FireOutlined style={{ fontSize: 48, color: '#fa541c' }} />
                      <Title level={3} style={{ marginTop: 8 }}>{lyrics.title}</Title>
                      <Space>
                        <Tag color="volcano">{lyrics.theme}</Tag>
                        <Tag color="red">{lyrics.genre}</Tag>
                        <Tag>{lyrics.lineCount} 句</Tag>
                      </Space>
                    </div>

                    <Divider>歌词</Divider>
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #fff7e6 0%, #fff1f0 100%)',
                        padding: 24,
                        borderRadius: 8,
                        border: '1px solid #ffd8bf',
                      }}
                    >
                      {lyrics.content.split('\n').map((line, i) => (
                        <Paragraph
                          key={i}
                          style={{
                            fontSize: 18,
                            lineHeight: 2.2,
                            textAlign: 'center',
                            margin: 0,
                            color: '#595959',
                          }}
                        >
                          {line}
                        </Paragraph>
                      ))}
                    </div>

                    <Divider>AI 描述</Divider>
                    <Paragraph>{lyrics.description}</Paragraph>
                  </div>
                ) : (
                  <Empty description="点击「开始作词」生成您的专属歌词" />
                )}
              </Card>
            </Col>
          </Row>
        )}
      </Card>
    </div>
  );
}