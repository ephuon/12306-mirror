
import React, { useState, useEffect } from 'react';
import './TicketQueryForm.css';
import StationSelector from './StationSelector';
import DatePicker from './DatePicker';

const TicketQueryForm = ({ initialValues = {}, onSearch }) => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [isStudent, setIsStudent] = useState(false);
  const [isHighSpeed, setIsHighSpeed] = useState(false);

  useEffect(() => {
    if (initialValues.from) setFrom(initialValues.from);
    if (initialValues.to) setTo(initialValues.to);
    if (initialValues.date) setDate(initialValues.date);
    if (initialValues.isStudent) setIsStudent(initialValues.isStudent);
    if (initialValues.isHighSpeed) setIsHighSpeed(initialValues.isHighSpeed);
  }, [initialValues]);

  const handleSwap = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch({ from, to, date, isStudent, isHighSpeed });
    }
  };

  return (
    <div className="ticket-query-form">
      <div className="query-row">
        <div className="input-group">
          <StationSelector 
            label="出发地" 
            placeholder="出发地" 
            value={from}
            onChange={setFrom}
          />
        </div>
        <button className="swap-btn" onClick={handleSwap} aria-label="swap stations">↔</button>
        <div className="input-group">
          <StationSelector 
            label="到达地" 
            placeholder="到达地" 
            value={to}
            onChange={setTo}
          />
        </div>
        <div className="input-group">
          <DatePicker 
            label="出发日期" 
            placeholder="yyyy-mm-dd" 
            value={date}
            onChange={setDate}
          />
        </div>
        <button className="query-btn" onClick={handleSearch}>查询</button>
      </div>
      <div className="options-row">
        <label>
          <input 
            type="checkbox" 
            checked={isStudent} 
            onChange={(e) => setIsStudent(e.target.checked)} 
          /> 学生票
        </label>
        <label>
          <input 
            type="checkbox" 
            checked={isHighSpeed} 
            onChange={(e) => setIsHighSpeed(e.target.checked)} 
          /> 高铁/动车
        </label>
      </div>
    </div>
  );
};

export default TicketQueryForm;
