import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  AlertOutlined,
  HddOutlined,
  CheckCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  RobotOutlined,
  CustomerServiceOutlined,
  TrophyOutlined,
  EnvironmentOutlined,
  HeartOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  ClusterOutlined,
  ReadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuthStore, useAppStore } from '../../stores';
import './Layout.css';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '驾驶舱' },
  { key: '/elder', icon: <UserOutlined />, label: '老人档案' },
  { key: '/event', icon: <AlertOutlined />, label: '预警事件' },
  { key: '/device', icon: <HddOutlined />, label: '设备管理' },
  { key: '/patrol', icon: <CheckCircleOutlined />, label: '巡检记录' },
  { type: 'divider' as const },
  { key: '/health', icon: <HeartOutlined />, label: '健康档案' },
  { key: '/constitution', icon: <ExperimentOutlined />, label: '中医体质' },
  { key: '/ai-chat', icon: <RobotOutlined />, label: '智能问答' },
  { key: '/music', icon: <CustomerServiceOutlined />, label: '音乐陪伴' },
  { key: '/square', icon: <TrophyOutlined />, label: '银龄广场' },
  { type: 'divider' as const },
  { key: '/reading', icon: <ReadOutlined />, label: '经典阅读' },
  { key: '/knowledge-base', icon: <SafetyCertificateOutlined />, label: '知识库' },
  { key: '/architecture', icon: <ClusterOutlined />, label: '端边云架构' },
  { key: '/amap', icon: <EnvironmentOutlined />, label: '高德地图' },
  { type: 'divider' as const },
  { key: '/system-config', icon: <SettingOutlined />, label: '大模型配置' },
];

export default function LayoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { collapsed, setCollapsed } = useAppStore();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'profile', label: '个人信息' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        style={{ borderRight: '1px solid #f0f0f0' }}
      >
        <div className="logo">
          <img src="/favicon.svg" alt="logo" style={{ width: 32, height: 32 }} />
          {!collapsed && <span className="logo-text">乐龄守护</span>}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header className="header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16 }}
          />
          <div className="header-right">
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="user-info">
                <Avatar icon={<UserOutlined />} />
                <span className="user-name">{user?.realName || '网格员'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}