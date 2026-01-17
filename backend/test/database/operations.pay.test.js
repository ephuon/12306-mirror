
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import db from '../../src/database/init_db.js';
import * as operations from '../../src/database/operations.js';

describe('operations.payOrder', () => {
    let userId;
    let orderId;

    const runSql = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    };

    beforeEach(async () => {
        // Setup: Create user and pending order
        await runSql('DELETE FROM orders');
        await runSql('DELETE FROM users');
        
        const userResult = await runSql("INSERT INTO users (username, password, real_name, id_card, phone, type) VALUES ('payuser', 'pass', 'Pay User', 'ID_PAY', '13900000000', 'USER')");
        userId = userResult.lastID;
        
        const orderResult = await runSql(
            "INSERT INTO orders (user_id, train_number, departure_time, status, created_at) VALUES (?, 'G-PAY', '10:00', 'pending', datetime('now'))",
            [userId]
        );
        orderId = orderResult.lastID;
    });

    it('successfully pays a pending order', async () => {
        const result = await operations.payOrder(userId, orderId);
        expect(result).toBe(true);

        const order = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        expect(order.status).toBe('paid');
        expect(order.paid_at).toBeDefined();
    });

    it('fails if order does not belong to user', async () => {
        await expect(operations.payOrder(userId + 1, orderId)).rejects.toThrow(/not match/);
    });

    it('fails if order is not pending', async () => {
        // Change to cancelled
        await runSql("UPDATE orders SET status = 'cancelled' WHERE id = ?", [orderId]);
        await expect(operations.payOrder(userId, orderId)).rejects.toThrow(/not in pending status/);
    });

    it('fails if order does not exist', async () => {
        await expect(operations.payOrder(userId, 99999)).rejects.toThrow(/not found/);
    });
});
