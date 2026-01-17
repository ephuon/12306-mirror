import React from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = React.useState({
    username: '',
    password: ''
  });
  const [error, setError] = React.useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username) {
        setError('请输入用户名');
        return;
    }
    if (!formData.password) {
        setError('请输入密码');
        return;
    }

    try {
        const res = await apiClient.post('/login', formData);
        
        if (res.data.success) {
            localStorage.setItem('token', res.data.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.data.user));
            window.location.href = '/';
        }
    } catch (err) {
        console.error('API Error:', err);
        if (err.response && err.response.data) {
             setError(err.response.data.message === 'Invalid username or password' ? '用户名或密码错误' : err.response.data.message);
        } else {
            setError('登录失败，请稍后重试');
        }
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h1>用户登录</h1>
      </div>
      <div className="login-content">
        <div className="login-form-container">
            <div className="login-tabs">
                <div className="tab active">账号登录</div>
                <div className="tab">扫码登录</div>
            </div>
            <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <input 
                        type="text" 
                        placeholder="用户名/邮箱/手机号" 
                        name="username" 
                        value={formData.username}
                        onChange={handleChange}
                        className={error && !formData.username ? 'error' : ''}
                    />
                </div>
                <div className="form-group">
                    <input 
                        type="password" 
                        placeholder="密码" 
                        name="password" 
                        value={formData.password}
                        onChange={handleChange}
                        className={error && !formData.password ? 'error' : ''}
                    />
                </div>
                {error && <div className="error-message" style={{color: 'red', marginBottom: '10px'}}>{error}</div>}
                <div className="form-actions">
                    <button type="submit" className="btn-login">立即登录</button>
                </div>
                <div className="form-footer">
                    <Link to="/register">注册12306账号</Link>
                    <Link to="/forgot-password">忘记密码？</Link>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
