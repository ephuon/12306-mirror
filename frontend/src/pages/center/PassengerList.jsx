
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PassengerList.css';

const PassengerList = () => {
    const [passengers, setPassengers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchPassengers = async (query = '') => {
        setLoading(true);
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                setError('用户未登录');
                setLoading(false);
                return;
            }
            const user = JSON.parse(userStr);
            
            const params = { userId: user.id };
            if (query) {
                params.q = query;
            }

            const res = await axios.get('/api/passengers', { params });
            
            if (res.data.success) {
                setPassengers(res.data.data);
            } else {
                setError(res.data.message || '获取失败');
            }
        } catch (err) {
            console.error(err);
            setError('网络请求失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPassengers();
    }, []);

    const handleSearch = () => {
        fetchPassengers(searchQuery);
    };

    if (loading) return <div>加载中...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="passenger-list">
            <div className="header-actions">
                <h2>乘车人管理</h2>
                <div className="search-box">
                    <input 
                        type="text" 
                        placeholder="输入姓名搜索" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button onClick={handleSearch}>搜索</button>
                </div>
                <button className="btn-add">添加乘车人</button>
            </div>
            
            <table className="passenger-table">
                <thead>
                    <tr>
                        <th>序号</th>
                        <th>姓名</th>
                        <th>证件类型</th>
                        <th>证件号码</th>
                        <th>手机号</th>
                        <th>旅客类型</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {passengers.length === 0 ? (
                        <tr><td colSpan="7" className="empty-tip">暂无乘车人</td></tr>
                    ) : (
                        passengers.map((p, index) => (
                            <tr key={p.id || index}>
                                <td>{index + 1}</td>
                                <td>{p.name}</td>
                                <td>{p.id_type === '1' ? '中国居民身份证' : '其他'}</td>
                                <td>{p.id_no}</td>
                                <td>{p.phone}</td>
                                <td>{p.type}</td>
                                <td>
                                    <button className="btn-link">编辑</button>
                                    <button className="btn-link text-danger">删除</button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default PassengerList;
