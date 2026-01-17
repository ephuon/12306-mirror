import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import db from '../../src/database/init_db';
import operations from '../../src/database/operations';

describe('Forgot Password Operations', () => {
  beforeEach(async () => {
    // Clear tables
    await new Promise((resolve) => db.run('DELETE FROM users', resolve));
    await new Promise((resolve) => db.run('DELETE FROM verification_codes', resolve));

    // Seed User
    await operations.createUser({
      username: 'testuser',
      password: 'OldPassword123!',
      id_type: '1',
      id_card: '110101199001011234',
      real_name: 'Test User',
      phone: '13800138000',
      email: 'test@example.com',
      type: 1
    });
  });

  describe('verifyUserIdentity', () => {
    it('should verify identity successfully', async () => {
      const result = await operations.verifyUserIdentity({
        username: 'testuser',
        realName: 'Test User',
        idCard: '110101199001011234',
        phone: '13800138000'
      });
      expect(result).toBe(true);
    });

    it('should fail if user does not exist', async () => {
      await expect(operations.verifyUserIdentity({
        username: 'nonexistent',
        realName: 'Test User',
        idCard: '110101199001011234',
        phone: '13800138000'
      })).rejects.toThrow('User not found');
    });

    it('should fail if details mismatch', async () => {
      await expect(operations.verifyUserIdentity({
        username: 'testuser',
        realName: 'Wrong Name',
        idCard: '110101199001011234',
        phone: '13800138000'
      })).rejects.toThrow('Identity verification failed');
    });
  });

  describe('Verification Code', () => {
    it('should store and verify code', async () => {
      const phone = '13800138000';
      const code = '123456';
      
      await operations.storeVerificationCode(phone, code);
      
      const result = await operations.verifyCode(phone, code);
      expect(result).toBe(true);
    });

    it('should fail verification with wrong code', async () => {
      const phone = '13800138000';
      const code = '123456';
      await operations.storeVerificationCode(phone, code);
      
      await expect(operations.verifyCode(phone, '654321')).rejects.toThrow('Invalid or expired verification code');
    });
  });

  describe('updatePassword', () => {
    it('should update password', async () => {
      await operations.updatePassword('testuser', 'NewPassword123!');
      
      const user = await operations.loginUser({ username: 'testuser', password: 'NewPassword123!' });
      expect(user).toBeDefined();
    });
  });
});
