import { Card, Row, Col, Typography, Tag, Divider } from 'antd';
import {
  CloudServerOutlined,
  HddOutlined,
  WifiOutlined,
  ApiOutlined,
  RobotOutlined,
  DatabaseOutlined,
  EyeOutlined,
  HeartOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  ClusterOutlined,
  InteractionOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const layers = [
  {
    title: '终端感知层',
    icon: <EyeOutlined style={{ fontSize: 28, color: '#1890ff' }} />,
    color: '#1890ff',
    bgColor: '#e6f7ff',
    borderColor: '#91d5ff',
    description: '通过各类物联网终端设备实时采集老年人健康数据、行为数据与环境数据，构建全维度感知网络。',
    features: [
      { icon: <HeartOutlined />, label: '健康监测', desc: '智能手环、血压计、血糖仪等可穿戴设备' },
      { icon: <WifiOutlined />, label: '环境感知', desc: '温湿度传感器、烟雾报警器、门窗磁感应' },
      { icon: <HddOutlined />, label: '行为采集', desc: '红外人体感应、智能摄像头、跌倒检测雷达' },
      { icon: <ApiOutlined />, label: '数据传输', desc: 'WiFi / BLE / Zigbee / NB-IoT 多协议接入' },
    ],
  },
  {
    title: '边缘计算层',
    icon: <ClusterOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
    color: '#52c41a',
    bgColor: '#f6ffed',
    borderColor: '#b7eb8f',
    description: '在边缘网关部署轻量级推理引擎，实现数据预处理、异常检测和实时告警，降低云端延迟。',
    features: [
      { icon: <ThunderboltOutlined />, label: '实时推理', desc: '边缘 AI 模型本地推理，毫秒级响应' },
      { icon: <SafetyOutlined />, label: '异常检测', desc: '跌倒识别、心率异常、离床检测等实时告警' },
      { icon: <DatabaseOutlined />, label: '数据清洗', desc: '数据去噪、压缩、聚合后上传云端' },
      { icon: <WifiOutlined />, label: '离线自治', desc: '网络中断时本地缓存与独立运行能力' },
    ],
  },
  {
    title: '云端平台层',
    icon: <CloudServerOutlined style={{ fontSize: 28, color: '#722ed1' }} />,
    color: '#722ed1',
    bgColor: '#f9f0ff',
    borderColor: '#d3adf7',
    description: '云端提供数据存储、业务逻辑处理、大数据分析和统一管理后台，支撑全链路智慧养老业务。',
    features: [
      { icon: <DatabaseOutlined />, label: '数据存储', desc: '时序数据库 + 关系型数据库混合存储架构' },
      { icon: <ApiOutlined />, label: '业务中台', desc: '老人档案、事件管理、巡检调度、健康管理' },
      { icon: <InteractionOutlined />, label: '数据分析', desc: '健康趋势分析、风险预测、群体画像' },
      { icon: <SafetyOutlined />, label: '安全管控', desc: 'OAuth2.0 认证、RBAC 权限、数据加密传输' },
    ],
  },
  {
    title: '大模型中枢',
    icon: <RobotOutlined style={{ fontSize: 28, color: '#fa541c' }} />,
    color: '#fa541c',
    bgColor: '#fff2e8',
    borderColor: '#ffbb96',
    description: '以大语言模型为核心，结合 RAG 检索增强生成与知识图谱，提供智能对话、健康咨询和个性推荐。',
    features: [
      { icon: <RobotOutlined />, label: '智能对话', desc: '基于 LLM 的语音/文字交互，陪伴聊天与健康咨询' },
      { icon: <DatabaseOutlined />, label: 'RAG 检索', desc: '检索增强生成，精准回答养老政策与健康知识' },
      { icon: <ClusterOutlined />, label: '知识图谱', desc: '中医体质、慢性病、药品等专业领域知识图谱' },
      { icon: <ThunderboltOutlined />, label: '个性化推荐', desc: '基于用户画像的饮食、运动、养生方案推荐' },
    ],
  },
];

const arrowStyle = (color: string): React.CSSProperties => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '8px 0',
  color,
  fontSize: 24,
});

