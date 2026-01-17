import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/index';
import db from '../../src/database/init_db';
import operations from '../../src/database/operations';

describe('Forgot Password API', () => {
  beforeEach(async () => {
    await new Promise((resolve) => db.run('DELETE FROM users', resolve));
    await new Promise((resolve) => db.run('DELETE FROM verification_codes', resolve));

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

  it('POST /api/forgot-password/verify-user should return success', async () => {
    const res = await request(app)
      .post('/api/forgot-password/verify-user')
      .send({
        username: 'testuser',
        realName: 'Test User',
        idCard: '110101199001011234',
        phone: '13800138000'
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/forgot-password/send-code should return success', async () => {
    const res = await request(app)
      .post('/api/forgot-password/send-code')
      .send({ phone: '13800138000' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // In real env, we check DB, but here we trust response
  });

  it('POST /api/forgot-password/verify-code should verify code', async () => {
    // Manually insert code
    await operations.storeVerificationCode('13800138000', '123456');

    const res = await request(app)
      .post('/api/forgot-password/verify-code')
      .send({ phone: '13800138000', code: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/forgot-password/reset should update password', async () => {
    const res = await request(app)
      .post('/api/forgot-password/reset')
      .send({ username: 'testuser', newPassword: 'NewPassword123!' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify login with new password
    const loginRes = await request(app)
        .post('/api/login')
        .send({ username: 'testuser', password: 'NewPassword123!' });
    expect(loginRes.status).toBe(200);
  });
});
