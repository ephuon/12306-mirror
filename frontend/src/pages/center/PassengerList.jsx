
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PassengerList.css';

const PassengerList = () => {
    const [passengers, setPassengers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Add Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newPassenger, setNewPassenger] = useState({
        name: '',
        id_type: '1',
        id_no: '',
        phone: '',
        type: '成人'
    });

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

    const handleSavePassenger = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const user = JSON.parse(userStr);

            const payload = { ...newPassenger, userId: user.id };
            const res = await axios.post('/api/passengers', payload);

            if (res.data.success) {
                setShowAddModal(false);
                setNewPassenger({ name: '', id_type: '1', id_no: '', phone: '', type: '成人' });
                fetchPassengers(); // Refresh list
            } else {
                alert(res.data.message || '添加失败');
            }
        } catch (err) {
            console.error(err);
            alert('添加失败：' + err.message);
        }
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
                <button className="btn-add" onClick={() => setShowAddModal(true)}>添加乘车人</button>
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

            {/* Add Passenger Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>基本信息</h3>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label htmlFor="name">姓名</label>
                                <input 
                                    id="name"
                                    type="text" 
                                    value={newPassenger.name} 
                                    onChange={e => setNewPassenger({...newPassenger, name: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="id_type">证件类型</label>
                                <select 
                                    id="id_type"
                                    value={newPassenger.id_type} 
                                    onChange={e => setNewPassenger({...newPassenger, id_type: e.target.value})}
                                >
                                    <option value="1">中国居民身份证</option>
                                    <option value="2">护照</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="id_no">证件号码</label>
                                <input 
                                    id="id_no"
                                    type="text" 
                                    value={newPassenger.id_no} 
                                    onChange={e => setNewPassenger({...newPassenger, id_no: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="phone">手机号</label>
                                <input 
                                    id="phone"
                                    type="text" 
                                    value={newPassenger.phone} 
                                    onChange={e => setNewPassenger({...newPassenger, phone: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="type">旅客类型</label>
                                <select 
                                    id="type"
                                    value={newPassenger.type} 
                                    onChange={e => setNewPassenger({...newPassenger, type: e.target.value})}
                                >
                                    <option value="成人">成人</option>
                                    <option value="学生">学生</option>
                                    <option value="儿童">儿童</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowAddModal(false)}>取消</button>
                            <button className="btn-save" onClick={handleSavePassenger}>保存</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PassengerList;
