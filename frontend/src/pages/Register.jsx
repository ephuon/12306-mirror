import React, { useState } from 'react';
import './Register.css';
import apiClient from '../api';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    real_name: '',
    id_type: '居民身份证',
    id_card: '',
    email: '',
    phone_prefix: '+86',
    phone: '',
    type: '成人',
    agreed: false
  });

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData({ ...formData, [name]: val });

    if (name === 'password') {
       checkPasswordStrength(val);
    }
    // Clear error when typing
    if (errors[name]) {
        setErrors({ ...errors, [name]: '' });
    }
  };

  const checkPasswordStrength = (pwd) => {
      if (pwd.length < 6) {
          setPasswordStrength('');
          return;
      }
      // Simple logic: length > 8 and mixed chars = strong
      if (pwd.length > 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) {
          setPasswordStrength('强');
      } else {
          setPasswordStrength('弱');
      }
  };

  const validate = () => {
      const newErrors = {};
      // Username: letter start, 6-30
      if (!/^[a-zA-Z][a-zA-Z0-9_]{5,29}$/.test(formData.username)) {
          newErrors.username = '用户名必须以字母开头，长度6-30位';
      }
      
      // Password
      if (formData.password.length < 6) {
          newErrors.password = '密码长度不能少于6位';
      }

      // Confirm Password
      if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = '两次输入的密码不一致';
      }

      // Real Name
      if (!formData.real_name) {
          newErrors.real_name = '请输入姓名';
      }

      // ID Card
      if (!formData.id_card) {
          newErrors.id_card = '请输入证件号码';
      }

      // Phone
      if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
          newErrors.phone = '请输入正确的手机号码';
      }

      // Agreed
      if (!formData.agreed) {
          newErrors.agreed = '请先阅读并同意服务条款';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
      if (!validate()) return;

      try {
          const res = await apiClient.post('/register', formData);
          
          if (res.data.success) {
              alert('注册成功');
              window.location.href = '/login'; 
          }
      } catch (err) {
          if (err.response && err.response.data) {
               if (err.response.data.message === 'Username already exists') {
                   setErrors(prev => ({ ...prev, username: '用户名已被使用，请更换用户名' }));
               } else {
                   alert(err.response.data.message);
               }
          } else {
              alert('注册失败，请稍后重试');
          }
      }
  };

  return (
    <div className="register-container">
      <h1 className="register-title">用户注册</h1>
      <form>
        {/* Username */}
        <div className="form-group">
          <label className="form-label"><span className="required">*</span>用户名：</label>
          <div style={{flex:1}}>
            <input 
                type="text" 
                name="username"
                className={`form-input ${errors.username ? 'error' : ''}`} 
                placeholder="字母开头，6-30位" 
                value={formData.username}
                onChange={handleChange}
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="form-label"><span className="required">*</span>登录密码：</label>
          <div style={{flex:1}}>
            <input 
                type="password" 
                name="password"
                className="form-input" 
                placeholder="6-20位字符" 
                value={formData.password}
                onChange={handleChange}
            />
            {passwordStrength && (
                <span className={`password-strength ${passwordStrength === '强' ? 'strength-strong' : 'strength-weak'}`}>
                    强度：{passwordStrength}
                </span>
            )}
             {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
        </div>

        {/* Confirm Password */}
        <div className="form-group">
          <label className="form-label"><span className="required">*</span>确认密码：</label>
           <div style={{flex:1}}>
            <input 
                type="password" 
                name="confirmPassword"
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`} 
                placeholder="再次输入密码" 
                value={formData.confirmPassword}
                onChange={handleChange}
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>
        </div>

        {/* Name */}
        <div className="form-group">
          <label className="form-label"><span className="required">*</span>姓名：</label>
          <div style={{flex:1}}>
            <input 
                type="text" 
                name="real_name"
                className="form-input" 
                placeholder="请输入姓名" 
                value={formData.real_name}
                onChange={handleChange}
            />
            {errors.real_name && <span className="error-message">{errors.real_name}</span>}
          </div>
        </div>

        {/* ID Type */}
        <div className="form-group">
          <label className="form-label"><span className="required">*</span>证件类型：</label>
          <select className="form-select" name="id_type" value={formData.id_type} onChange={handleChange}>
            <option value="居民身份证">居民身份证</option>
            <option value="护照">护照</option>
            <option value="港澳居民来往内地通行证">港澳居民来往内地通行证</option>
            <option value="台湾居民来往大陆通行证">台湾居民来往大陆通行证</option>
          </select>
        </div>

        {/* ID Card */}
        <div className="form-group">
          <label className="form-label"><span className="required">*</span>证件号码：</label>
          <div style={{flex:1}}>
            <input 
                type="text" 
                name="id_card"
                className="form-input" 
                placeholder="请输入证件号码" 
                value={formData.id_card}
                onChange={handleChange}
            />
            {errors.id_card && <span className="error-message">{errors.id_card}</span>}
          </div>
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="form-label">邮箱：</label>
          <input 
            type="email" 
            name="email"
            className="form-input" 
            placeholder="请填写正确的邮箱地址" 
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        {/* Phone */}
        <div className="form-group">
          <label className="form-label"><span className="required">*</span>手机号码：</label>
          <select className="form-select" style={{ width: '80px', marginRight: '10px', flex: 'none' }}>
            <option value="+86">+86</option>
          </select>
          <div style={{flex:1}}>
            <input 
                type="text" 
                name="phone"
                className={`form-input ${errors.phone ? 'error' : ''}`} 
                placeholder="请输入手机号码" 
                value={formData.phone}
                onChange={handleChange}
            />
             {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>
        </div>

        {/* Passenger Type */}
        <div className="form-group">
          <label className="form-label"><span className="required">*</span>旅客类型：</label>
          <select className="form-select" name="type" value={formData.type} onChange={handleChange}>
            <option value="成人">成人</option>
            <option value="儿童">儿童</option>
            <option value="学生">学生</option>
            <option value="残疾军人">残疾军人</option>
          </select>
        </div>

        {/* Agreement */}
        <div className="checkbox-group">
          <label>
            <input 
                type="checkbox" 
                name="agreed"
                checked={formData.agreed}
                onChange={handleChange}
            /> 我已阅读并同意《用户注册协议》
          </label>
           {errors.agreed && <div className="error-message" style={{textAlign:'center'}}>{errors.agreed}</div>}
        </div>

        <button type="button" className="submit-btn" onClick={handleSubmit}>下一步</button>
      </form>
    </div>
  );
};

export default Register;
