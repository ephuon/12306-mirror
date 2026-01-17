
import db from '../../src/database/init_db';
import operations from '../../src/database/operations';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

describe('Passenger Operations', () => {
    let userId;

    beforeAll(async () => {
        // Create a user for testing
        const userData = {
            username: 'test_passenger_user',
            password: 'password',
            id_type: '1',
            id_card: '123456789012345678',
            real_name: 'Test User',
            phone: '13800138000',
            email: 'test@example.com',
            type: '1'
        };
        // Clean up if exists
        await new Promise(resolve => {
            db.run('DELETE FROM users WHERE username = ?', [userData.username], () => resolve());
        });
        userId = await operations.createUser(userData);
    });

    afterAll(async () => {
        // Cleanup
        await new Promise(resolve => {
            db.run('DELETE FROM passengers WHERE user_id = ?', [userId], () => {
                db.run('DELETE FROM users WHERE id = ?', [userId], () => resolve());
            });
        });
    });

    beforeEach(async () => {
        // Clear passengers for this user
        await new Promise(resolve => {
            db.run('DELETE FROM passengers WHERE user_id = ?', [userId], () => resolve());
        });
    });

    it('should add and retrieve passengers', async () => {
        const passengerData = {
            user_id: userId,
            name: 'Passenger 1',
            id_type: '1',
            id_no: '111111111111111111',
            phone: '13900139000',
            type: '成人'
        };

        const id = await operations.addPassenger(passengerData);
        expect(id).toBeDefined();

        const passengers = await operations.getPassengers(userId);
        expect(passengers).toHaveLength(1);
        expect(passengers[0].name).toBe('Passenger 1');
    });

    it('should search passengers by name', async () => {
        await operations.addPassenger({
            user_id: userId,
            name: 'Alice',
            id_type: '1',
            id_no: '222',
            phone: '123',
            type: '成人'
        });
        await operations.addPassenger({
            user_id: userId,
            name: 'Bob',
            id_type: '1',
            id_no: '333',
            phone: '456',
            type: '成人'
        });

        const results = await operations.searchPassengers(userId, 'Ali');
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Alice');

        const all = await operations.searchPassengers(userId, '');
        expect(all).toHaveLength(2);
    });
});
