
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './OrderList.css';

const OrderList = () => {
    const [activeTab, setActiveTab] = useState('upcoming'); // upcoming (未出行), history (历史订单)
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, [activeTab]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const user = JSON.parse(userStr);
            
            // Map tab to status
            // upcoming: pending, paid
            // history: completed, cancelled
            const statusGroup = activeTab === 'upcoming' ? 'upcoming' : 'history';
            
            const res = await axios.get('/api/orders', {
                params: { userId: user.id, status: statusGroup }
            });
            setOrders(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch orders', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="order-list-page">
            <h2>火车票订单</h2>
            <div className="order-tabs">
                <div 
                    className={`order-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
                    onClick={() => setActiveTab('upcoming')}
                >
                    未出行订单
                </div>
                <div 
                    className={`order-tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    历史订单
                </div>
            </div>

            <div className="order-list-content">
                {loading ? (
                    <div>加载中...</div>
                ) : orders.length === 0 ? (
                    <div className="no-orders">暂无订单</div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="order-card">
                            <div className="order-header">
                                <span>订票日期: {order.created_at}</span>
                                <span>订单号: {order.id}</span> {/* Using ID as order number for now */}
                            </div>
                            <div className="order-body">
                                <div className="train-info">
                                    {order.train_number} {order.departure_time} 开
                                </div>
                                <div className="passengers">
                                    {order.items && order.items.map((item, idx) => (
                                        <div key={idx} className="passenger-info">
                                            {item.passenger_name} {item.seat_type} {item.seat_number} ¥{item.price}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="order-footer">
                                <span className="order-status">
                                    {order.status === 'pending' ? '未支付' :
                                     order.status === 'paid' ? '已支付' :
                                     order.status === 'cancelled' ? '已取消' : '已完成'}
                                </span>
                                {order.status === 'pending' && (
                                    <button className="btn-pay">去支付</button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default OrderList;
