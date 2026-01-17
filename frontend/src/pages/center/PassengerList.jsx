
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PassengerList.css';

const PassengerList = () => {
    const [passengers, setPassengers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Add/Edit Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [editingId, setEditingId] = useState(null);
    const [newPassenger, setNewPassenger] = useState({
        name: '',
        id_type: '1',
        id_no: '',
        phone: '',
        type: '成人'
    });

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [passengerToDelete, setPassengerToDelete] = useState(null);

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

            if (modalMode === 'add') {
                const payload = { ...newPassenger, userId: user.id };
                const res = await axios.post('/api/passengers', payload);

                if (res.data.success) {
                    setShowAddModal(false);
                    setNewPassenger({ name: '', id_type: '1', id_no: '', phone: '', type: '成人' });
                    fetchPassengers(); // Refresh list
                } else {
                    alert(res.data.message || '添加失败');
                }
            } else {
                // Edit Mode
                const payload = { 
                    phone: newPassenger.phone, 
                    type: newPassenger.type, 
                    userId: user.id 
                };
                const res = await axios.put(`/api/passengers/${editingId}`, payload);

                if (res.data.success) {
                    setShowAddModal(false);
                    setNewPassenger({ name: '', id_type: '1', id_no: '', phone: '', type: '成人' });
                    setEditingId(null);
                    setModalMode('add');
                    fetchPassengers(); // Refresh list
                } else {
                    alert(res.data.message || '修改失败');
                }
            }
        } catch (err) {
            console.error(err);
            alert('操作失败：' + err.message);
        }
    };

    const handleEditClick = (passenger) => {
        setModalMode('edit');
        setEditingId(passenger.id);
        setNewPassenger({
            name: passenger.name,
            id_type: passenger.id_type,
            id_no: passenger.id_no,
            phone: passenger.phone,
            type: passenger.type
        });
        setShowAddModal(true);
    };

    const handleAddClick = () => {
        setModalMode('add');
        setEditingId(null);
        setNewPassenger({ name: '', id_type: '1', id_no: '', phone: '', type: '成人' });
        setShowAddModal(true);
    };

    const handleDeleteClick = (passenger) => {
        setPassengerToDelete(passenger);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!passengerToDelete) return;
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const user = JSON.parse(userStr);
            
            const res = await axios.delete(`/api/passengers/${passengerToDelete.id}`, {
                params: { userId: user.id }
            });
            
            if (res.data.success) {
                setShowDeleteModal(false);
                setPassengerToDelete(null);
                fetchPassengers();
            } else {
                alert(res.data.message || '删除失败');
            }
        } catch (err) {
            console.error(err);
            alert('删除失败：' + err.message);
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
                <button className="btn-add" onClick={handleAddClick}>添加乘车人</button>
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
                                    <button className="btn-link" onClick={() => handleEditClick(p)}>编辑</button>
                                    <button className="btn-link text-danger" onClick={() => handleDeleteClick(p)}>删除</button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Add/Edit Passenger Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{modalMode === 'add' ? '添加乘车人' : '编辑乘车人'}</h3>
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
                                    disabled={modalMode === 'edit'}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="id_type">证件类型</label>
                                <select 
                                    id="id_type"
                                    value={newPassenger.id_type} 
                                    onChange={e => setNewPassenger({...newPassenger, id_type: e.target.value})}
                                    disabled={modalMode === 'edit'}
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
                                    disabled={modalMode === 'edit'}
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

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>确认删除</h3>
                            <button className="close-btn" onClick={() => setShowDeleteModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>确定要删除该乘车人吗？</p>
                            {passengerToDelete && <p className="text-highlight">{passengerToDelete.name}</p>}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>取消</button>
                            <button className="btn-save btn-danger" onClick={handleConfirmDelete}>确定</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PassengerList;
