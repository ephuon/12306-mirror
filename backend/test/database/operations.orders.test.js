
import operations from '../../src/database/operations';
import db from '../../src/database/init_db';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

describe('Database Operations: Orders', () => {
    let userId;

    beforeAll(async () => {
        // Create a test user
        await new Promise((resolve) => {
            db.run("INSERT INTO users (username, password) VALUES ('test_order_user', 'pass')", function() {
                userId = this.lastID;
                resolve();
            });
        });
    });

    beforeEach(async () => {
        // Clean up orders for this user
        await new Promise(r => db.run("DELETE FROM orders WHERE user_id = ?", [userId], r));
    });

    it('should retrieve upcoming orders (pending/paid)', async () => {
        // Seed orders
        await new Promise(r => db.run("INSERT INTO orders (user_id, status, train_number) VALUES (?, 'paid', 'G101')", [userId], r));
        await new Promise(r => db.run("INSERT INTO orders (user_id, status, train_number) VALUES (?, 'pending', 'G102')", [userId], r));
        await new Promise(r => db.run("INSERT INTO orders (user_id, status, train_number) VALUES (?, 'completed', 'G103')", [userId], r));

        const orders = await operations.getOrders(userId, 'upcoming');
        expect(orders).toHaveLength(2);
        const trainNumbers = orders.map(o => o.train_number).sort();
        expect(trainNumbers).toEqual(['G101', 'G102']);
    });

    it('should retrieve history orders (completed/cancelled)', async () => {
        // Seed orders
        await new Promise(r => db.run("INSERT INTO orders (user_id, status, train_number) VALUES (?, 'paid', 'G201')", [userId], r));
        await new Promise(r => db.run("INSERT INTO orders (user_id, status, train_number) VALUES (?, 'cancelled', 'G202')", [userId], r));
        await new Promise(r => db.run("INSERT INTO orders (user_id, status, train_number) VALUES (?, 'completed', 'G203')", [userId], r));

        const orders = await operations.getOrders(userId, 'history');
        expect(orders).toHaveLength(2);
        const trainNumbers = orders.map(o => o.train_number).sort();
        expect(trainNumbers).toEqual(['G202', 'G203']);
    });

    it('should include order items in result', async () => {
        // Seed order with items
        let orderId;
        await new Promise(r => {
            db.run("INSERT INTO orders (user_id, status, train_number) VALUES (?, 'paid', 'G301')", [userId], function() {
                orderId = this.lastID;
                r();
            });
        });
        
        await new Promise(r => {
            db.run("INSERT INTO order_items (order_id, passenger_name, seat_type) VALUES (?, 'P1', '1A')", [orderId], r);
        });

        const orders = await operations.getOrders(userId, 'upcoming');
        expect(orders).toHaveLength(1);
        expect(orders[0].items).toBeDefined();
        expect(orders[0].items).toHaveLength(1);
        expect(orders[0].items[0].passenger_name).toBe('P1');
    });
});