export default function ArchitecturePage() {
  return (
    <Card title="端边云架构">
      <Paragraph
        type="secondary"
        style={{ textAlign: 'center', marginBottom: 32, fontSize: 15 }}
      >
        银护智能平台采用"端-边-云-智"四层架构设计，实现从终端感知到智能决策的全链路闭环
      </Paragraph>

      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {layers.map((layer, index) => (
          <div key={layer.title}>
            <Card
              style={{
                borderColor: layer.borderColor,
                borderWidth: 2,
                background: layer.bgColor,
              }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {layer.icon}
                  <div>
                    <Title level={4} style={{ margin: 0, color: layer.color }}>
                      {layer.title}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Layer {index + 1}
                    </Text>
                  </div>
                </div>
              }
            >
              <Paragraph style={{ fontSize: 14, marginBottom: 16 }}>
                {layer.description}
              </Paragraph>
              <Row gutter={[16, 16]}>
                {layer.features.map((feat) => (
                  <Col span={6} key={feat.label}>
                    <Card
                      size="small"
                      style={{
                        textAlign: 'center',
                        borderColor: layer.borderColor,
                      }}
                    >
                      <div style={{ fontSize: 24, color: layer.color, marginBottom: 8 }}>
                        {feat.icon}
                      </div>
                      <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                        {feat.label}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {feat.desc}
                      </Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>

            {index < layers.length - 1 && (
              <>
                <div style={arrowStyle(layers[index + 1].color)}>
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '16px solid transparent',
                      borderRight: '16px solid transparent',
                      borderTop: `20px solid ${layers[index].color}`,
                      marginRight: 8,
                    }}
                  />
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '16px solid transparent',
                      borderRight: '16px solid transparent',
                      borderTop: `20px solid ${layers[index].color}`,
                    }}
                  />
                  <Divider
                    type="vertical"
                    style={{
                      height: 24,
                      borderColor: layers[index].color,
                      borderWidth: 2,
                      margin: '0 12px',
                    }}
                  />
                  <Text style={{ color: layers[index].color, fontSize: 13, fontWeight: 500 }}>
                    数据流转 ↑
                  </Text>
                  <Divider
                    type="vertical"
                    style={{
                      height: 24,
                      borderColor: layers[index].color,
                      borderWidth: 2,
                      margin: '0 12px',
                    }}
                  />
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '16px solid transparent',
                      borderRight: '16px solid transparent',
                      borderBottom: `20px solid ${layers[index + 1].color}`,
                      marginRight: 8,
                    }}
                  />
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '16px solid transparent',
                      borderRight: '16px solid transparent',
                      borderBottom: `20px solid ${layers[index + 1].color}`,
                    }}
                  />
                </div>
                <div style={{ textAlign: 'center', padding: '4px 0 16px' }}>
                  <Tag color={layers[index].color}>数据上报</Tag>
                  <Tag color={layers[index + 1].color}>指令下发</Tag>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Text strong style={{ color: '#1890ff' }}>数据流向</Text>
            <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
              终端采集 → 边缘处理 → 云端存储 → 大模型分析
            </Paragraph>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Text strong style={{ color: '#52c41a' }}>响应延迟</Text>
            <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
              边缘层 &lt;100ms / 云端层 &lt;500ms / 大模型 &lt;3s
            </Paragraph>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Text strong style={{ color: '#722ed1' }}>技术栈</Text>
            <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
              Spring Boot / React / MySQL / Redis / InfluxDB
            </Paragraph>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Text strong style={{ color: '#fa541c' }}>AI 能力</Text>
            <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
              LLM / RAG / 知识图谱 / 边缘推理
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </Card>
  );
}