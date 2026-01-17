import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/index';
import db from '../../src/database/init_db';

const runSql = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

describe('API: Cancel Order', () => {
    let server;
    let userId;
    let orderId;

    beforeAll(async () => {
        server = app.listen(0);
    });

    afterAll((done) => {
        server.close(done);
    });

    beforeEach(async () => {
        await runSql('DELETE FROM users');
        await runSql('DELETE FROM orders');
        
        const userResult = await runSql(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            ['apiuser', 'pass']
        );
        userId = userResult.lastID;

        const orderResult = await runSql(
            `INSERT INTO orders (user_id, train_number, status) 
             VALUES (?, ?, ?)`,
            [userId, 'G2002', 'pending']
        );
        orderId = orderResult.lastID;
    });

    it('should cancel order via API', async () => {
        const res = await request(app)
            .put(`/api/orders/${orderId}/cancel`)
            .send({ userId });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        const row = await new Promise((resolve, reject) => {
             db.get('SELECT status FROM orders WHERE id = ?', [orderId], (err, row) => {
                 if(err) reject(err); else resolve(row);
             });
        });
        expect(row.status).toBe('cancelled');
    });

    it('should return 403 if limit exceeded', async () => {
         // Create 3 cancelled orders
         for (let i = 0; i < 3; i++) {
            await runSql(
                `INSERT INTO orders (user_id, status, cancelled_at) 
                 VALUES (?, ?, datetime('now'))`,
                [userId, 'cancelled']
            );
        }

        const res = await request(app)
            .put(`/api/orders/${orderId}/cancel`)
            .send({ userId });
            
        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/limit exceeded/i);
    });

    it('should return 400 if order cannot be cancelled', async () => {
        // First cancel it
        await request(app).put(`/api/orders/${orderId}/cancel`).send({ userId });
        
        // Try again
        const res = await request(app)
            .put(`/api/orders/${orderId}/cancel`)
            .send({ userId });
            
        expect(res.status).toBe(400);
    });
});
