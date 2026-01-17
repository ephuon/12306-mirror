
import request from 'supertest';
import app from '../../src/index';
import db from '../../src/database/init_db';
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

describe('API: Orders', () => {
    let userId;

    beforeAll(async () => {
        // Create user
        await new Promise(r => {
            db.run("INSERT INTO users (username, password) VALUES ('api_order_user', 'pass')", function() {
                userId = this.lastID;
                r();
            });
        });
    });

    beforeEach(async () => {
        await new Promise(r => db.run("DELETE FROM orders WHERE user_id = ?", [userId], r));
    });

    it('GET /api/orders should return 400 if userId is missing', async () => {
        const res = await request(app).get('/api/orders');
        expect(res.status).toBe(400);
    });

    it('GET /api/orders should return orders for user', async () => {
        // Seed
        await new Promise(r => db.run("INSERT INTO orders (user_id, status) VALUES (?, 'paid')", [userId], r));
        
        const res = await request(app).get('/api/orders').query({ userId, status: 'upcoming' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveLength(1);
    });
});
