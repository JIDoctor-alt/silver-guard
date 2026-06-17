import { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login } from '../../api';
import { useAuthStore } from '../../stores';
import './Login.css';

interface LoginForm {
  phone: string;
  password: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();

  const handleSubmit = async (values: LoginForm) => {
    setLoading(true);
    try {
      const result = await login(values);
      if (result.code === 200 && result.data) {
        setToken(result.data.token);
        setUser(result.data.user);
        message.success('登录成功');
        navigate('/');
      } else {
        message.error(result.message || '登录失败');
      }
    } catch (error: unknown) {
      const err = error as Error;
      message.error(err.message || '登录失败，请检查网络');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" title="智护长者 · 管理后台">
        <Form onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="手机号" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              登录
            </Button>
          </Form.Item>
        </Form>
        <div className="login-footer">
          <p>测试账号：13800000001 / password123</p>
        </div>
      </Card>
    </div>
  );
}