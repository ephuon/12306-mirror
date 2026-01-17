/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import apiClient from '../../src/api';

// [IMPORTS]
import app from '../../../backend/src/index'; 
import db from '../../../backend/src/database/init_db'; 
import HomePage from '../../src/pages/HomePage';

// [GLOBALS]
let server;
let lastApiResponse = null; 

describe('Full-Stack Integration: <HomePage />', () => {

  // ================= 1. Lifecycle: Server & Network Spy =================
  beforeAll(async () => {
    server = await new Promise(resolve => {
      const s = app.listen(0, () => resolve(s));
    });
    const port = server.address().port;
    
    // Configure API Client to use test server
    apiClient.defaults.baseURL = `http://localhost:${port}/api`;

    // Wait for DB to be ready (stations table)
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
    };
    await waitForTable();
    
    // Ensure seed data
    await new Promise((resolve, reject) => {
        db.run(`INSERT OR IGNORE INTO stations (name, code, pinyin, initial, city_code, city_name) VALUES 
          ('北京南', 'VNP', 'beijingnan', 'bj', '010', '北京')`, (err) => {
            if (err) reject(err);
            else resolve();
          });
    });
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  // ================= 2. Lifecycle: Data Seeding & Mocks =================
  beforeEach(async () => {
    lastApiResponse = null; 
    vi.stubGlobal('location', { href: 'http://localhost/', assign: vi.fn() });
  });

  // ================= 3. Test Cases =================
  
  it('renders home page layout correctly', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Check for Logo (Image)
    const logo = screen.getByRole('img', { name: /logo/i });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src');

    // Check for Navigation links
    expect(screen.getByText(/首页/i)).toBeInTheDocument();
    
    // Check for Search Panel
    expect(screen.getByText(/车票查询/i)).toBeInTheDocument();
  });

  it('interacts with StationSelector to choose departure station', async () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Find Departure Input
    const inputs = screen.getAllByPlaceholderText('简拼/全拼/汉字');
    const departureInput = inputs[0]; // Assuming first is Departure

    fireEvent.focus(departureInput);

    // Wait for popup and stations
    await waitFor(() => {
        expect(screen.getByText('北京南')).toBeInTheDocument();
    });

    // Click station
    fireEvent.click(screen.getByText('北京南'));

    // Verify input value
    expect(departureInput.value).toBe('北京南');
  });
});
