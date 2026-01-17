const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        id_type TEXT,
        id_card TEXT,
        real_name TEXT,
        phone TEXT,
        email TEXT,
        type INTEGER
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        ip TEXT,
        attempts INTEGER DEFAULT 0,
        last_attempt_time DATETIME,
        UNIQUE(username, ip)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS verification_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT,
        code TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        is_used INTEGER DEFAULT 0
      )`);

      // Ticket Query Infrastructure
      db.run(`CREATE TABLE IF NOT EXISTS stations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        code TEXT UNIQUE,
        pinyin TEXT,
        initial TEXT,
        city_code TEXT,
        city_name TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS trains (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        train_number TEXT UNIQUE,
        type TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS train_station_mapping (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        train_id INTEGER,
        station_id INTEGER,
        arrival_time TEXT,
        departure_time TEXT,
        stop_order INTEGER,
        price_from_start REAL,
        FOREIGN KEY(train_id) REFERENCES trains(id),
        FOREIGN KEY(station_id) REFERENCES stations(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS passengers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT,
        id_type TEXT,
        id_no TEXT,
        phone TEXT,
        type TEXT DEFAULT '成人',
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`);

      // Order Management Infrastructure
      db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        train_number TEXT,
        departure_date TEXT,
        departure_station_id INTEGER,
        arrival_station_id INTEGER,
        departure_time TEXT,
        arrival_time TEXT,
        status TEXT CHECK(status IN ('pending', 'paid', 'cancelled', 'completed')),
        total_amount REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        passenger_id INTEGER,
        passenger_name TEXT,
        passenger_id_no TEXT,
        seat_type TEXT,
        seat_number TEXT,
        price REAL,
        status TEXT DEFAULT 'normal',
        FOREIGN KEY(order_id) REFERENCES orders(id),
        FOREIGN KEY(passenger_id) REFERENCES passengers(id)
      )`);

      // Seed Data
      db.get("SELECT count(*) as count FROM stations", (err, row) => {
          if (!err && row && row.count === 0) {
              const stmt = db.prepare("INSERT INTO stations (name, code, pinyin, initial, city_code, city_name) VALUES (?, ?, ?, ?, ?, ?)");
              stmt.run('北京南', 'BJP', 'beijingnan', 'bjn', '010', '北京');
              stmt.run('上海虹桥', 'SHH', 'shanghaihongqiao', 'shhq', '021', '上海');
              stmt.run('南京南', 'NKH', 'nanjingnan', 'njn', '025', '南京');
              stmt.run('杭州东', 'HGH', 'hangzhoudong', 'hzd', '0571', '杭州');
              stmt.finalize();
          }
      });
    });
  }
});

module.exports = db;
