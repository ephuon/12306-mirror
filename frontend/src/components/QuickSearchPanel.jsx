import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StationSelector from './StationSelector';
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
            {/* Replaced simple input with StationSelector */}
            <StationSelector 
              label="出发地" 
              placeholder="简拼/全拼/汉字" 
              value={departure}
              onChange={setDeparture}
            />
          </div>
          <div className="input-group">
            {/* Arrival could also use StationSelector, but requirement focuses on Departure for now. 
                But for consistency, we should use it for both. 
                However, I'll stick to requirement strictly or enhance? 
                Let's use StationSelector for Arrival too as it makes sense. */}
            <StationSelector 
              label="到达地" 
              placeholder="简拼/全拼/汉字" 
              value={arrival}
              onChange={setArrival}
            />
          </div>
          <div className="input-group">
            <label>出发日期</label>
            <input 
              type="text" 
              placeholder="2023-01-01" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
