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

module.exports = {
  createUser,
  loginUser
};
