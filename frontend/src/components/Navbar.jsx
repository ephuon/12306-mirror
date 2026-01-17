import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="nav-bar">
      <div className="nav-content">
        <ul className="nav-list">
          <li className="active"><Link to="/">首页</Link></li>
          <li className="nav-item dropdown">
            <Link to="/ticket" className="dropdown-toggle">车票</Link>
            <ul className="dropdown-menu">
              <li><Link to="/search?type=single">单程</Link></li>
              <li><Link to="/search?type=round">往返</Link></li>
              <li><Link to="/search?type=transfer">接续换乘</Link></li>
              <li><Link to="/search?type=refund">退票</Link></li>
              <li><Link to="/search?type=change">改签</Link></li>
            </ul>
          </li>
          <li><Link to="/group">团购服务</Link></li>
          <li><Link to="/membership">会员服务</Link></li>
          <li><Link to="/station">站车服务</Link></li>
          <li><Link to="/business">商旅服务</Link></li>
          <li><Link to="/guide">出行指南</Link></li>
          <li><Link to="/info">信息查询</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
