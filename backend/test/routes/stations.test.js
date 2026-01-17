import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/index';
import db from '../../src/database/init_db';

describe('Station API', () => {
  let server;

  beforeAll(async () => {
    server = await new Promise(resolve => {
      const s = app.listen(0, () => resolve(s));
    });

    // Wait for DB initialization (create table stations)
    const waitForTable = async (retries = 10) => {
        for (let i = 0; i < retries; i++) {
            try {
                await new Promise((resolve, reject) => {
                    db.get("SELECT count(*) FROM stations", (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                return;
            } catch (e) {
                await new Promise(r => setTimeout(r, 200));
            }
        }
        throw new Error('Database initialization failed: stations table not found');
    };
    await waitForTable();

    // Ensure test data exists
    await new Promise((resolve, reject) => {
      db.run(`INSERT OR IGNORE INTO stations (name, code, pinyin, initial, city_code, city_name) VALUES 
        ('北京南', 'VNP', 'beijingnan', 'bj', '010', '北京')`, (err) => {
          if (err) reject(err);
          else resolve();
        });
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('GET /api/stations should return all stations', async () => {
    const res = await request(server).get('/api/stations');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/stations/search?q=Beijing should return Beijing stations', async () => {
    const res = await request(server).get('/api/stations/search?q=北京');
    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toContain('北京');
  });
});
