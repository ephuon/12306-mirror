import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import operations from '../../src/database/operations';
import db from '../../src/database/init_db';

const runSql = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

const getRow = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

describe('Operations: Cancel Order', () => {
    let userId;
    let orderId;

    beforeEach(async () => {
        // Setup user
        await runSql('DELETE FROM users');
        await runSql('DELETE FROM orders');
        
        const userResult = await runSql(
            'INSERT INTO users (username, password, id_card, real_name) VALUES (?, ?, ?, ?)',
            ['testuser', 'pass', '123456789012345678', 'Test User']
        );
        userId = userResult.lastID;

        // Setup a pending order
        const orderResult = await runSql(
            `INSERT INTO orders (user_id, train_number, status, total_amount) 
             VALUES (?, ?, ?, ?)`,
            [userId, 'G1001', 'pending', 100]
        );
        orderId = orderResult.lastID;
    });

    it('should successfully cancel a pending order', async () => {
        const result = await operations.cancelOrder(userId, orderId);
        expect(result).toBe(true);

        const order = await getRow('SELECT * FROM orders WHERE id = ?', [orderId]);
        expect(order.status).toBe('cancelled');
        expect(order.cancelled_at).not.toBeNull();
    });

    it('should successfully cancel a paid order', async () => {
        // Change status to paid
        await runSql('UPDATE orders SET status = ? WHERE id = ?', ['paid', orderId]);
        
        const result = await operations.cancelOrder(userId, orderId);
        expect(result).toBe(true);
        
        const order = await getRow('SELECT * FROM orders WHERE id = ?', [orderId]);
        expect(order.status).toBe('cancelled');
    });

    it('should fail to cancel an already cancelled order', async () => {
        await operations.cancelOrder(userId, orderId);
        await expect(operations.cancelOrder(userId, orderId))
            .rejects.toThrow('Order is not in cancellable status');
    });

    it('should fail to cancel another user\'s order', async () => {
        const anotherUserId = userId + 1;
        await expect(operations.cancelOrder(anotherUserId, orderId))
            .rejects.toThrow('Order not found or does not belong to user');
    });

    it('should enforce daily cancellation limit (max 3)', async () => {
        // Create 3 cancelled orders for today
        for (let i = 0; i < 3; i++) {
            const res = await runSql(
                `INSERT INTO orders (user_id, train_number, status, cancelled_at) 
                 VALUES (?, ?, ?, datetime('now'))`,
                [userId, `G${i}`, 'cancelled']
            );
        }

        // Try to cancel the target order
        await expect(operations.cancelOrder(userId, orderId))
            .rejects.toThrow('Daily cancellation limit exceeded');
    });
});
