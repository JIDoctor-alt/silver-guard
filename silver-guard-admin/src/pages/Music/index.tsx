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
  Input,
  Badge,
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
  SettingOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { getConfigList, updateConfig } from '../../api/systemConfig';

const { TextArea } = Input;
import type {
  DanceSong,
  MusicComposition,
  LyricsComposition,
  MusicCategories,
} from '../../api/ai';
import {
  getDanceSongs,
  composeMusic,
  getMusicCategories,
} from '../../api/ai';
import { generateLyricsStream } from '../../api/music';
import { getDanceSongs as getSquareDanceSongs } from '../../api/square';
import type { DanceSong as SquareDanceSong } from '../../api/square';

const { Text, Title, Paragraph } = Typography;

export default function MusicPage() {
  const [activeTab, setActiveTab] = useState<'dance' | 'compose' | 'lyrics'>('dance');
  const [categories, setCategories] = useState<MusicCategories | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>('DeepSeek V4 Pro');

  // 广场舞曲
  const [songs, setSongs] = useState<DanceSong[]>([]);
  const [extendedSongs, setExtendedSongs] = useState<SquareDanceSong[]>([]);
  const [danceFilter, setDanceFilter] = useState<{ tempo?: string; genre?: string }>({});

  // 作曲
  const [composeParams, setComposeParams] = useState({
    theme: '欢快',
    tempo: '中速',
    style: '民族风',
    mood: '愉快',
  });
  const [composition, setComposition] = useState<MusicComposition | null>(null);
  const [composeSystemPrompt, setComposeSystemPrompt] = useState('');
  const [composeUserPrompt, setComposeUserPrompt] = useState('');
  const [composePromptSaving, setComposePromptSaving] = useState(false);

  // 作词
  const [lyricsParams, setLyricsParams] = useState({
    theme: '健康养生',
    genre: '民歌',
  });
  const [lyrics, setLyrics] = useState<LyricsComposition | null>(null);
  const [lyricsStreamingContent, setLyricsStreamingContent] = useState('');
  const [isLyricsStreaming, setIsLyricsStreaming] = useState(false);
  const [lyricsSystemPrompt, setLyricsSystemPrompt] = useState('');
  const [lyricsUserPrompt, setLyricsUserPrompt] = useState('');
  const [lyricsPromptSaving, setLyricsPromptSaving] = useState(false);

  useEffect(() => {
    loadCategories();
    loadDanceSongs();
    loadModelInfo();
  }, []);

  useEffect(() => {
    if (activeTab === 'compose' && !composeSystemPrompt) {
      loadComposePrompts();
    }
    if (activeTab === 'lyrics' && !lyricsSystemPrompt) {
      loadLyricsPrompts();
    }
  }, [activeTab]);

  // 加载当前 AI 模型信息
  const loadModelInfo = async () => {
    try {
      const res = await getConfigList('model');
      const data = res.data as { code: number; list?: Array<{ config_key: string; config_value: string }> };
      if (data.code === 0) {
        const modelConfig = data.list?.find((c) => c.config_key === 'LLM_MODEL');
        if (modelConfig) {
          setCurrentModel(modelConfig.config_value);
        }
      }
    } catch {
      // ignore
    }
  };

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
      const [res, squareRes] = await Promise.all([
        getDanceSongs(danceFilter),
        getSquareDanceSongs(),
      ]);
      setSongs(res.data.songs);
      setExtendedSongs(squareRes.data.songs);
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
    setIsLyricsStreaming(true);
    setLyricsStreamingContent('');
    setLyrics(null);

    try {
      const response = await generateLyricsStream({
        theme: lyricsParams.theme,
        style: lyricsParams.genre,
      });

      if (!response.ok) {
        throw new Error('请求失败');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('不支持流式响应');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let serverResult: LyricsComposition | null = null;
      let currentEvent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.slice(6).trim();
          } else if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (currentEvent === 'token' && typeof data?.content === 'string') {
                fullContent += data.content;
                setLyricsStreamingContent(fullContent);
              } else if (currentEvent === 'done' && data && typeof data === 'object') {
                // 收到服务端的完整解析结果
                serverResult = {
                  title: data.title || `${lyricsParams.theme}之歌`,
                  theme: data.theme || lyricsParams.theme,
                  genre: data.genre || lyricsParams.genre,
                  content: data.content || '',
                  lineCount: data.lineCount || 0,
                  description: data.description || '',
                };
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      // 优先使用服务端解析的完整结果；否则降级为前端自己解析
      if (serverResult && serverResult.content) {
        setLyrics(serverResult);
      } else {
        const content = fullContent.trim();
        if (content) {
          // 从完整文本中粗略解析（若服务端未返回结构化结果）
          const lines = content.split('\n');
          setLyrics({
            title: lines[0]?.trim() || `${lyricsParams.theme}之歌`,
            theme: lyricsParams.theme,
            genre: lyricsParams.genre,
            content: content,
            lineCount: lines.filter((l) => l.trim()).length,
            description: `这是一首以"${lyricsParams.theme}"为主题的${lyricsParams.genre}风格歌词。`,
          });
        }
      }

      message.success('作词完成！');
    } catch {
      message.error('作词失败，请重试');
    } finally {
      setLoading(false);
      setIsLyricsStreaming(false);
    }
  };

  // 加载作曲提示词
  const loadComposePrompts = async () => {
    try {
      const res = await getConfigList();
      if (res.code === 200) {
        const configs = res.data as any[];
        const sys = configs.find((c) => c.configKey === 'LLM_COMPOSE_SYSTEM_PROMPT');
        const user = configs.find((c) => c.configKey === 'LLM_COMPOSE_USER_PROMPT');
        if (sys) setComposeSystemPrompt(sys.configValue || '');
        if (user) setComposeUserPrompt(user.configValue || '');
      }
    } catch {
      // ignore
    }
  };

  // 保存作曲提示词
  const handleSaveComposePrompts = async () => {
    setComposePromptSaving(true);
    try {
      await Promise.all([
        updateConfig('LLM_COMPOSE_SYSTEM_PROMPT', composeSystemPrompt),
        updateConfig('LLM_COMPOSE_USER_PROMPT', composeUserPrompt),
      ]);
      message.success('作曲提示词配置已保存');
    } catch {
      message.error('保存失败');
    } finally {
      setComposePromptSaving(false);
    }
  };

  // 加载作词提示词
  const loadLyricsPrompts = async () => {
    try {
      const res = await getConfigList();
      if (res.code === 200) {
        const configs = res.data as any[];
        const sys = configs.find((c) => c.configKey === 'LLM_LYRICS_SYSTEM_PROMPT');
        const user = configs.find((c) => c.configKey === 'LLM_LYRICS_USER_PROMPT');
        if (sys) setLyricsSystemPrompt(sys.configValue || '');
        if (user) setLyricsUserPrompt(user.configValue || '');
      }
    } catch {
      // ignore
    }
  };

  // 保存作词提示词
  const handleSaveLyricsPrompts = async () => {
    setLyricsPromptSaving(true);
    try {
      await Promise.all([
        updateConfig('LLM_LYRICS_SYSTEM_PROMPT', lyricsSystemPrompt),
        updateConfig('LLM_LYRICS_USER_PROMPT', lyricsUserPrompt),
      ]);
      message.success('作词提示词配置已保存');
    } catch {
      message.error('保存失败');
    } finally {
      setLyricsPromptSaving(false);
    }
  };

  const allSongs = [...songs, ...extendedSongs];

  // ==== AI 作词结果显示预计算（智能解析流式文本格式） ====
  // 格式约定: 第1行=标题, 空行分隔, 之后是歌词正文(每句一行), 段落间空行,
  //          结尾处"【创作说明】"后为创作说明文字

  // 解析流式内容: 返回 { title, content, description, lineCount }
  const parseStreamingLyrics = (text: string) => {
    const lines = text.split('\n');
    let title = lyricsParams.theme + '之歌';
    const contentLines: string[] = [];
    let description = '';
    let inDescription = false;

    let idx = 0;
    while (idx < lines.length && !lines[idx].trim()) idx++;

    if (idx < lines.length) {
      const firstLine = lines[idx].trim();
      if (firstLine && firstLine.length <= 20 && !firstLine.startsWith('【')) {
        title = firstLine;
        idx++;
      }
    }

    while (idx < lines.length && !lines[idx].trim()) idx++;

    while (idx < lines.length) {
      const line = lines[idx];
      const trimmed = line.trim();

      if (!trimmed) {
        if (contentLines.length > 0 && !inDescription && contentLines[contentLines.length - 1] !== '') {
          contentLines.push('');
        }
        idx++;
        continue;
      }

      if (/^【创作说明】/.test(trimmed) || /^创作说明/.test(trimmed)) {
        inDescription = true;
        idx++;
        continue;
      }

      if (inDescription) {
        description += (description ? ' ' : '') + trimmed;
      } else {
        let clean = trimmed
          .replace(/^\d+[.、)\]\s]+/, '')
          .replace(/^[（(]\d+[）)]\s*/, '')
          .replace(/^"|"$/g, '')
          .replace(/^'|'$/g, '')
          .replace(/^#+\s*/, '')
          .trim();
        if (clean) {
          // 过滤纯符号行
          if (!/^[{}\[\]":,]+$/.test(clean)) {
            contentLines.push(clean);
          }
        }
      }
      idx++;
    }

    while (contentLines.length > 0 && !contentLines[0].trim()) contentLines.shift();
    while (contentLines.length > 0 && !contentLines[contentLines.length - 1].trim()) contentLines.pop();

    const lineCount = contentLines.filter((l) => l.trim()).length;
    return { title, content: contentLines.join('\n'), description, lineCount };
  };

  // 流式生成中/未完成: 从流式文本解析; 已完成: 直接使用后端返回的结构化对象
  let lyricsTitle = lyricsParams.theme + '之歌';
  let displayContent = '';
  let lyricLines: string[] = [];
  let lyricsLineCount = 0;
  let lyricsDescription = '';

  if (lyrics) {
    lyricsTitle = lyrics.title || lyricsParams.theme + '之歌';
    displayContent = lyrics.content || '';
    lyricLines = displayContent.split('\n');
    lyricsLineCount = lyrics.lineCount || 0;
    lyricsDescription = lyrics.description || '';
  } else if (lyricsStreamingContent) {
    const parsed = parseStreamingLyrics(lyricsStreamingContent);
    lyricsTitle = parsed.title;
    displayContent = parsed.content;
    lyricLines = displayContent ? displayContent.split('\n') : [];
    lyricsLineCount = parsed.lineCount;
    lyricsDescription = parsed.description;
  }

  const lyricsResultHeaderStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: 16,
  };
  const lyricsFireIconStyle: React.CSSProperties = {
    fontSize: 48,
    color: '#fa541c',
  };
  const lyricsTitleStyle: React.CSSProperties = { marginTop: 8 };
  const lyricsBoxStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #fff7e6 0%, #fff1f0 100%)',
    padding: 24,
    borderRadius: 8,
    border: '1px solid #ffd8bf',
    minHeight: 200,
  };
  const lyricsLineStyle: React.CSSProperties = {
    fontSize: 18,
    lineHeight: 2.2,
    textAlign: 'center',
    margin: 0,
    color: '#595959',
  };
  const lyricsParagraphStyle: React.CSSProperties = {
    height: 16,
    margin: 0,
  };
  const lyricsSectionTitleStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#fa8c16',
    textAlign: 'center',
    margin: '8px 0 4px',
    fontWeight: 600,
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
              {allSongs.length === 0 ? (
                <Empty description="暂无匹配的广场舞曲" />
              ) : (
                <List
                  grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
                  dataSource={allSongs}
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
                                <Tag>{'duration' in song ? (song as DanceSong).duration : ''}</Tag>
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
                  共 {allSongs.length} 首广场舞曲 | 流派：{categories.genres.join('、')} | 节奏：{categories.tempos.join('、')}
                </Text>
              </div>
            )}
          </div>
        )}

        {/* ==================== AI 作曲 ==================== */}
        {activeTab === 'compose' && (
          <Row gutter={24}>
            <Col xs={24} md={10}>
              <Card
                title={
                  <Space>
                    <span>作曲参数设置</span>
                    <Badge color="blue" text={<Text type="secondary" style={{ fontSize: 12 }}>{currentModel}</Text>} />
                  </Space>
                }
                size="small"
                extra={<Tag color="purple">🤖 AI 作曲</Tag>}
              >
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

              <Card
                size="small"
                style={{ marginTop: 12 }}
                title={
                  <Space>
                    <SettingOutlined />
                    <span>系统提示词</span>
                  </Space>
                }
                extra={
                  <Button
                    size="small"
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={composePromptSaving}
                    onClick={handleSaveComposePrompts}
                  >
                    保存
                  </Button>
                }
              >
                <Text type="secondary" style={{ marginBottom: 6, fontSize: 12, display: 'block' }}>
                  定义 AI 的作曲角色与风格
                </Text>
                <TextArea
                  rows={4}
                  value={composeSystemPrompt}
                  onChange={(e) => setComposeSystemPrompt(e.target.value)}
                  placeholder="例如：你是一位熟悉中国民族音乐的作曲大师，擅长为广场舞创作旋律..."
                  style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 8 }}
                />
                <Text type="secondary" style={{ marginBottom: 6, fontSize: 12, display: 'block' }}>
                  用户提示词模板（支持 {`{theme}`} {`{tempo}`} {`{style}`} {`{mood}`} 占位符）
                </Text>
                <TextArea
                  rows={5}
                  value={composeUserPrompt}
                  onChange={(e) => setComposeUserPrompt(e.target.value)}
                  placeholder="请根据以下参数创作一首乐曲：\n主题：{theme}\n节奏：{tempo}\n风格：{style}\n心情：{mood}"
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
              </Card>
            </Col>

            <Col xs={24} md={14}>
              <Card
                title={
                  <Space>
                    <AudioOutlined />
                    <span>AI 作曲结果</span>
                    <Badge color="geekblue" text={<Text type="secondary" style={{ fontSize: 12 }}>{currentModel}</Text>} />
                  </Space>
                }
                size="small"
                extra={<Tag color="orange">🤖 AI 生成</Tag>}
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
              <Card
                title={
                  <Space>
                    <span>作词参数设置</span>
                    <Badge color="green" text={<Text type="secondary" style={{ fontSize: 12 }}>{currentModel}</Text>} />
                  </Space>
                }
                size="small"
                extra={<Tag color="gold">✨ AI 作词</Tag>}
              >
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

              <Card
                size="small"
                style={{ marginTop: 12 }}
                title={
                  <Space>
                    <SettingOutlined />
                    <span>系统提示词</span>
                  </Space>
                }
                extra={
                  <Button
                    size="small"
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={lyricsPromptSaving}
                    onClick={handleSaveLyricsPrompts}
                  >
                    保存
                  </Button>
                }
              >
                <Text type="secondary" style={{ marginBottom: 6, fontSize: 12, display: 'block' }}>
                  定义 AI 的作词角色与风格
                </Text>
                <TextArea
                  rows={4}
                  value={lyricsSystemPrompt}
                  onChange={(e) => setLyricsSystemPrompt(e.target.value)}
                  placeholder="例如：你是一位深受群众喜爱的歌词作家，擅长创作适合广场舞的歌词..."
                  style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 8 }}
                />
                <Text type="secondary" style={{ marginBottom: 6, fontSize: 12, display: 'block' }}>
                  用户提示词模板（支持 {`{theme}`} {`{genre}`} 占位符）
                </Text>
                <TextArea
                  rows={5}
                  value={lyricsUserPrompt}
                  onChange={(e) => setLyricsUserPrompt(e.target.value)}
                  placeholder="请根据以下参数创作歌词：\n主题：{theme}\n体裁：{genre}"
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
              </Card>
            </Col>

            <Col xs={24} md={14}>
              <Card
                title={
                  <Space>
                    <EditOutlined />
                    <span>AI 作词结果</span>
                    <Badge color="cyan" text={<Text type="secondary" style={{ fontSize: 12 }}>{currentModel}</Text>} />
                  </Space>
                }
                size="small"
                extra={<Tag color="purple">流式输出</Tag>}
              >
                {isLyricsStreaming || lyricsStreamingContent ? (
                  <div>
                    <div style={lyricsResultHeaderStyle}>
                      <FireOutlined style={lyricsFireIconStyle} />
                      <Title level={3} style={lyricsTitleStyle}>
                        {lyricsTitle}
                      </Title>
                      <Space>
                        <Tag color="volcano">{lyricsParams.theme}</Tag>
                        <Tag color="red">{lyricsParams.genre}</Tag>
                        {isLyricsStreaming ? (
                          <Tag color="blue">正在生成中...</Tag>
                        ) : (
                          <Tag>{lyricsLineCount} 句</Tag>
                        )}
                      </Space>
                    </div>

                    <Divider>歌词</Divider>
                    <div style={lyricsBoxStyle}>
                      {lyricLines.length > 0 ? (
                        lyricLines.map((line, i) => {
                          if (!line.trim()) {
                            // 空行: 段落分隔
                            return <div key={i} style={lyricsParagraphStyle} />;
                          }
                          if (/^【[^】]*】$/.test(line.trim())) {
                            // 段落标题: 如【主歌】【副歌】
                            return (
                              <Paragraph key={i} style={lyricsSectionTitleStyle}>
                                {line.trim()}
                              </Paragraph>
                            );
                          }
                          // 普通歌词行
                          return (
                            <Paragraph key={i} style={lyricsLineStyle}>
                              {line}
                              {isLyricsStreaming && i === lyricLines.length - 1 && (
                                <span style={{ marginLeft: 4, animation: 'blink 1s infinite' }}>▊</span>
                              )}
                            </Paragraph>
                          );
                        })
                      ) : (
                        <Paragraph style={{ textAlign: 'center', color: '#8c8c8c' }}>
                          歌词生成中...
                        </Paragraph>
                      )}
                    </div>

                    {lyricsDescription ? (
                      <div>
                        <Divider>AI 描述</Divider>
                        <Paragraph style={{ textAlign: 'center', color: '#8c8c8c' }}>
                          {lyricsDescription}
                        </Paragraph>
                      </div>
                    ) : null}
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