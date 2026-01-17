import { describe, it, expect, beforeEach } from 'vitest';
import db from '../../src/database/init_db';
import operations from '../../src/database/operations';

describe('Database Operations: User Registration', () => {
  beforeEach(async () => {
    await new Promise((resolve) => {
        db.run('DELETE FROM users', resolve);
    });
  });

  it('should create a new user successfully', async () => {
    const userData = {
      username: 'testuser',
      password: 'password123',
      id_type: '居民身份证',
      id_card: '110101199001011234',
      real_name: '张三',
      phone: '13800138000',
      email: 'test@example.com',
      type: 1 // 1 for Adult
    };

    const userId = await operations.createUser(userData);
    expect(userId).toBeDefined();

    // Verify in DB
    await new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
            if (err) reject(err);
            else {
                expect(row).toBeDefined();
                expect(row.username).toBe('testuser');
                expect(row.real_name).toBe('张三');
                resolve();
            }
        });
    });
  });

  it('should fail to create user with existing username', async () => {
    const userData = {
      username: 'existinguser',
      password: 'password123',
      id_type: '居民身份证',
      id_card: '110101199001011234',
      real_name: '张三',
      phone: '13800138000',
      type: 1
    };

    await operations.createUser(userData);

    await expect(operations.createUser(userData)).rejects.toThrow();
  });
});
