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

module.exports = {
  createUser,
  loginUser,
  verifyUserIdentity,
  storeVerificationCode,
  verifyCode,
  updatePassword,
  getAllStations,
  searchStations
};
