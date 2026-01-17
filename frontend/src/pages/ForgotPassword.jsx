import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    realName: '',
    idCard: '',
    phone: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleIdentityVerify = async (e) => {
    e.preventDefault();
    try {
        const res = await apiClient.post('/forgot-password/verify-user', formData);
        if (res.data.success) {
            // Trigger send code immediately after verify
            const sendRes = await apiClient.post('/forgot-password/send-code', { phone: formData.phone });
            if (sendRes.data.success) {
                setStep(2);
                setError('');
            }
        }
    } catch (err) {
        setError(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleCodeVerify = async (e) => {
    e.preventDefault();
    try {
        const res = await apiClient.post('/forgot-password/verify-code', { phone: formData.phone, code: formData.code });
        if (res.data.success) {
            setStep(3);
            setError('');
        }
    } catch (err) {
        setError(err.response?.data?.message || 'Invalid code');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
        setError('两次输入的密码不一致');
        return;
    }
    if (formData.newPassword.length < 6) {
        setError('密码必须为6-20位字符');
        return;
    }
    try {
        const res = await apiClient.post('/forgot-password/reset', { username: formData.username, newPassword: formData.newPassword });
        if (res.data.success) {
            // Redirect to login
            window.location.href = '/login';
        }
    } catch (err) {
        setError(err.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="fp-header">
        <h1>找回密码</h1>
      </div>
      <div className="fp-content">
        {step === 1 && (
            <form onSubmit={handleIdentityVerify}>
                <h2>身份核验</h2>
                <input name="username" placeholder="用户名" value={formData.username} onChange={handleChange} />
                <input name="realName" placeholder="姓名" value={formData.realName} onChange={handleChange} />
                <input name="idCard" placeholder="证件号码" value={formData.idCard} onChange={handleChange} />
                <input name="phone" placeholder="手机号" value={formData.phone} onChange={handleChange} />
                <button type="submit">下一步</button>
            </form>
        )}
        {step === 2 && (
            <form onSubmit={handleCodeVerify}>
                <h2>短信验证</h2>
                <p>验证码已发送至 {formData.phone}</p>
                <input name="code" placeholder="验证码" value={formData.code} onChange={handleChange} />
                <button type="submit">验证</button>
            </form>
        )}
        {step === 3 && (
            <form onSubmit={handleResetPassword}>
                <h2>重置密码</h2>
                <input name="newPassword" type="password" placeholder="新密码" value={formData.newPassword} onChange={handleChange} />
                <input name="confirmPassword" type="password" placeholder="确认密码" value={formData.confirmPassword} onChange={handleChange} />
                <button type="submit">确定</button>
            </form>
        )}
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default ForgotPassword;
