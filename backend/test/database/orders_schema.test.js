
import db from '../../src/database/init_db';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Database Schema: Orders', () => {
  beforeAll(async () => {
    // Wait for DB connection if needed
  });

  it('should have orders table', async () => {
    return new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) console.error(err);
        else console.log('Tables found:', rows.map(r => r.name));
      });

      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='orders'", (err, row) => {
        if (err) reject(err);
        try {
          console.log('Orders table check row:', row);
          expect(row).toBeDefined();
          expect(row.name).toBe('orders');
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  it('should have order_items table', async () => {
    return new Promise((resolve, reject) => {
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='order_items'", (err, row) => {
        if (err) reject(err);
        try {
          expect(row).toBeDefined();
          expect(row.name).toBe('order_items');
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  it('should allow inserting an order and order items', async () => {
    const userId = 1; 
    
    const orderData = {
      user_id: userId,
      train_number: 'G1',
      departure_date: '2023-10-01',
      status: 'pending',
      total_amount: 100.0
    };

    const orderId = await new Promise((resolve, reject) => {
      db.run(`INSERT INTO orders (user_id, train_number, departure_date, status, total_amount) 
              VALUES (?, ?, ?, ?, ?)`, 
              [orderData.user_id, orderData.train_number, orderData.departure_date, orderData.status, orderData.total_amount], 
              function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    expect(orderId).toBeGreaterThan(0);

    const itemData = {
      order_id: orderId,
      passenger_name: 'Test Passenger',
      seat_type: 'Second Class',
      price: 100.0
    };

    const itemId = await new Promise((resolve, reject) => {
      db.run(`INSERT INTO order_items (order_id, passenger_name, seat_type, price) 
              VALUES (?, ?, ?, ?)`,
              [itemData.order_id, itemData.passenger_name, itemData.seat_type, itemData.price],
              function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    expect(itemId).toBeGreaterThan(0);
    
    // Verify retrieval
    const row = await new Promise((resolve, reject) => {
        db.get(`SELECT * FROM orders WHERE id = ?`, [orderId], (err, row) => {
            if (err) reject(err);
            resolve(row);
        });
    });
    expect(row.status).toBe('pending');
  });
});
