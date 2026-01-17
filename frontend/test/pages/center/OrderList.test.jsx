
import React from 'react';
// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import app from '../../../../backend/src/index'; 
import db from '../../../../backend/src/database/init_db'; 
import OrderList from '../../../src/pages/center/OrderList';

// [GLOBALS]
let server;
let lastApiResponse = null; 

describe('Full-Stack Integration: <OrderList />', () => {

  // ================= 1. Lifecycle: Server & Network Spy =================
  beforeAll(async () => {
    server = await new Promise(resolve => {
      const s = app.listen(0, () => resolve(s));
    });
    const port = server.address().port;
    axios.defaults.baseURL = `http://localhost:${port}`;
    
    axios.interceptors.response.use((response) => {
      lastApiResponse = response.data; 
      return response; 
    });
  });

  afterAll((done) => server?.close(done));

  // ================= 2. Lifecycle: Data Seeding & Mocks =================
  let userId;
  beforeEach(async () => {
    lastApiResponse = null; 
    vi.stubGlobal('localStorage', {
      getItem: (key) => {
        if (key === 'user') return JSON.stringify({ id: userId, username: 'test_user' });
        return null;
      }
    });
    
    // Seed User
    await new Promise(r => db.run("DELETE FROM users WHERE username = 'test_user'", r));
    await new Promise(r => {
        db.run("INSERT INTO users (username) VALUES ('test_user')", function() {
            userId = this.lastID;
            r();
        });
    });

    // Seed Orders
    await new Promise(r => db.run("DELETE FROM orders", r));
    await new Promise(r => db.run("DELETE FROM order_items", r));
  });

  it('renders upcoming orders by default', async () => {
    // Seed one upcoming order
    await new Promise(r => db.run("INSERT INTO orders (user_id, status, train_number) VALUES (?, 'paid', 'G1001')", [userId], r));

    render(<BrowserRouter><OrderList /></BrowserRouter>);

    await waitFor(() => {
        expect(screen.getByText(/G1001/)).toBeInTheDocument();
        expect(screen.getByText('已支付')).toBeInTheDocument();
    });
  });

  it('switches to history orders', async () => {
    // Seed one history order
    await new Promise(r => db.run("INSERT INTO orders (user_id, status, train_number) VALUES (?, 'completed', 'G2002')", [userId], r));

    render(<BrowserRouter><OrderList /></BrowserRouter>);

    // Initially shouldn't see history order (since default is upcoming)
    expect(screen.queryByText(/G2002/)).not.toBeInTheDocument();

    // Click History tab
    fireEvent.click(screen.getByText('历史订单'));

    await waitFor(() => {
        expect(screen.getByText(/G2002/)).toBeInTheDocument();
        expect(screen.getByText('已完成')).toBeInTheDocument();
    });
  });
});
