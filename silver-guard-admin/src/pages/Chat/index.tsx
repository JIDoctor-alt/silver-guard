/**
 * ============================================================
 * 乐龄守护 · RAG 智能问答页面
 * 支持：实时聊天、SSE 流式响应、文档检索、知识库管理
 * ============================================================
 */

import { useState, useRef, useEffect } from 'react';
import { Button, Input, message, Avatar, Card, Tag, Divider, Spin } from 'antd';
import { SendOutlined, FileTextOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons';
import type { ChatMessage } from '../../api/chat';
import { streamMessage, searchDocuments, addDocument } from '../../api/chat';

const { TextArea } = Input;

const initialMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: '你好！我是乐龄守护智能助手，专业的社区养老服务顾问。\n\n我可以帮您解答以下问题：\n• 社区养老服务规范\n• 智能设备使用指南\n• 老人健康护理知识\n• 巡检工作流程\n• 预警事件处理规范\n\n请输入您的问题...',
    timestamp: new Date().toISOString(),
    sources: [],
    isMock: true,
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ title: string; snippet: string }[]>([]);
  const [showDocumentPanel, setShowDocumentPanel] = useState(false);
  const [newDocument, setNewDocument] = useState({ title: '', content: '' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const assistantMessageId = `msg_${Date.now()}_assistant`;
    setMessages(prev => [...prev, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      sources: [],
      isMock: true,
    }]);

    let currentContent = '';

    streamMessage(
      inputValue.trim(),
      (chunk) => {
        currentContent += chunk;
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: currentContent }
            : msg
        ));
      },
      (result) => {
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: currentContent, sources: result.sources, isMock: result.isMock }
            : msg
        ));
        setIsLoading(false);
      }
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const results = await searchDocuments(searchQuery.trim());
      setSearchResults(results);
    } catch (error) {
      message.error('搜索失败');
    }
  };

  const handleAddDocument = async () => {
    if (!newDocument.title.trim() || !newDocument.content.trim()) {
      message.warning('请填写标题和内容');
      return;
    }

    try {
      await addDocument(newDocument.title.trim(), newDocument.content.trim());
      message.success('文档添加成功');
      setNewDocument({ title: '', content: '' });
      setShowDocumentPanel(false);
    } catch (error) {
      message.error('添加失败');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', gap: 20, padding: 20 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Card title="智能问答" style={{ marginBottom: 16 }}>
          <div style={{ height: '500px', overflowY: 'auto', marginBottom: 16 }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', gap: 12, marginBottom: 16, padding: 12, borderRadius: 8, backgroundColor: msg.role === 'user' ? '#f0f5ff' : '#fafafa' }}>
                <Avatar size={40} icon={msg.role === 'user' ? null : <FileTextOutlined />}>
                  {msg.role === 'user' ? '我' : 'AI'}
                </Avatar>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                    {msg.role === 'user' ? '我' : '乐龄守护助手'}
                    {msg.isMock && <Tag color="default" style={{ marginLeft: 8, fontSize: 10 }}>模拟模式</Tag>}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {msg.content || <Spin size="small" />}
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: '#999' }}>来源：</span>
                      {msg.sources.map((source, index) => (
                        <Tag key={index} color="blue" style={{ fontSize: 10 }}>{source}</Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="请输入您的问题，支持养老服务、设备使用、健康护理等..."
              rows={2}
              style={{ flex: 1 }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={isLoading}
              disabled={!inputValue.trim()}
            >
              发送
            </Button>
          </div>
        </Card>

        <Card title="文档检索" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索知识库..."
              prefix={<SearchOutlined />}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button type="primary" onClick={handleSearch}>搜索</Button>
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {searchResults.length > 0 ? (
              searchResults.map((result, index) => (
                <div key={index} style={{ padding: 12, borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }} onClick={() => {
                  setInputValue(result.title + ' ' + result.snippet);
                }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{result.title}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>{result.snippet}</div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                输入关键词搜索知识库内容
              </div>
            )}
          </div>
        </Card>
      </div>

      <div style={{ width: '360px' }}>
        <Card
          title="知识库"
          extra={<Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => setShowDocumentPanel(!showDocumentPanel)}>
            添加文档
          </Button>}
        >
          {showDocumentPanel ? (
            <div>
              <Input
                value={newDocument.title}
                onChange={(e) => setNewDocument(prev => ({ ...prev, title: e.target.value }))}
                placeholder="文档标题"
                style={{ marginBottom: 12 }}
              />
              <TextArea
                value={newDocument.content}
                onChange={(e) => setNewDocument(prev => ({ ...prev, content: e.target.value }))}
                placeholder="文档内容"
                rows={4}
                style={{ marginBottom: 12 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <Button type="primary" onClick={handleAddDocument}>保存</Button>
                <Button onClick={() => setShowDocumentPanel(false)}>取消</Button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 12 }}>
                <Divider style={{ margin: '8px 0' }} orientation="left">预置知识库</Divider>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { title: '社区养老服务规范', tags: ['服务', '规范'] },
                    { title: '智能设备使用指南', tags: ['设备', '指南'] },
                    { title: '老人健康护理知识', tags: ['健康', '护理'] },
                    { title: '巡检工作流程', tags: ['巡检', '流程'] },
                    { title: '预警事件处理规范', tags: ['预警', '处理'] },
                  ].map((item, index) => (
                    <div key={index} style={{ padding: 10, borderRadius: 6, backgroundColor: '#fafafa', cursor: 'pointer' }} onClick={() => {
                      setInputValue(`请介绍一下${item.title}`);
                    }}>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.title}</div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {item.tags.map((tag, i) => (
                          <Tag key={i} color="default" style={{ fontSize: 10 }}>{tag}</Tag>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Divider style={{ margin: '8px 0' }} orientation="left">功能说明</Divider>
                <ul style={{ fontSize: 13, color: '#666', paddingLeft: 20 }}>
                  <li>支持实时流式回答</li>
                  <li>基于知识库精准检索</li>
                  <li>支持自定义文档上传</li>
                  <li>SSE 实时消息推送</li>
                </ul>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
