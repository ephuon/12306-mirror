
/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import PassengerList from '../../../src/pages/center/PassengerList';
import app from '../../../../backend/src/index'; 
import db from '../../../../backend/src/database/init_db'; 
import operations from '../../../../backend/src/database/operations';

// [GLOBALS]
let server;
let lastApiResponse = null; 
let testUserId;

describe('Full-Stack Integration: <PassengerList />', () => {

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

    // Create a test user in DB
    const userData = {
        username: 'frontend_test_user',
        password: 'password',
        id_type: '1',
        id_card: '123456789012345678',
        real_name: 'Frontend User',
        phone: '13800138002',
        email: 'frontend@example.com',
        type: '1'
    };
    // Clean up if exists
    await new Promise(resolve => {
        db.run('DELETE FROM users WHERE username = ?', [userData.username], () => resolve());
    });
    testUserId = await operations.createUser(userData);
  });

  afterAll((done) => {
    // Cleanup
    db.run('DELETE FROM passengers WHERE user_id = ?', [testUserId], () => {
        db.run('DELETE FROM users WHERE id = ?', [testUserId], () => {
            server?.close(done);
        });
    });
  });

  beforeEach(async () => {
    lastApiResponse = null;
    vi.stubGlobal('localStorage', {
        getItem: (key) => {
            if (key === 'user') return JSON.stringify({ id: testUserId, username: 'frontend_test_user' });
            return null;
        },
        setItem: vi.fn(),
        removeItem: vi.fn()
    });

    // Seed data
    await new Promise(resolve => {
        db.run('DELETE FROM passengers WHERE user_id = ?', [testUserId], () => resolve());
    });
    await operations.addPassenger({
        user_id: testUserId,
        name: 'Existing Passenger',
        id_type: '1',
        id_no: '888888',
        phone: '13888888888',
        type: '成人'
    });
  });

  it('renders passenger list from backend', async () => {
    render(<BrowserRouter><PassengerList /></BrowserRouter>);

    // Verify loading state first
    expect(screen.getByText('加载中...')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
        expect(screen.getByText(/乘车人管理/i)).toBeInTheDocument();
        expect(screen.getByText('Existing Passenger')).toBeInTheDocument();
        expect(screen.getByText('13888888888')).toBeInTheDocument();
    });
  });

  it('searches passengers by name', async () => {
    // Add another passenger
    await operations.addPassenger({
        user_id: testUserId,
        name: 'Target Person',
        id_type: '1',
        id_no: '777777',
        phone: '13777777777',
        type: '成人'
    });

    render(<BrowserRouter><PassengerList /></BrowserRouter>);

    await waitFor(() => {
        expect(screen.getByText('Existing Passenger')).toBeInTheDocument();
        expect(screen.getByText('Target Person')).toBeInTheDocument();
    });

    // Search
    const searchInput = screen.getByPlaceholderText('输入姓名搜索');
    fireEvent.change(searchInput, { target: { value: 'Target' } });
    fireEvent.click(screen.getByText('搜索'));

    await waitFor(() => {
         expect(screen.queryByText('Existing Passenger')).not.toBeInTheDocument();
         expect(screen.getByText('Target Person')).toBeInTheDocument();
     });
   });

   it('adds a new passenger', async () => {
      render(<BrowserRouter><PassengerList /></BrowserRouter>);

      // Wait for loading to finish
      await waitFor(() => {
          expect(screen.getByText('添加乘车人')).toBeInTheDocument();
      });
 
      // Open Add Modal
      fireEvent.click(screen.getByText('添加乘车人'));
      expect(screen.getByText('基本信息')).toBeInTheDocument(); // Header in Modal

     // Fill form
     fireEvent.change(screen.getByLabelText('姓名'), { target: { value: 'New User' } });
     fireEvent.change(screen.getByLabelText('证件号码'), { target: { value: '123123123123123123' } });
     fireEvent.change(screen.getByLabelText('手机号'), { target: { value: '13600136000' } });

     // Submit
     const saveBtn = screen.getByRole('button', { name: '保存' });
     fireEvent.click(saveBtn);

     // Verify update (Mock backend should return success, and component should re-fetch)
     // We need to mock the POST request handler in the test setup if we want it to actually work with the real backend logic, 
     // or rely on the integration test server. 
     // Since we are using a real backend server (spawned in beforeAll), the POST request will go to the SQLite DB.
     // So this is a real end-to-end integration test!
     
     await waitFor(() => {
         expect(screen.getByText('New User')).toBeInTheDocument();
     });
   });
 });
