import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-container">
          <Link to="/">
            <img src={logo} alt="logo" className="logo" />
          </Link>
        </div>
        <div className="header-right">
          <div className="search-bar">
            <input type="text" placeholder="搜索车票/餐饮/常旅客/相关规章" />
            <button>🔍</button>
          </div>
          <div className="auth-links">
            <Link to="/login">登录</Link>
            <Link to="/register">注册</Link>
            <Link to="/my">我的12306</Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
