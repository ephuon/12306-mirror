import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StationSelector from './StationSelector';
import DatePicker from './DatePicker';
import './QuickSearchPanel.css';

const QuickSearchPanel = () => {
  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');
  const [date, setDate] = useState('');

  return (
    <div className="search-panel">
      <div className="panel-tabs">
        <span className="active">车票</span>
        <span>候补</span>
        <span>常用查询</span>
      </div>
      <div className="panel-body">
        <div className="route-inputs">
          <div className="input-group">
            <StationSelector 
              label="出发地" 
              placeholder="简拼/全拼/汉字" 
              value={departure}
              onChange={setDeparture}
            />
          </div>
          <div className="input-group">
            <StationSelector 
              label="到达地" 
              placeholder="简拼/全拼/汉字" 
              value={arrival}
              onChange={setArrival}
            />
          </div>
          <div className="input-group">
            <DatePicker 
              label="出发日期" 
              placeholder="选择日期" 
              value={date}
              onChange={setDate}
            />
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
  );
};

export default QuickSearchPanel;
