import React from 'react';
// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import app from '../../../../backend/src/index'; 
import db from '../../../../backend/src/database/init_db'; 
import BookingPage from '../../../src/pages/order/BookingPage';

let server;
let lastApiResponse = null; 

describe('Full-Stack Integration: <BookingPage />', () => {
  let userId;
  let passengerId;

  const runSql = (sql, params = []) => {
      return new Promise((resolve, reject) => {
          db.run(sql, params, function(err) {
              if (err) reject(err);
              else resolve(this);
          });
      });
  };

  beforeAll(async () => {
    // Mock localStorage
    const localStorageMock = (function() {
      let store = {};
      return {
        getItem: function(key) {
          return store[key] || null;
        },
        setItem: function(key, value) {
          store[key] = value.toString();
        },
        clear: function() {
          store = {};
        },
        removeItem: function(key) {
          delete store[key];
        }
      };
    })();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    server = await new Promise(resolve => {
        const s = app.listen(0, () => resolve(s));
    });
    const port = server.address().port;
    axios.defaults.baseURL = `http://localhost:${port}`;
    axios.interceptors.response.use((response) => {
        lastApiResponse = response.data;
        return response;
    });

    // Create User & Passenger
    const userRes = await runSql("INSERT INTO users (username, password, phone, real_name, id_card, type) VALUES (?, ?, ?, ?, ?, ?)", ['fe_booking_test', 'pass', '13700000000', 'FE Test', '110101199001017777', 1]);
    userId = userRes.lastID;
    
    const pRes = await runSql("INSERT INTO passengers (user_id, name, id_no, type) VALUES (?, ?, ?, ?)", [userId, 'Test Passenger', '110101199001016666', 'adult']);
    passengerId = pRes.lastID;
  });

  afterAll(async () => {
    await runSql("DELETE FROM users WHERE id = ?", [userId]);
    server?.close();
  });

  beforeEach(() => {
    lastApiResponse = null;
    localStorage.setItem('user', JSON.stringify({ id: userId, name: 'FE Test' }));
    // Mock window.location
    vi.stubGlobal('location', { href: 'http://localhost/', assign: vi.fn() });
  });

  it('renders train info and passengers, then submits order', async () => {
    const trainInfo = {
        trainNumber: 'G9999',
        fromStation: 'Beijing',
        toStation: 'Shanghai',
        date: '2026-02-01',
        departureTime: '08:00',
        arrivalTime: '12:00'
    };

    render(
        <MemoryRouter initialEntries={[{ pathname: '/booking', state: { train: trainInfo } }]}>
            <Routes>
                <Route path="/booking" element={<BookingPage />} />
            </Routes>
        </MemoryRouter>
    );

    // 1. Verify Train Info Rendered
    expect(screen.getByText(/G9999/)).toBeInTheDocument();
    expect(screen.getByText(/Beijing/)).toBeInTheDocument();

    // 2. Verify Passengers Loaded (Wait for API)
    await waitFor(() => {
        expect(screen.getByText(/Test Passenger/)).toBeInTheDocument();
    });

    // 3. Select Passenger
    const checkbox = screen.getByLabelText(/Test Passenger/);
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // 4. Submit Order
    fireEvent.click(screen.getByText('提交订单'));

    // 5. Verify API Call & Result
    await waitFor(() => {
        expect(lastApiResponse).not.toBeNull();
        expect(lastApiResponse.success).toBe(true);
        expect(lastApiResponse.orderId).toBeDefined();
    });
  });
});
