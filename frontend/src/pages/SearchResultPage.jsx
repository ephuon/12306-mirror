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

  useEffect(() => {
    let result = tickets;
    
    // Filter by Type
    if (filters.types.length > 0) {
        result = result.filter(t => filters.types.includes(t.type));
    }

    // Filter by Seat
    if (filters.seats.length > 0) {
        result = result.filter(t => {
            // Check if ticket has any of the selected seat types
            // Mapping English keys to potential display names or just checking existence
            // Mock data uses: business, first, second, hard_seat, etc.
            // Filter passes values like: 'business', 'first', 'second'
            return filters.seats.some(seat => t.seats && t.seats[seat] !== undefined);
        });
    }

    setFilteredTickets(result);
  }, [tickets, filters]);

  return (
    <div className="search-result-page">
      <Header />
      <Navbar />
      <main className="search-content">
        <div className="container">
          <TicketQueryForm initialValues={initialValues} onSearch={handleSearch} />
          <TicketFilter onFilterChange={handleFilterChange} />
          
          <div className="result-area">
            {loading ? (
                <p>加载中...</p>
            ) : filteredTickets.length > 0 ? (
                <div className="ticket-list">
                    {filteredTickets.map(ticket => (
                        <div key={ticket.id} className="ticket-item">
                            <div className="ticket-train">
                                <h3>{ticket.train_no}</h3>
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
                    <p>当前筛选条件下无车次</p>
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
