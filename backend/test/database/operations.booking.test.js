import operations from '../../src/database/operations';
import db from '../../src/database/init_db';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

describe('Database Operations: Booking', () => {
    let userId;
    let passengerId1;
    let passengerId2;
    const trainNumber = 'G1001';

    const runSql = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    };

    beforeAll(async () => {
        // Create user
        const userRes = await runSql("INSERT INTO users (username, password, phone, real_name, id_card, type) VALUES (?, ?, ?, ?, ?, ?)", ['booking_test_user', 'pass', '13800000000', 'Test User', '110101199001011234', 1]);
        userId = userRes.lastID;

        // Create passengers
        const p1Res = await runSql("INSERT INTO passengers (user_id, name, id_no, type) VALUES (?, ?, ?, ?)", [userId, 'Passenger 1', '110101199001011111', 'adult']);
        passengerId1 = p1Res.lastID;

        const p2Res = await runSql("INSERT INTO passengers (user_id, name, id_no, type) VALUES (?, ?, ?, ?)", [userId, 'Passenger 2', '110101199001012222', 'student']);
        passengerId2 = p2Res.lastID;
    });

    afterAll(async () => {
        await runSql("DELETE FROM users WHERE id = ?", [userId]);
        await runSql("DELETE FROM passengers WHERE user_id = ?", [userId]);
        await runSql("DELETE FROM orders WHERE user_id = ?", [userId]);
    });

    it('should create an order with multiple passengers', async () => {
        const orderId = await operations.createOrder(userId, trainNumber, [passengerId1, passengerId2], 'Second Class');
        expect(orderId).toBeDefined();

        // Verify order created
        const orders = await operations.getOrders(userId, 'upcoming');
        expect(orders).toHaveLength(1);
        expect(orders[0].id).toBe(orderId);
        expect(orders[0].train_number).toBe(trainNumber);
        expect(orders[0].status).toBe('pending');

        // Verify order items
        const items = orders[0].items;
        expect(items).toHaveLength(2);
        const p1Item = items.find(i => i.passenger_id === passengerId1);
        expect(p1Item).toBeDefined();
        expect(p1Item.seat_type).toBe('Second Class');
    });

    it('should fail if passenger does not belong to user', async () => {
        await expect(operations.createOrder(userId, trainNumber, [99999], 'Second Class'))
            .rejects.toThrow();
    });
});
