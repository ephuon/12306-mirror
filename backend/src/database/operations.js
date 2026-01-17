const db = require('./init_db');

const createUser = (userData) => {
  return new Promise((resolve, reject) => {
    const { username, password, id_type, id_card, real_name, phone, email, type } = userData;
    
    // Check if user exists
    db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
        if (err) return reject(err);
        if (row) return reject(new Error('Username already exists'));

        const stmt = db.prepare('INSERT INTO users (username, password, id_type, id_card, real_name, phone, email, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        stmt.run(username, password, id_type, id_card, real_name, phone, email, type, function(err) {
            if (err) return reject(err);
            resolve(this.lastID);
        });
        stmt.finalize();
    });
  });
};

const loginUser = (credentials) => {
  return new Promise((resolve, reject) => {
    const { username, password } = credentials;
    // Support login by username, email, or phone
    const sql = `SELECT * FROM users WHERE (username = ? OR email = ? OR phone = ?)`;
    
    db.get(sql, [username, username, username], (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new Error('Invalid username or password'));
      
      // Simple password check (In production, use hashing)
      if (row.password !== password) {
        return reject(new Error('Invalid username or password'));
      }
      
      resolve(row);
    });
  });
};

const verifyUserIdentity = (criteria) => {
    return new Promise((resolve, reject) => {
        const { username, realName, idCard, phone } = criteria;
        const sql = `SELECT * FROM users WHERE username = ?`;
        
        db.get(sql, [username], (err, row) => {
            if (err) return reject(err);
            if (!row) return reject(new Error('User not found'));
            
            if (row.real_name !== realName || row.id_card !== idCard || row.phone !== phone) {
                return reject(new Error('Identity verification failed'));
            }
            
            resolve(true);
        });
    });
};

const storeVerificationCode = (phone, code) => {
    return new Promise((resolve, reject) => {
        // Expire in 5 minutes
        const expiresAt = new Date(Date.now() + 5 * 60000).toISOString();
        const stmt = db.prepare('INSERT INTO verification_codes (phone, code, expires_at) VALUES (?, ?, ?)');
        stmt.run(phone, code, expiresAt, function(err) {
            if (err) return reject(err);
            resolve(this.lastID);
        });
        stmt.finalize();
    });
};

const verifyCode = (phone, code) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM verification_codes WHERE phone = ? AND code = ? AND is_used = 0 ORDER BY created_at DESC LIMIT 1`;
        
        db.get(sql, [phone, code], (err, row) => {
            if (err) return reject(err);
            if (!row) return reject(new Error('Invalid or expired verification code'));
            
            const now = new Date().toISOString();
            if (row.expires_at < now) {
                return reject(new Error('Invalid or expired verification code'));
            }
            
            // Mark as used
            db.run('UPDATE verification_codes SET is_used = 1 WHERE id = ?', [row.id], (err) => {
                if (err) return reject(err);
                resolve(true);
            });
        });
    });
};

const updatePassword = (username, newPassword) => {
    return new Promise((resolve, reject) => {
        db.run('UPDATE users SET password = ? WHERE username = ?', [newPassword, username], function(err) {
            if (err) return reject(err);
            resolve(true);
        });
    });
};

const getAllStations = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM stations', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const searchStations = (query) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM stations WHERE name LIKE ? OR code LIKE ? OR city_name LIKE ? OR pinyin LIKE ? OR initial LIKE ?`;
    const param = `%${query}%`;
    db.all(sql, [param, param, param, param, param], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const getPassengers = (userId) => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM passengers WHERE user_id = ?', [userId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const searchPassengers = (userId, query) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM passengers WHERE user_id = ? AND name LIKE ?';
        db.all(sql, [userId, `%${query}%`], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const addPassenger = (passengerData) => {
    return new Promise((resolve, reject) => {
        const { user_id, name, id_type, id_no, phone, type } = passengerData;
        const stmt = db.prepare('INSERT INTO passengers (user_id, name, id_type, id_no, phone, type) VALUES (?, ?, ?, ?, ?, ?)');
        stmt.run(user_id, name, id_type, id_no, phone, type, function(err) {
            if (err) return reject(err);
            resolve(this.lastID);
        });
        stmt.finalize();
    });
};

const deletePassenger = (id, userId) => {
    return new Promise((resolve, reject) => {
        // First check if it belongs to user
        db.get('SELECT id FROM passengers WHERE id = ? AND user_id = ?', [id, userId], (err, row) => {
            if (err) return reject(err);
            if (!row) return reject(new Error('Passenger not found or permission denied'));
             
            db.run('DELETE FROM passengers WHERE id = ?', [id], function(err) {
                if (err) return reject(err);
                resolve(true);
            });
        });
    });
};

const updatePassenger = (id, userId, updates) => {
    return new Promise((resolve, reject) => {
        // First check if it belongs to user
        db.get('SELECT id FROM passengers WHERE id = ? AND user_id = ?', [id, userId], (err, row) => {
            if (err) return reject(err);
            if (!row) return reject(new Error('Passenger not found or permission denied'));
            
            // Only allow updating phone and type (and potentially others if needed, but not name/id_no)
            // If the user tries to update name/id_no, we just ignore those fields or throw error.
            // Requirement says name/id_no are read-only.
            
            const { phone, type } = updates;
            // Construct query dynamically or fixed since we only have 2 fields
            
            db.run('UPDATE passengers SET phone = ?, type = ? WHERE id = ?', [phone, type, id], function(err) {
                if (err) return reject(err);
                resolve(true);
            });
        });
    });
};

const getOrders = (userId, statusGroup) => {
    return new Promise((resolve, reject) => {
        let statusCondition = "";
        const params = [userId];
        
        if (statusGroup === 'upcoming') {
            statusCondition = "AND status IN ('pending', 'paid')";
        } else if (statusGroup === 'history') {
            statusCondition = "AND status IN ('completed', 'cancelled')";
        }
        
        const sql = `SELECT * FROM orders WHERE user_id = ? ${statusCondition} ORDER BY created_at DESC`;
        console.log('getOrders SQL:', sql, 'Params:', userId);
        
        db.all(sql, params, async (err, orders) => {
            if (err) return reject(err);
            if (!orders || orders.length === 0) return resolve([]);
            
            try {
                const ordersWithItems = await Promise.all(orders.map(async (order) => {
                    const items = await new Promise((res, rej) => {
                        db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id], (e, rows) => {
                            if (e) rej(e);
                            else res(rows || []);
                        });
                    });
                    return { ...order, items };
                }));
                resolve(ordersWithItems);
            } catch (error) {
                reject(error);
            }
        });
    });
};

