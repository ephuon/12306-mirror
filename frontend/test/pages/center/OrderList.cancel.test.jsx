/**
 * @vitest-environment jsdom
 */
import React from 'react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

expect.extend(matchers);

import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import OrderList from '../../../src/pages/center/OrderList';
import app from '../../../../backend/src/index';
import db from '../../../../backend/src/database/init_db';

let server;
let lastApiResponse = null;

describe('Full-Stack Integration: Cancel Order in OrderList', () => {
    let userId;

    beforeAll(async () => {
        server = await new Promise(resolve => {
            const s = app.listen(0, '127.0.0.1', () => resolve(s));
        });
        const port = server.address().port;
        axios.defaults.baseURL = `http://127.0.0.1:${port}`;
        axios.interceptors.response.use((response) => {
            lastApiResponse = response.data;
            return response;
        });
    });

    afterAll((done) => server?.close(done));

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    beforeEach(async () => {
        lastApiResponse = null;
        
        // Mock User
        const user = { id: 999, username: 'frontend_user' };
        
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn((key) => {
                    if (key === 'user') return JSON.stringify(user);
                    if (key === 'token') return 'mock-token';
                    return null;
                }),
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn()
            },
            writable: true
        });
        
        userId = user.id;

        // DB Setup
        await new Promise(resolve => db.run('DELETE FROM orders', resolve));
        await new Promise(resolve => db.run('DELETE FROM users', resolve));
        await new Promise(resolve => db.run('INSERT INTO users (id, username) VALUES (?, ?)', [userId, user.username], resolve));
        
        // Insert a pending order
        await new Promise(resolve => db.run(
            `INSERT INTO orders (user_id, train_number, status, total_amount, departure_date, departure_time, arrival_time, departure_station_id, arrival_station_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, 'G-Test', 'pending', 100.0, '2023-12-31', '10:00', '12:00', 1, 2], 
            resolve
        ));
    });

    // Layer 1: Check API call
    it('calls axios.get', async () => {
        // Mock localStorage
        vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify({ id: 999 }));
        
        // Mock implementation to avoid network call
        const spy = vi.spyOn(axios, 'get').mockResolvedValue({ data: [] });
        render(<BrowserRouter><OrderList /></BrowserRouter>);
        expect(spy).toHaveBeenCalledWith('/api/orders', expect.objectContaining({ params: { userId: 999, status: 'upcoming' } }));
    });

    // Layer 2: UI Rendering
    it('renders initial UI elements correctly', async () => {
        vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify({ id: 999 }));
        
        render(<BrowserRouter><OrderList /></BrowserRouter>);
        // Wait for any potential effect to settle
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /火车票订单/i })).toBeInTheDocument();
        });
        expect(screen.getByRole('button', { name: /未出行/i })).toBeInTheDocument();
    });

    // Layer 3: Interaction & Logic
    it('cancels order when button clicked and confirmed', async () => {
        userId = 999;
        vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify({ id: userId }));
        // Mock window.confirm
        vi.spyOn(window, 'confirm').mockImplementation(() => true);
        
        render(<BrowserRouter><OrderList /></BrowserRouter>);
        
        const trainInfo = await screen.findByText(/G-Test/, {}, { timeout: 3000 });
        const card = trainInfo.closest('.order-card');
        const orderIdText = within(card).getByText(/订单号:/).textContent;

        const cancelBtn = within(card).getByText('取消订单');

        // Clear previous API response (from initial load)
        lastApiResponse = null;

        fireEvent.click(cancelBtn);

        await waitFor(() => {
            // Check API call success
            if (!lastApiResponse) throw new Error('No API response yet');
            expect(lastApiResponse).toMatchObject({ success: true });
        }, { timeout: 3000 });

        // Check DB status directly
        const order = await new Promise((resolve, reject) => {
            db.get('SELECT status FROM orders WHERE train_number = ?', ['G-Test'], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        expect(order.status).toBe('cancelled');

        // After cancellation, the order should disappear from "Upcoming" tab (default)
        // because cancelled orders belong to "History"
        await waitFor(() => {
             // Expect "No orders" message
             expect(screen.getByText('暂无订单')).toBeInTheDocument();
             // And G-Test to be gone
             expect(screen.queryByText(/G-Test/)).not.toBeInTheDocument();
        }, { timeout: 3000 });

        // Switch to History tab to verify it's there
        const historyTab = screen.getByText('历史订单');
        fireEvent.click(historyTab);

        await waitFor(() => {
            expect(screen.getByText(/G-Test/)).toBeInTheDocument();
            expect(screen.getByText('已取消')).toBeInTheDocument();
        });
    });
});
