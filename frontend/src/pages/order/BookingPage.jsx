import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import './BookingPage.css';

const BookingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const trainInfo = location.state?.train || { 
        trainNumber: 'G101', 
        fromStation: '北京南', 
        toStation: '上海虹桥', 
        start_time: '09:00', 
        end_time: '13:00' 
    };

    const [passengers, setPassengers] = useState([]);
    const [selectedPassengerIds, setSelectedPassengerIds] = useState([]);
    const [seatType, setSeatType] = useState('二等座');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPassengers();
    }, []);

    const fetchPassengers = async () => {
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                setError("未登录");
                return;
            }
            const user = JSON.parse(userStr);
            const res = await axios.get('/api/passengers', {
                params: { userId: user.id },
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setPassengers(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch passengers", err);
            setError("加载乘车人失败");
        }
    };

    const handlePassengerToggle = (id) => {
        setSelectedPassengerIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(pid => pid !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleSubmit = async () => {
        if (selectedPassengerIds.length === 0) {
            setError("请选择至少一位乘车人");
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                navigate('/login');
                return;
            }
            const user = JSON.parse(userStr);
            
            const res = await axios.post('/api/orders', {
                userId: user.id,
                trainNumber: trainInfo.trainNumber || trainInfo.train_no, // Handle different naming conventions
                passengerIds: selectedPassengerIds,
                seatType
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.data.success) {
                alert(`订票成功！订单号: ${res.data.orderId}`);
                navigate('/center/orders'); 
            }
        } catch (err) {
            console.error("Booking failed", err);
            setError(err.response?.data?.message || "订票失败");
        }
    };

    return (
        <div className="booking-page">
            <h2>订单填写</h2>
            {error && <div className="error-message">{error}</div>}
            
            <div className="train-info-card">
                <h3>车次信息: {trainInfo.trainNumber || trainInfo.train_no}</h3>
                <div className="route-info">
                    <span>{trainInfo.fromStation || trainInfo.from_station} ({trainInfo.start_time || trainInfo.departureTime})</span>
                    <span className="arrow">→</span>
                    <span>{trainInfo.toStation || trainInfo.to_station} ({trainInfo.end_time || trainInfo.arrivalTime})</span>
                </div>
                <p>日期: {trainInfo.date || new Date().toLocaleDateString()}</p>
                
                <p>座位类型: 
                    <select value={seatType} onChange={(e) => setSeatType(e.target.value)}>
                        <option value="二等座">二等座</option>
                        <option value="一等座">一等座</option>
                        <option value="商务座">商务座</option>
                    </select>
                </p>
            </div>

            <div className="passenger-selection">
                <h3>选择乘车人</h3>
                {passengers.length === 0 ? (
                    <p>暂无乘车人，请去个人中心添加</p>
                ) : (
                    <div className="passenger-list">
                        {passengers.map(p => (
                            <label key={p.id} className="passenger-item">
                                <input 
                                    type="checkbox" 
                                    checked={selectedPassengerIds.includes(p.id)}
                                    onChange={() => handlePassengerToggle(p.id)}
                                />
                                {p.name} ({p.id_no}) - {p.type}
                            </label>
                        ))}
                    </div>
                )}
            </div>

            <button className="submit-btn" onClick={handleSubmit}>提交订单</button>
        </div>
    );
};

export default BookingPage;
