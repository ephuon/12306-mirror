import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api';
import './StationSelector.css';

const StationSelector = ({ label, placeholder, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    // Click outside to close
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStations = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/stations');
      if (res.data.success) {
        setStations(res.data.data);
      }
    } catch (err) {
      console.error('Fetch stations failed', err);
    } finally {
      setLoading(false);
    }
  };

  const searchStations = async (query) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/stations/search', { params: { q: query } });
      if (res.data.success) {
        setStations(res.data.data);
      }
    } catch (err) {
      console.error('Search stations failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    // Always fetch all if input is empty, otherwise search (or just fetch all if we want to show hot cities)
    // For simplicity, if input is empty, fetch all.
    if (!value) {
        fetchStations();
    } else {
        searchStations(value);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(val);
    setIsOpen(true);
    if (val) {
      searchStations(val);
    } else {
      fetchStations();
    }
  };

  const handleSelect = (station) => {
    onChange(station.name);
    setIsOpen(false);
  };

  return (
    <div className="station-selector-container" ref={wrapperRef}>
      <label>{label}</label>
      <input 
        type="text" 
        placeholder={placeholder} 
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        className="station-input"
      />
      {isOpen && (
        <div className="station-selector-popup">
          {loading ? (
            <div className="loading">加载中...</div>
          ) : (
            <div className="station-list">
              {stations.length > 0 ? (
                stations.map(station => (
                  <div 
                    key={station.id} 
                    className="station-item"
                    onClick={() => handleSelect(station)}
                  >
                    {station.name}
                  </div>
                ))
              ) : (
                <div className="no-results">无匹配车站</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StationSelector;
