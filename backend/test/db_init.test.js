import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import db from '../src/database/init_db';

describe('Database Initialization', () => {
  it('should have users table created', async () => {
    return new Promise((resolve, reject) => {
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users';", (err, row) => {
        if (err) reject(err);
        try {
          expect(row).toBeDefined();
          expect(row.name).toBe('users');
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  it('users table should have correct schema', async () => {
     return new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(users);", (err, rows) => {
        if (err) reject(err);
        try {
            const columns = rows.map(r => r.name);
            expect(columns).toContain('id');
            expect(columns).toContain('username');
            expect(columns).toContain('password');
            expect(columns).toContain('id_type');
            expect(columns).toContain('id_card');
            expect(columns).toContain('real_name');
            expect(columns).toContain('phone');
            expect(columns).toContain('type');
            resolve();
        } catch (e) {
            reject(e);
        }
      });
    });
  });
});
