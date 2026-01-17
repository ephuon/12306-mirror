import request from 'supertest';
import app from '../../src/index';
import db from '../../src/database/init_db';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('API: Booking', () => {
    let userId;
    let passengerId;

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
         const userRes = await runSql("INSERT INTO users (username, password, phone, real_name, id_card, type) VALUES (?, ?, ?, ?, ?, ?)", ['api_booking_test', 'pass', '13900000000', 'API Test', '110101199001019999', 1]);
         userId = userRes.lastID;
 
          // Create passenger
         const pRes = await runSql("INSERT INTO passengers (user_id, name, id_no, type) VALUES (?, ?, ?, ?)", [userId, 'P1', '110101199001018888', 'adult']);
         passengerId = pRes.lastID;
    });

    afterAll(async () => {
        await runSql("DELETE FROM users WHERE id = ?", [userId]);
    });

    it('POST /api/orders should create an order', async () => {
        const res = await request(app)
            .post('/api/orders')
            .send({
                userId,
                trainNumber: 'G1234',
                passengerIds: [passengerId],
                seatType: 'First Class'
            });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.orderId).toBeDefined();
    });

    it('POST /api/orders should fail with missing fields', async () => {
        const res = await request(app)
            .post('/api/orders')
            .send({
                userId // missing others
            });
        
        expect(res.status).toBe(400);
    });
});
