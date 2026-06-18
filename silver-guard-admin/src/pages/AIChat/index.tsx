// ============================================================
// Silver Guard · RAG 智能问答页面
// 基于养老知识库的 AI 对话助手
// ============================================================
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Card,
  Input,
  Button,
  Typography,
  Space,
  Tag,
  Spin,
  Divider,
  List,
  Collapse,
  message,
} from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  BookOutlined,
  ClearOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { RAGAnswer, RAGCategory, RAGKnowledgeItem } from '../../api/ai';
import { ragChat, ragSearch, ragCategories, ragKnowledge } from '../../api/ai';

const { Text, Paragraph, Title } = Typography;
const { TextArea } = Input;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { id: number; title: string; category: string }[];
  timestamp: Date;
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<RAGCategory[]>([]);
  const [knowledgeItems, setKnowledgeItems] = useState<RAGKnowledgeItem[]>([]);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [searchResults, setSearchResults] = useState<RAGKnowledgeItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCategories();
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCategories = async () => {
    try {
      const res = await ragCategories();
      setCategories(res.data.categories);
    } catch {
      // 忽略
    }
  };

  const loadKnowledge = async () => {
    try {
      const res = await ragKnowledge();
      setKnowledgeItems(res.data.items);
    } catch {
      message.error('加载知识库失败');
    }
  };

  const handleSend = useCallback(async () => {
    const question = inputValue.trim();
    if (!question || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    // 创建占位 AI 消息
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMsg]);

    try {
      // 使用 fetch 实现 SSE 流式响应
      const token = localStorage.getItem('token');
      const response = await fetch('/api/rag/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error('请求失败');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('不支持流式响应');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullAnswer = '';
      let sources: RAGAnswer['sources'] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: token')) {
            // 下一个 data 行
          } else if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullAnswer += data.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMsgId ? { ...m, content: fullAnswer } : m
                  )
                );
              }
              if (data.sources) {
                sources = data.sources;
              }
            } catch {
              // ignore
            }
          } else if (line.startsWith('event: sources')) {
            // 下一个 data 行包含 sources
          } else if (line.startsWith('event: done')) {
            // 完成
          }
        }
      }

      // 最终更新
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId ? { ...m, content: fullAnswer, sources } : m
        )
      );
    } catch {
      // 流式失败，回退到同步请求
      try {
        const res = await ragChat({ question });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, content: res.data.answer, sources: res.data.sources }
              : m
          )
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, content: '抱歉，AI 服务暂时不可用，请稍后重试。' }
              : m
          )
        );
      }
    } finally {
      setLoading(false);
    }
  }, [inputValue, loading]);

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setSearchLoading(true);
    try {
      const res = await ragSearch(q, 5);
      setSearchResults(res.data.docs);
    } catch {
      message.error('检索失败');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  const quickQuestions = [
    '高血压老人日常如何护理？',
    '老人跌倒后应该怎么处理？',
    '如何申请居家养老服务补贴？',
    '广场舞锻炼有什么注意事项？',
    '老年人如何预防诈骗？',
  ];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', gap: 16 }}>
      {/* 左侧对话区 */}
      <Card
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
        title={
          <Space>
            <RobotOutlined />
            <span>AI 智能问答</span>
            <Tag color="blue">RAG 知识库</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<BookOutlined />}
              size="small"
              onClick={() => {
                setShowKnowledge(!showKnowledge);
                if (!showKnowledge) loadKnowledge();
              }}
            >
              知识库
            </Button>
            <Button icon={<ClearOutlined />} size="small" onClick={handleClear}>
              清空
            </Button>
          </Space>
        }
      >
        {/* 消息列表 */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <RobotOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
              <Title level={4}>您好！我是您的智能养老助手</Title>
              <Paragraph type="secondary">
                我可以解答养老健康、政策咨询、社区服务等问题
              </Paragraph>
              <Divider>试试这些问题</Divider>
              <Space wrap style={{ justifyContent: 'center' }}>
                {quickQuestions.map((q) => (
                  <Tag
                    key={q}
                    color="blue"
                    style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 13 }}
                    onClick={() => {
                      setInputValue(q);
                      setTimeout(() => handleSend(), 100);
                    }}
                  >
                    {q}
                  </Tag>
                ))}
              </Space>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 16,
                }}
              >
                <div style={{ maxWidth: '80%', display: 'flex', gap: 8 }}>
                  {msg.role === 'assistant' && (
                    <RobotOutlined style={{ fontSize: 24, color: '#1890ff', marginTop: 4 }} />
                  )}
                  <div>
                    <Card
                      size="small"
                      style={{
                        background: msg.role === 'user' ? '#e6f7ff' : '#f6ffed',
                        borderColor: msg.role === 'user' ? '#91d5ff' : '#b7eb8f',
                      }}
                    >
                      {msg.content ? (
                        <Text style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
                      ) : (
                        <Space>
                          <Spin size="small" />
                          <Text type="secondary">思考中...</Text>
                        </Space>
                      )}
                      {msg.sources && msg.sources.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            参考来源：
                          </Text>
                          {msg.sources.map((s) => (
                            <Tag key={s.id} color="green" style={{ marginTop: 4 }}>
                              {s.title}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </Card>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {msg.timestamp.toLocaleTimeString()}
                    </Text>
                  </div>
                  {msg.role === 'user' && (
                    <UserOutlined style={{ fontSize: 24, color: '#52c41a', marginTop: 4 }} />
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区 */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="输入您的问题，按 Enter 发送..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              disabled={loading}
              style={{ flex: 1 }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={loading}
              disabled={!inputValue.trim()}
            >
              发送
            </Button>
          </div>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Shift + Enter 换行 | 基于养老知识库的 RAG 智能问答
          </Text>
        </div>
      </Card>

      {/* 右侧知识库面板 */}
      {showKnowledge && (
        <Card
          title={
            <Space>
              <BookOutlined />
              <span>知识库</span>
            </Space>
          }
          style={{ width: 360, overflow: 'auto' }}
          bodyStyle={{ padding: 12 }}
          extra={
            <Button
              icon={<ReloadOutlined />}
              size="small"
              onClick={loadKnowledge}
            />
          }
        >
          {/* 搜索 */}
          <Input.Search
            placeholder="搜索知识库..."
            onSearch={handleSearch}
            loading={searchLoading}
            style={{ marginBottom: 12 }}
          />

          {/* 搜索结果显示 */}
          {searchResults.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <Text strong>搜索结果 ({searchResults.length})：</Text>
              <List
                size="small"
                dataSource={searchResults}
                renderItem={(item) => (
                  <List.Item>
                    <div>
                      <Text strong>{item.title}</Text>
                      <Tag color="blue" style={{ marginLeft: 8 }}>{item.category}</Tag>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.content.slice(0, 60)}...
                      </Text>
                    </div>
                  </List.Item>
                )}
              />
              <Button
                size="small"
                onClick={() => setSearchResults([])}
                style={{ marginTop: 4 }}
              >
                清除结果
              </Button>
              <Divider />
            </div>
          )}

          {/* 分类列表 */}
          <Text strong>知识分类：</Text>
          <Collapse
            ghost
            size="small"
            items={categories.map((cat) => ({
              key: cat.name,
              label: (
                <Space>
                  <span>{cat.name}</span>
                  <Tag>{cat.count}</Tag>
                </Space>
              ),
              children: (
                <List
                  size="small"
                  dataSource={knowledgeItems.filter((i) => i.category === cat.name)}
                  renderItem={(item) => (
                    <List.Item
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setInputValue(`请介绍一下${item.title}`);
                        handleSend();
                      }}
                    >
                      <Text style={{ fontSize: 13 }}>{item.title}</Text>
                    </List.Item>
                  )}
                />
              ),
            }))}
          />
        </Card>
      )}
    </div>
  );
}