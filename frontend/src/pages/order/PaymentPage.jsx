
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './PaymentPage.css';

const PaymentPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [order, setOrder] = useState(location.state?.order || null);
    const [loading, setLoading] = useState(!order);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!order) {
            fetchOrder();
        }
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                navigate('/login');
                return;
            }
            const user = JSON.parse(userStr);
            
            // Re-fetch all pending orders to find this one (Not efficient but works with current API)
            const res = await axios.get('/api/orders', {
                params: { userId: user.id, status: 'pending' }
            });
            
            const foundOrder = res.data.data.find(o => o.id === Number(orderId));
            if (foundOrder) {
                setOrder(foundOrder);
            } else {
                setError('订单不存在或已过期');
            }
        } catch (err) {
            console.error('Fetch order failed', err);
            setError('获取订单失败');
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const user = JSON.parse(userStr);

            await axios.post(`/api/orders/${orderId}/pay`, { userId: user.id });
            alert('支付成功！');
            navigate('/center/orders'); // Back to order list
        } catch (err) {
            console.error('Payment failed', err);
            alert(err.response?.data?.message || '支付失败');
        }
    };

    if (loading) return <div>加载中...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!order) return <div>订单不存在</div>;

    return (
        <div className="payment-page">
            <h2>订单支付</h2>
            <div className="order-summary">
                <div className="summary-item">
                    <label>订单号：</label>
                    <span>{order.id}</span>
                </div>
                <div className="summary-item">
                    <label>车次：</label>
                    <span>{order.train_number}</span>
                </div>
                <div className="summary-item">
                    <label>出发时间：</label>
                    <span>{order.departure_time}</span>
                </div>
                <div className="summary-item">
                    <label>总金额：</label>
                    <span className="price">¥{order.total_amount}</span>
                </div>
            </div>
            
            <div className="passenger-list">
                <h3>乘客信息</h3>
                {order.items && order.items.map((item, idx) => (
                    <div key={idx} className="passenger-item">
                        {item.passenger_name} ({item.seat_type}) - ¥{item.price}
                    </div>
                ))}
            </div>

            <div className="payment-actions">
                <button className="btn-confirm-pay" onClick={handlePay}>确认支付</button>
                <button className="btn-cancel-pay" onClick={() => navigate(-1)}>返回</button>
            </div>
        </div>
    );
};

export default PaymentPage;
