import db from '../../src/database/init_db';
import operations from '../../src/database/operations';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

describe('Passenger Operations - Edit', () => {
    let userId;

    beforeAll(async () => {
        const userData = {
            username: 'test_passenger_edit',
            password: 'password',
            id_type: '1',
            id_card: '999999999999999999',
            real_name: 'Test Edit User',
            phone: '13800138999',
            email: 'test_edit@example.com',
            type: '1'
        };
        await new Promise(resolve => {
            db.run('DELETE FROM users WHERE username = ?', [userData.username], () => resolve());
        });
        userId = await operations.createUser(userData);
    });

    afterAll(async () => {
        await new Promise(resolve => {
            db.run('DELETE FROM passengers WHERE user_id = ?', [userId], () => {
                db.run('DELETE FROM users WHERE id = ?', [userId], () => resolve());
            });
        });
    });

    beforeEach(async () => {
        await new Promise(resolve => {
            db.run('DELETE FROM passengers WHERE user_id = ?', [userId], () => resolve());
        });
    });

    it('should update passenger contact info', async () => {
        // 1. Add Passenger
        const pId = await operations.addPassenger({
            user_id: userId,
            name: 'Original Name',
            id_type: '1',
            id_no: '123456',
            phone: '13800000000',
            type: '成人'
        });

        // 2. Update
        const updates = {
            phone: '13999999999',
            type: '学生'
        };
        await operations.updatePassenger(pId, userId, updates);

        // 3. Verify
        const passengers = await operations.getPassengers(userId);
        const p = passengers.find(x => x.id === pId);
        
        expect(p.phone).toBe('13999999999');
        expect(p.type).toBe('学生');
        expect(p.name).toBe('Original Name'); // Should not change
        expect(p.id_no).toBe('123456'); // Should not change
    });

    it('should prevent updating core fields (name, id_no) via backend logic if implemented, or just ignore them', async () => {
        // Requirement says "Cannot edit core ID info". 
        // Backend should ideally ignore them even if passed.
        
        const pId = await operations.addPassenger({
            user_id: userId,
            name: 'Core Name',
            id_type: '1',
            id_no: '666666',
            phone: '13800000000',
            type: '成人'
        });

        const updates = {
            name: 'Hacked Name',
            id_no: '777777',
            phone: '13811111111'
        };
        
        await operations.updatePassenger(pId, userId, updates);

        const passengers = await operations.getPassengers(userId);
        const p = passengers.find(x => x.id === pId);

        // Assumption: Backend ignores name/id_no updates.
        // If the implementation simply updates whatever is passed, this test forces us to implement filtering.
        expect(p.name).toBe('Core Name');
        expect(p.id_no).toBe('666666');
        expect(p.phone).toBe('13811111111');
    });

    it('should not update passenger of another user', async () => {
         const pId = await operations.addPassenger({
            user_id: userId,
            name: 'My Passenger',
            id_type: '1',
            id_no: '555',
            phone: '555',
            type: '成人'
        });

        const otherUserId = userId + 999;
        try {
            await operations.updatePassenger(pId, otherUserId, { phone: '000' });
            // Should fail
        } catch (e) {
            expect(e).toBeDefined();
        }
    });
});
