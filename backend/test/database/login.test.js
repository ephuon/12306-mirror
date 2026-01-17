import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import operations from '../../src/database/operations';
import db from '../../src/database/init_db';

describe('Database Operations: loginUser', () => {
  beforeEach(async () => {
    await new Promise((resolve) => db.run('DELETE FROM users', resolve));
    await new Promise((resolve) => db.run('DELETE FROM login_attempts', resolve));
    
    // Seed a user
    await operations.createUser({
        username: 'testuser',
        password: 'Password123!',
        id_type: '1',
        id_card: '110101199001011234',
        real_name: 'Test User',
        phone: '13800138000',
        email: 'test@example.com',
        type: 1
    });
  });

  it('should login successfully with username', async () => {
    const user = await operations.loginUser({ username: 'testuser', password: 'Password123!' });
    expect(user).toBeDefined();
    expect(user.username).toBe('testuser');
  });

  it('should login successfully with phone', async () => {
    const user = await operations.loginUser({ username: '13800138000', password: 'Password123!' });
    expect(user).toBeDefined();
    expect(user.phone).toBe('13800138000');
  });

  it('should login successfully with email', async () => {
    const user = await operations.loginUser({ username: 'test@example.com', password: 'Password123!' });
    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });

  it('should fail with incorrect password', async () => {
    await expect(operations.loginUser({ username: 'testuser', password: 'WrongPassword' }))
      .rejects.toThrow('Invalid username or password');
  });

  it('should fail with non-existent user', async () => {
    await expect(operations.loginUser({ username: 'nonexistent', password: 'Password123!' }))
      .rejects.toThrow('Invalid username or password');
  });
});