const createOrder = (userId, trainNumber, passengerIds, seatType) => {
    return new Promise((resolve, reject) => {
        // 1. Verify passengers belong to user
        const sqlPassengers = "SELECT * FROM passengers WHERE user_id = ?";
        db.all(sqlPassengers, [userId], (err, passengers) => {
            if (err) return reject(err);
            
            const userPassengerMap = new Map(passengers.map(p => [p.id, p]));
            const selectedPassengers = [];
            
            for (const pid of passengerIds) {
                if (!userPassengerMap.has(pid)) {
                    return reject(new Error(`Passenger ID ${pid} does not belong to user`));
                }
                selectedPassengers.push(userPassengerMap.get(pid));
            }

            if (selectedPassengers.length === 0) {
                return reject(new Error("No passengers selected"));
            }

            // 2. Mock Price Calculation
            const basePrice = 100; // Mock price
            const totalAmount = basePrice * selectedPassengers.length;
            
            // 3. Insert Order
            const sqlOrder = `INSERT INTO orders (user_id, train_number, status, total_amount, created_at) VALUES (?, ?, 'pending', ?, datetime('now'))`;
            
            db.run(sqlOrder, [userId, trainNumber, totalAmount], function(err) {
                if (err) return reject(err);
                const orderId = this.lastID;
                
                // 4. Insert Order Items
                const stmt = db.prepare(`INSERT INTO order_items (order_id, passenger_id, passenger_name, passenger_id_no, seat_type, price) VALUES (?, ?, ?, ?, ?, ?)`);
                
                let completed = 0;
                let hasError = false;

                selectedPassengers.forEach(p => {
                    stmt.run(orderId, p.id, p.name, p.id_no, seatType, basePrice, (err) => {
                        if (hasError) return;
                        if (err) {
                            hasError = true;
                            return reject(err);
                        }
                        completed++;
                        if (completed === selectedPassengers.length) {
                            stmt.finalize();
                            resolve(orderId);
                        }
                    });
                });
            });
        });
    });
};

const cancelOrder = (userId, orderId) => {
    return new Promise((resolve, reject) => {
        orderId = Number(orderId); // Force cast to Number
        
        // 1. Get Order
        db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, order) => {
            if (err) return reject(err);
            if (!order) {
                return reject(new Error(`Order ${orderId} not found`));
            }
            
            if (order.user_id !== userId) {
                return reject(new Error(`Order user_id ${order.user_id} does not match request user_id ${userId}`));
            }
            
            // 2. Check Status
            if (!['pending', 'paid'].includes(order.status)) {
                return reject(new Error('Order is not in cancellable status'));
            }
            
            // 3. Check Daily Limit
            // We use SQLite's date function to compare the date part of cancelled_at with today's date
            const sqlCount = `SELECT COUNT(*) as count FROM orders 
                              WHERE user_id = ? 
                              AND status = 'cancelled' 
                              AND date(cancelled_at) = date('now')`;
            
            db.get(sqlCount, [userId], (err, row) => {
                if (err) return reject(err);
                if (row && row.count >= 3) {
                    return reject(new Error('Daily cancellation limit exceeded'));
                }
                
                // 4. Cancel
                db.run(`UPDATE orders SET status = 'cancelled', cancelled_at = datetime('now') WHERE id = ?`, [orderId], function(err) {
                    if (err) return reject(err);
                    resolve(true);
                });
            });
        });
    });
};

module.exports = {
  createUser,
  loginUser,
  verifyUserIdentity,
  storeVerificationCode,
  verifyCode,
  updatePassword,
  getAllStations,
  searchStations,
  getPassengers,
  searchPassengers,
  addPassenger,
  deletePassenger,
  updatePassenger,
  getOrders,
  createOrder,
  cancelOrder
};
