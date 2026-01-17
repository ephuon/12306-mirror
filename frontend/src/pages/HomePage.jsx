import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-container">
            <img src={logo} alt="logo" className="logo" />
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

      {/* Navigation */}
      <nav className="nav-bar">
        <div className="nav-content">
          <ul className="nav-list">
            <li className="active"><Link to="/">首页</Link></li>
            <li><Link to="/ticket">车票</Link></li>
            <li><Link to="/group">团购服务</Link></li>
            <li><Link to="/membership">会员服务</Link></li>
            <li><Link to="/station">站车服务</Link></li>
            <li><Link to="/business">商旅服务</Link></li>
            <li><Link to="/guide">出行指南</Link></li>
            <li><Link to="/info">信息查询</Link></li>
          </ul>
        </div>
      </nav>

      {/* Main Banner & Search Panel */}
      <main className="main-banner">
        <div className="banner-content">
          {/* Search Panel */}
          <div className="search-panel">
            <div className="panel-tabs">
              <span className="active">车票</span>
              <span>候补</span>
              <span>常用查询</span>
            </div>
            <div className="panel-body">
              <div className="route-inputs">
                <div className="input-group">
                  <label>出发地</label>
                  <input type="text" placeholder="简拼/全拼/汉字" />
                </div>
                <div className="input-group">
                  <label>到达地</label>
                  <input type="text" placeholder="简拼/全拼/汉字" />
                </div>
                <div className="input-group">
                  <label>出发日期</label>
                  <input type="text" placeholder="2023-01-01" />
                </div>
              </div>
              <div className="options">
                <label><input type="checkbox" /> 学生</label>
                <label><input type="checkbox" /> 高铁/动车</label>
              </div>
              <button className="search-btn">查询</button>
            </div>
            <div className="panel-footer">
              <Link to="/query">车票查询</Link>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer Placeholder */}
      <footer className="footer">
        <p>© 2024 12306 Demo System</p>
      </footer>
    </div>
  );
};

export default HomePage;
