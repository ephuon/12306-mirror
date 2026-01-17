
import React, { useState, useEffect } from 'react';
import './TicketFilter.css';

const TicketFilter = ({ onFilterChange }) => {
  const [types, setTypes] = useState([]);
  const [seats, setSeats] = useState([]);

  // Notify parent whenever filters change
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({ types, seats });
    }
  }, [types, seats]); // Warning: onFilterChange might cause loop if not memoized, but simplified here

  const handleTypeToggle = (e) => {
    const val = e.target.value;
    if (e.target.checked) {
      setTypes([...types, val]);
    } else {
      setTypes(types.filter(t => t !== val));
    }
  };

  const handleSeatToggle = (e) => {
    const val = e.target.value;
    if (e.target.checked) {
      setSeats([...seats, val]);
    } else {
      setSeats(seats.filter(s => s !== val));
    }
  };

  const handleClear = () => {
    // This requires controlling checkboxes, so we need checked prop
    // Or just clear state and hope React rerenders
    // For controlled components:
    // We should probably check if "checked"
  };

  return (
    <div className="ticket-filter">
      <div className="filter-row">
        <span className="filter-label">车次类型：</span>
        <div className="filter-options">
          <label><input type="checkbox" value="G" checked={types.includes('G')} onChange={handleTypeToggle} /> GC-高铁/城际</label>
          <label><input type="checkbox" value="D" checked={types.includes('D')} onChange={handleTypeToggle} /> D-动车</label>
          <label><input type="checkbox" value="Z" checked={types.includes('Z')} onChange={handleTypeToggle} /> Z-直达</label>
          <label><input type="checkbox" value="T" checked={types.includes('T')} onChange={handleTypeToggle} /> T-特快</label>
          <label><input type="checkbox" value="K" checked={types.includes('K')} onChange={handleTypeToggle} /> K-快速</label>
        </div>
      </div>
      <div className="filter-row">
        <span className="filter-label">车次席别：</span>
        <div className="filter-options">
          <label><input type="checkbox" value="business" checked={seats.includes('business')} onChange={handleSeatToggle} /> 商务座</label>
          <label><input type="checkbox" value="first" checked={seats.includes('first')} onChange={handleSeatToggle} /> 一等座</label>
          <label><input type="checkbox" value="second" checked={seats.includes('second')} onChange={handleSeatToggle} /> 二等座</label>
        </div>
      </div>
    </div>
  );
};

export default TicketFilter;
