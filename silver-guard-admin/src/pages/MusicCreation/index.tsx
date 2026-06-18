/**
 * ============================================================
 * Silver Guard · 音乐创作页面
 * 作曲/作词功能集成
 * ============================================================
 */

import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Select, Tag, Typography, Space, message, Spin, Collapse, Timeline, Modal, Input, Tabs, List, Avatar } from 'antd';
import {
  PlayCircleOutlined,
  SaveOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ReloadOutlined,
  MusicOutlined,
  CustomerServiceOutlined,
 bulbOutlined,
  ClockCircleOutlined,
  HeartOutlined
} from '@ant-design/icons';
import {
  getThemes,
  getStyles,
  generateLyrics,
  generateMusic,
  getMusicStatus,
  getMyWorks,
  saveWork,
  deleteWork,
  Theme,
  MusicStyle,
  Lyrics
} from '../../api/music';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;
const { TabPane } = Tabs;

export default function MusicCreation() {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [styles, setStyles] = useState<MusicStyle[]>([]);
  const [works, setWorks] = useState<any[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('elderCare');
  const [selectedStyle, setSelectedStyle] = useState<string>('pop');
  const [currentLyrics, setCurrentLyrics] = useState<Lyrics | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [activeTab, setActiveTab] = useState('create');

  // 加载主题和风格列表
  useEffect(() => {
    loadThemes();
    loadStyles();
    loadWorks();
  }, []);

  const loadThemes = async () => {
    try {
      const res = await getThemes();
      if (res.data.code === 0) {
        setThemes(res.data.data);
      }
    } catch (error) {
      message.error('加载主题失败');
    }
  };

  const loadStyles = async () => {
    try {
      const res = await getStyles();
      if (res.data.code === 0) {
        setStyles(res.data.data);
      }
    } catch (error) {
      message.error('加载风格失败');
    }
  };

  const loadWorks = async () => {
    try {
      const res = await getMyWorks();
      if (res.data.code === 0) {
        setWorks(res.data.data);
      }
    } catch (error) {
      message.error('加载作品失败');
    }
  };

  // 生成歌词
  const handleGenerateLyrics = async () => {
    setLoading(true);
    try {
      const res = await generateLyrics({
        theme: selectedTheme,
        style: selectedStyle
      });
      if (res.data.code === 0) {
        setCurrentLyrics(res.data.data);
        setCustomTitle(res.data.data.title);
        message.success('歌词生成成功！');
      }
    } catch (error) {
      message.error('生成歌词失败');
    } finally {
      setLoading(false);
    }
  };

  // 生成音乐
  const handleGenerateMusic = async () => {
    if (!currentLyrics) {
      message.warning('请先生成歌词');
      return;
    }

    setGenerating(true);
    try {
      const res = await generateMusic({
        lyrics: currentLyrics.lyrics,
        theme: selectedTheme,
        style: selectedStyle,
        title: customTitle
      });

      if (res.data.code === 0) {
        const generationId = res.data.data.id;
        message.loading('音乐生成中，请稍候...', 3);

        // 轮询生成状态
        const checkStatus = async () => {
          const statusRes = await getMusicStatus(generationId);
          if (statusRes.data.data.status === 'completed') {
            message.success('音乐生成完成！');
            loadWorks();
            setGenerating(false);
          } else {
            setTimeout(checkStatus, 2000);
          }
        };

        setTimeout(checkStatus, 5000);
      }
    } catch (error) {
      message.error('生成音乐失败');
      setGenerating(false);
    }
  };

  // 保存作品
  const handleSaveWork = async () => {
    if (!currentLyrics) {
      message.warning('请先生成歌词');
      return;
    }

    try {
      const res = await saveWork({
        title: customTitle,
        lyrics: currentLyrics.lyrics,
        theme: selectedTheme,
        style: selectedStyle
      });
      if (res.data.code === 0) {
        message.success('作品保存成功！');
        loadWorks();
      }
    } catch (error) {
      message.error('保存作品失败');
    }
  };

  // 删除作品
  const handleDeleteWork = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这首作品吗？',
      onOk: async () => {
        try {
          const res = await deleteWork(id);
          if (res.data.code === 0) {
            message.success('作品已删除');
            loadWorks();
          }
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        <MusicOutlined style={{ marginRight: 8 }} />
        音乐创作中心
      </Title>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="🎵 创作" key="create">
          <Row gutter={[16, 16]}>
            {/* 左侧：主题和风格选择 */}
            <Col xs={24} lg={8}>
              <Card title="🎨 选择主题">
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <Text strong>主题场景</Text>
                    <Select
                      style={{ width: '100%', marginTop: 8 }}
                      value={selectedTheme}
                      onChange={setSelectedTheme}
                      placeholder="选择创作主题"
                    >
                      {themes.map(theme => (
                        <Select.Option key={theme.id} value={theme.id}>
                          <Space>
                            <span>{theme.name}</span>
                            <Tag color="blue">{theme.bpm} BPM</Tag>
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>
                    <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                      {themes.find(t => t.id === selectedTheme)?.mood}
                    </Paragraph>
                  </div>

                  <div>
                    <Text strong>音乐风格</Text>
                    <Select
                      style={{ width: '100%', marginTop: 8 }}
                      value={selectedStyle}
                      onChange={setSelectedStyle}
                      placeholder="选择音乐风格"
                    >
                      {styles.map(style => (
                        <Select.Option key={style.id} value={style.id}>
                          <Space>
                            <span>{style.icon} {style.name}</span>
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>
                    <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                      {styles.find(s => s.id === selectedStyle)?.description}
                    </Paragraph>
                  </div>

                  <Button
                    type="primary"
                    icon={<bulbOutlined />}
                    size="large"
                    loading={loading}
                    onClick={handleGenerateLyrics}
                    block
                  >
                    ✨ 生成歌词
                  </Button>
                </Space>
              </Card>

              <Card title="📋 风格参考" style={{ marginTop: 16 }}>
                <Row gutter={[8, 8]}>
                  {styles.slice(0, 6).map(style => (
                    <Col span={8} key={style.id}>
                      <Tag
                        icon={<span>{style.icon}</span>}
                        color={selectedStyle === style.id ? 'blue' : 'default'}
                        style={{ width: '100%', textAlign: 'center', padding: '4px 8px' }}
                        onClick={() => setSelectedStyle(style.id)}
                      >
                        {style.name}
                      </Tag>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>

            {/* 中间：歌词预览 */}
            <Col xs={24} lg={16}>
              <Card
                title="📝 歌词预览"
                extra={
                  currentLyrics && (
                    <Space>
                      <Button icon={<ReloadOutlined />} onClick={handleGenerateLyrics}>
                        重新生成
                      </Button>
                      <Button icon={<SaveOutlined />} type="primary" onClick={handleSaveWork}>
                        保存作品
                      </Button>
                    </Space>
                  )
                }
              >
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 60 }}>
                    <Spin size="large" />
                    <Paragraph style={{ marginTop: 16 }}>AI 正在创作歌词...</Paragraph>
                  </div>
                ) : currentLyrics ? (
                  <div>
                    <Title level={4}>{customTitle || currentLyrics.title}</Title>
                    <Space style={{ marginBottom: 16 }}>
                      <Tag icon={<MusicOutlined />} color="processing">
                        {currentLyrics.style}
                      </Tag>
                      <Tag icon={<ClockCircleOutlined />}>
                        {currentLyrics.bpm} BPM
                      </Tag>
                      <Tag icon={<HeartOutlined />}>
                        {currentLyrics.mood}
                      </Tag>
                    </Space>

                    <TextArea
                      value={currentLyrics.lyrics}
                      onChange={(e) => setCurrentLyrics({ ...currentLyrics, lyrics: e.target.value })}
                      rows={12}
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 16,
                        lineHeight: 1.8,
                        background: '#fafafa'
                      }}
                    />

                    <Button
                      type="default"
                      icon={<CustomerServiceOutlined />}
                      size="large"
                      loading={generating}
                      onClick={handleGenerateMusic}
                      style={{ marginTop: 16 }}
                      block
                    >
                      🎵 AI 生成音乐（Suno 集成）
                    </Button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
                    <MusicOutlined style={{ fontSize: 48 }} />
                    <Paragraph style={{ marginTop: 16 }}>
                      请先选择主题和风格，然后点击"生成歌词"
                    </Paragraph>
                  </div>
                )}
              </Card>

              {/* 快速操作 */}
              {currentLyrics && (
                <Card title="⚡ 快速操作" style={{ marginTop: 16 }}>
                  <Row gutter={[8, 8]}>
                    <Col span={8}>
                      <Button icon={<DownloadOutlined />} block>
                        导出歌词
                      </Button>
                    </Col>
                    <Col span={8}>
                      <Button icon={<PlayCircleOutlined />} block>
                        试听预览
                      </Button>
                    </Col>
                    <Col span={8}>
                      <Button icon={<MusicOutlined />} block>
                        生成伴奏
                      </Button>
                    </Col>
                  </Row>
                </Card>
              )}
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="📚 我的作品" key="works">
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
            dataSource={works}
            renderItem={(item: any) => (
              <List.Item>
                <Card
                  hoverable
                  cover={
                    <div style={{
                      background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                      height: 180,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <MusicOutlined style={{ fontSize: 48, color: 'white' }} />
                    </div>
                  }
                  actions={[
                    <Button key="play" type="text" icon={<PlayCircleOutlined />}>
                      播放
                    </Button>,
                    <Button key="download" type="text" icon={<DownloadOutlined />}>
                      下载
                    </Button>,
                    <Button
                      key="delete"
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteWork(item.id)}
                      danger
                    >
                      删除
                    </Button>
                  ]}
                >
                  <Card.Meta
                    title={item.title}
                    description={
                      <Space direction="vertical" size="small">
                        <Tag color="blue">{item.theme}</Tag>
                        <Text type="secondary">
                          <ClockCircleOutlined /> {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </Space>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        </TabPane>

        <TabPane tab="📖 主题说明" key="info">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="🎯 可用主题">
                <Collapse>
                  {themes.map(theme => (
                    <Panel
                      key={theme.id}
                      header={
                        <Space>
                          <Tag>{theme.name}</Tag>
                          <Text type="secondary">{theme.mood}</Text>
                        </Space>
                      }
                    >
                      <Paragraph>
                        <Text strong>风格：</Text>{theme.style}
                      </Paragraph>
                      <Paragraph>
                        <Text strong>节拍：</Text>{theme.bpm} BPM
                      </Paragraph>
                      <Paragraph>
                        <Text strong>标签：</Text>
                        {theme.tags.map(tag => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </Paragraph>
                    </Panel>
                  ))}
                </Collapse>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="🎵 音乐风格">
                <List
                  dataSource={styles}
                  renderItem={style => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<span style={{ fontSize: 24 }}>{style.icon}</span>}
                        title={style.name}
                        description={
                          <Space direction="vertical" size="small">
                            <Text type="secondary">{style.description}</Text>
                            <Tag>BPM: {style.bpmRange}</Tag>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
}
