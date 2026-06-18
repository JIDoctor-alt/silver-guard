import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import { useAuthStore } from '../stores';

// 懒加载页面组件
const LoginPage = lazy(() => import('../pages/Login'));
const LayoutPage = lazy(() => import('../pages/Layout'));
const DashboardPage = lazy(() => import('../pages/Dashboard'));
const ElderListPage = lazy(() => import('../pages/Elder/List'));
const ElderDetailPage = lazy(() => import('../pages/Elder/Detail'));
const EventListPage = lazy(() => import('../pages/Event/List'));
const EventDetailPage = lazy(() => import('../pages/Event/Detail'));
const DeviceListPage = lazy(() => import('../pages/Device/List'));
const PatrolListPage = lazy(() => import('../pages/Patrol/List'));
<<<<<<< HEAD
const MusicCreationPage = lazy(() => import('../pages/MusicCreation'));
const ChatPage = lazy(() => import('../pages/Chat'));
=======
const AIChatPage = lazy(() => import('../pages/AIChat'));
const MusicPage = lazy(() => import('../pages/Music'));
>>>>>>> 8a79316 (feat: SSE/RAG/音乐智能体 + 提示词配置系统)

// 路由守卫：需要登录
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isLogin } = useAuthStore();
  return isLogin ? children : <Navigate to="/login" replace />;
}

// 路由守卫：已登录跳转首页
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isLogin } = useAuthStore();
  return isLogin ? <Navigate to="/" replace /> : children;
}

export default function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spin size="large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }} />}>
        <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          
          {/* 需要登录的路由 */}
          <Route path="/" element={<PrivateRoute><LayoutPage /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="elder" element={<ElderListPage />} />
            <Route path="elder/:id" element={<ElderDetailPage />} />
            <Route path="event" element={<EventListPage />} />
            <Route path="event/:id" element={<EventDetailPage />} />
            <Route path="device" element={<DeviceListPage />} />
            <Route path="patrol" element={<PatrolListPage />} />
<<<<<<< HEAD
            <Route path="music" element={<MusicCreationPage />} />
            <Route path="chat" element={<ChatPage />} />
=======
            <Route path="ai-chat" element={<AIChatPage />} />
            <Route path="music" element={<MusicPage />} />
>>>>>>> 8a79316 (feat: SSE/RAG/音乐智能体 + 提示词配置系统)
          </Route>
          
          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}