import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/index';
import db from '../../src/database/init_db';
import operations from '../../src/database/operations';

describe('API Routes: POST /api/login', () => {
  beforeEach(async () => {
    await new Promise((resolve) => db.run('DELETE FROM users', resolve));
    
    // Seed a user
    await operations.createUser({
        username: 'apiuser',
        password: 'Password123!',
        id_type: '1',
        id_card: '110101199001011234',
        real_name: 'API User',
        phone: '13900139000',
        email: 'api@example.com',
        type: 1
    });
  });

  it('should return 200 and token on success', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'apiuser', password: 'Password123!' });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.username).toBe('apiuser');
  });

  it('should return 401 on invalid credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'apiuser', password: 'WrongPassword' });
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid username or password');
  });
});
