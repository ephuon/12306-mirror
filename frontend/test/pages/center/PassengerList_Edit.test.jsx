// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import app from '../../../../backend/src/index'; 
import db from '../../../../backend/src/database/init_db'; 
import PassengerList from '../../../src/pages/center/PassengerList';

let server;
let lastApiResponse = null; 
let testUserId = 999;

describe('Full-Stack Integration: Edit Passenger', () => {
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

  beforeEach(async () => {
    lastApiResponse = null;
    vi.stubGlobal('location', { href: 'http://localhost/', assign: vi.fn() });
    
    // Mock LocalStorage
    const user = { id: testUserId, username: 'testuser' };
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => {
            if (key === 'user') return JSON.stringify(user);
            return null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
    
    // Seed Data
    await new Promise(resolve => {
         db.run('DELETE FROM passengers', [], () => resolve());
    });
    
    // Insert a passenger to edit
    await new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO passengers (user_id, name, id_type, id_no, phone, type) VALUES (?, ?, ?, ?, ?, ?)');
        stmt.run(testUserId, 'Edit Target', '1', '123456', '13900000000', '成人', function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
        stmt.finalize();
    });
  });

  it('opens edit modal with read-only fields and updates data', async () => {
    render(<BrowserRouter><PassengerList /></BrowserRouter>);

    // 1. Wait for list
    await waitFor(() => {
        expect(screen.getByText('Edit Target')).toBeInTheDocument();
    });

    // 2. Click Edit button
    // Assuming "编辑" button exists
    const editBtns = screen.getAllByText('编辑');
    fireEvent.click(editBtns[0]);

    // 3. Verify Modal Content & Read-Only constraints
    await waitFor(() => {
        expect(screen.getByText('编辑乘车人')).toBeInTheDocument(); // Expect title change or distinct modal
    });
    
    const nameInput = screen.getByLabelText('姓名');
    const idInput = screen.getByLabelText('证件号码');
    const phoneInput = screen.getByLabelText('手机号');
    
    expect(nameInput).toBeDisabled();
    expect(idInput).toBeDisabled();
    expect(phoneInput).not.toBeDisabled();
    expect(nameInput).toHaveValue('Edit Target');

    // 4. Modify Phone
    fireEvent.change(phoneInput, { target: { value: '13811112222' } });

    // 5. Save
    fireEvent.click(screen.getByText('保存'));

    // 6. Verify API & UI
    await waitFor(() => {
        expect(lastApiResponse).not.toBeNull();
        expect(lastApiResponse.success).toBe(true);
        // Verify list update
        expect(screen.getByText('13811112222')).toBeInTheDocument();
    });
  });
});
