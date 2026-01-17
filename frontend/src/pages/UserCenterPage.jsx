import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import './UserCenterPage.css';

const UserCenterPage = () => {
  const location = useLocation();

  return (
    <div className="user-center-page">
      <Header />
      <Navbar />
      <div className="center-container">
        <aside className="sidebar">
            <h3>个人中心</h3>
            <nav>
                <ul>
                    <li className={location.pathname === '/center/personal' ? 'active' : ''}>
                        <Link to="/center/personal">查看个人信息</Link>
                    </li>
                    <li className={location.pathname === '/center/passengers' ? 'active' : ''}>
                        <Link to="/center/passengers">乘车人管理</Link>
                    </li>
                </ul>
            </nav>
            <h3>订单中心</h3>
            <nav>
                <ul>
                    <li className={location.pathname === '/center/orders' ? 'active' : ''}>
                        <Link to="/center/orders">火车票订单</Link>
                    </li>
                </ul>
            </nav>
        </aside>
        <main className="content">
            <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserCenterPage;
