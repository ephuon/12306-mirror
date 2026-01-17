import React from 'react';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import './SearchResultPage.css';

const SearchResultPage = () => {
  return (
    <div className="search-result-page">
      <Header />
      <Navbar />
      <main className="search-content">
        <div className="container">
          <h1>车次列表</h1>
          <div className="result-area">
            {/* Ticket List Placeholder */}
            <p>查询结果加载中...</p>
          </div>
        </div>
      </main>
      <footer className="footer">
        <p>© 2024 12306 Demo System</p>
      </footer>
    </div>
  );
};

export default SearchResultPage;
