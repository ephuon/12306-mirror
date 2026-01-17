import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import TicketQueryForm from '../components/TicketQueryForm';
import TicketFilter from '../components/TicketFilter';
import apiClient from '../api';
import './SearchResultPage.css';

const SearchResultPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ types: [], seats: [] });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showDiscount, setShowDiscount] = useState(false);
  const [showExchange, setShowExchange] = useState(false);

  // Initial values from URL
  const initialValues = {
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
    date: searchParams.get('date') || '',
    isStudent: searchParams.get('student') === 'true',
    isHighSpeed: searchParams.get('highSpeed') === 'true'
  };

  const fetchTickets = async (params) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/tickets', { params });
      if (res.data.success) {
        setTickets(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial data if params exist
    if (initialValues.from && initialValues.to) {
        fetchTickets(initialValues);
    }
  }, []); 

  const handleSearch = (values) => {
    // Update URL
    const params = {
        from: values.from,
        to: values.to,
        date: values.date,
        student: values.isStudent,
        highSpeed: values.isHighSpeed
    };
    setSearchParams(params);
    fetchTickets(values);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    let result = [...tickets];
    
    // Filter by Type
    if (filters.types.length > 0) {
        result = result.filter(t => filters.types.includes(t.type));
    }

    // Filter by Seat
    if (filters.seats.length > 0) {
        result = result.filter(t => {
            return filters.seats.some(seat => t.seats && t.seats[seat] !== undefined);
        });
    }

    // Filter by Special Flags
    if (showDiscount) {
        result = result.filter(t => t.is_discount);
    }
    if (showExchange) {
        result = result.filter(t => t.can_exchange);
    }

    // Sort
    if (sortConfig.key) {
        result.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    setFilteredTickets(result);
  }, [tickets, filters, sortConfig, showDiscount, showExchange]);

  return (
    <div className="search-result-page">
      <Header />
      <Navbar />
      <main className="search-content">
        <div className="container">
          <TicketQueryForm initialValues={initialValues} onSearch={handleSearch} />
          <TicketFilter onFilterChange={handleFilterChange} />
          
          <div className="result-area">
            <div className="list-toolbar">
                <div className="sort-options">
                    <span className={`sort-item ${sortConfig.key === 'start_time' ? 'active' : ''}`} onClick={() => handleSort('start_time')}>
                        出发时间 {sortConfig.key === 'start_time' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </span>
                    <span className={`sort-item ${sortConfig.key === 'end_time' ? 'active' : ''}`} onClick={() => handleSort('end_time')}>
                        到达时间 {sortConfig.key === 'end_time' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </span>
                    <span className={`sort-item ${sortConfig.key === 'duration' ? 'active' : ''}`} onClick={() => handleSort('duration')}>
                        历时 {sortConfig.key === 'duration' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </span>
                </div>
                <div className="special-filters">
                    <label><input type="checkbox" checked={showDiscount} onChange={e => setShowDiscount(e.target.checked)} /> 显示折扣车次</label>
                    <label><input type="checkbox" checked={showExchange} onChange={e => setShowExchange(e.target.checked)} /> 显示积分兑换车次</label>
                </div>
            </div>

            {loading ? (
                <p>加载中...</p>
            ) : filteredTickets.length > 0 ? (
                <div className="ticket-list">
                    {filteredTickets.map(ticket => (
                        <div key={ticket.id} className="ticket-item">
                            <div className="ticket-train">
                                <h3>{ticket.train_no}</h3>
                                <div className="tags">
                                    {ticket.tags && ticket.tags.map(tag => (
                                        <span key={tag} className="tag">{tag}</span>
                                    ))}
                                    {ticket.can_exchange && <span className="tag exchange">兑</span>}
                                </div>
                            </div>
                            <div className="ticket-stations">
                                <div className="station-info">
                                    <span className="station-name start">{ticket.from_station}</span>
                                    <span className="time">{ticket.start_time}</span>
                                </div>
                                <div className="duration-info">
                                    <span>{ticket.duration}</span>
                                    <span className="arrow">→</span>
                                </div>
                                <div className="station-info">
                                    <span className="station-name end">{ticket.to_station}</span>
                                    <span className="time">{ticket.end_time}</span>
                                </div>
                            </div>
                            <div className="ticket-seats">
                                {Object.entries(ticket.seats).map(([type, count]) => (
                                    <div key={type} className="seat-info">
                                        <span className="seat-type">{type}</span>
                                        <span className={`seat-price ${ticket.is_discount ? 'discount' : ''}`}>
                                            ¥{ticket.prices && ticket.prices[type]}
                                        </span>
                                        <span className={`seat-count ${count > 0 ? 'available' : 'none'}`}>
                                            {count > 0 ? `${count}张` : '无'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="ticket-action">
                                <button className="book-btn">预订</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="no-results">
                    <p>未查询到符合条件的车次</p>
                    <p>建议使用接续换乘或更换日期</p>
                </div>
            )}
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
