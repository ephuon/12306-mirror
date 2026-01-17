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
  getOrders
};
