import React from 'react';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import QuickSearchPanel from '../components/QuickSearchPanel';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      {/* Header */}
      <Header />

      {/* Navigation */}
      <Navbar />

      {/* Main Banner & Search Panel */}
      <main className="main-banner">
        <div className="banner-content">
          {/* Search Panel */}
          <QuickSearchPanel />
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
