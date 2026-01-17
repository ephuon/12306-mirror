import request from 'supertest';
import app from '../../src/index';
import db from '../../src/database/init_db';
import { describe, it, expect, beforeEach } from 'vitest';

describe('API Integration: User Registration', () => {
  beforeEach(async () => {
    await new Promise((resolve) => {
        db.run('DELETE FROM users', resolve);
    });
  });

  it('POST /api/register - should register a new user', async () => {
    const userData = {
      username: 'apiuser',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      id_type: '居民身份证',
      id_card: '110101199001011234',
      real_name: '李四',
      phone: '13900139000',
      type: '成人',
      agreed: true
    };

    const res = await request(app)
      .post('/api/register')
      .send(userData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
  });

  it('POST /api/register - should fail validation', async () => {
    const userData = {
      username: '123invalid', // Invalid username
      password: '123',
      // Missing fields
    };

    const res = await request(app)
      .post('/api/register')
      .send(userData);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
