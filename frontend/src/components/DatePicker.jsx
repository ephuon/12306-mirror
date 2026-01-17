import React, { useState, useEffect, useRef } from 'react';
import './DatePicker.css';

const DatePicker = ({ label, placeholder, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const today = new Date();
  
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateMonthData = (year, month) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
    const days = [];
    
    // Empty slots for alignment
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const renderMonth = (offset) => {
    const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const days = generateMonthData(year, month);
    
    return (
      <div className="calendar-month" key={offset}>
        <div className="month-header">
          {year}年{month + 1}月
        </div>
        <div className="week-header">
          <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
        </div>
        <div className="days-grid">
          {days.map((day, idx) => (
            <div key={idx} className="day-cell">
              {day && (
                <button 
                  className="day-btn"
                  onClick={() => {
                    const yearStr = day.getFullYear();
                    const monthStr = String(day.getMonth() + 1).padStart(2, '0');
                    const dateStr = String(day.getDate()).padStart(2, '0');
                    onChange(`${yearStr}-${monthStr}-${dateStr}`);
                    setIsOpen(false);
                  }}
                >
                  {day.getDate()}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="date-picker-container" ref={containerRef}>
      <label>{label}</label>
      <input 
        type="text" 
        placeholder={placeholder} 
        value={value} 
        onFocus={() => setIsOpen(true)}
        readOnly
      />
      {isOpen && (
        <div className="date-popup">
          {renderMonth(0)}
          {renderMonth(1)}
        </div>
      )}
    </div>
  );
};

export default DatePicker;
