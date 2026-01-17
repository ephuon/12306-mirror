
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

describe('Full-Stack Integration: Delete Passenger', () => {
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
    
    // Seed Data
    await new Promise(resolve => {
         db.run('DELETE FROM passengers', [], () => resolve());
    });
    
    // Mock LocalStorage
    const user = { id: 123, username: 'testuser' };
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
    
    // Insert a passenger directly into DB for deletion
    await new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO passengers (user_id, name, id_type, id_no, phone, type) VALUES (?, ?, ?, ?, ?, ?)');
        stmt.run(123, 'To Be Deleted', '1', '123456', '13900000000', '成人', function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
        stmt.finalize();
    });
  });

  it('deletes a passenger after confirmation', async () => {
    render(<BrowserRouter><PassengerList /></BrowserRouter>);

    // 1. Wait for list to load
    await waitFor(() => {
        expect(screen.getByText('To Be Deleted')).toBeInTheDocument();
    });

    // 2. Click Delete button
    // Find the row containing the passenger, then find the delete button
    const deleteBtns = screen.getAllByText('删除');
    fireEvent.click(deleteBtns[0]);

    // 3. Expect Confirmation Modal
    await waitFor(() => {
        expect(screen.getByText('确认删除')).toBeInTheDocument();
        expect(screen.getByText('确定要删除该乘车人吗？')).toBeInTheDocument();
    });

    // 4. Click Confirm
    fireEvent.click(screen.getByText('确定'));

    // 5. Verify API call and UI update
    await waitFor(() => {
        // API success
        expect(lastApiResponse).not.toBeNull();
        expect(lastApiResponse.success).toBe(true);
        // UI update: item should be gone
        expect(screen.queryByText('To Be Deleted')).not.toBeInTheDocument();
    });
  });
});
