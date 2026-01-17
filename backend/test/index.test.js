import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('Server Entry Point', () => {
  it('GET / should return 200 OK', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ code: 200, message: 'Backend Ready' });
  });
});
