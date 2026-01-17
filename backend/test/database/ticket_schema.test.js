import { describe, it, expect, beforeEach } from 'vitest';
import db from '../../src/database/init_db';

describe('Ticket Query Infrastructure', () => {
  beforeEach(async () => {
    // Clean up
    await new Promise(resolve => db.run('DELETE FROM train_station_mapping', resolve));
    await new Promise(resolve => db.run('DELETE FROM trains', resolve));
    await new Promise(resolve => db.run('DELETE FROM stations', resolve));
  });

  it('should have stations table', async () => {
    await new Promise((resolve, reject) => {
        db.run(`INSERT INTO stations (name, code, city_name) VALUES (?, ?, ?)`, 
            ['北京南测试', 'BJP_TEST', '北京'], 
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
    
    const row = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM stations WHERE name = ?', ['北京南测试'], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
    expect(row).toBeDefined();
    expect(row.code).toBe('BJP_TEST');
  });

  it('should have trains table', async () => {
    await new Promise((resolve, reject) => {
        db.run(`INSERT INTO trains (train_number, type) VALUES (?, ?)`, 
            ['G1', 'G'], 
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });

    const row = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM trains WHERE train_number = ?', ['G1'], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
    expect(row).toBeDefined();
    expect(row.type).toBe('G');
  });

  it('should have mapping table', async () => {
    // Insert station and train first
    const stationId = await new Promise((resolve) => {
        db.run(`INSERT INTO stations (name, code, city_name) VALUES (?, ?, ?)`, ['上海虹桥', 'SHH', '上海'], function() { resolve(this.lastID); });
    });
    const trainId = await new Promise((resolve) => {
        db.run(`INSERT INTO trains (train_number, type) VALUES (?, ?)`, ['G1', 'G'], function() { resolve(this.lastID); });
    });

    await new Promise((resolve, reject) => {
        db.run(`INSERT INTO train_station_mapping (train_id, station_id, arrival_time, departure_time, stop_order) VALUES (?, ?, ?, ?, ?)`, 
            [trainId, stationId, '09:00', '09:05', 1], 
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });

    const row = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM train_station_mapping WHERE train_id = ? AND station_id = ?', [trainId, stationId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
    expect(row).toBeDefined();
    expect(row.arrival_time).toBe('09:00');
  });
});
