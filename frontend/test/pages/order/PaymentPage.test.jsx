
/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import * as matchers from '@testing-library/jest-dom/matchers';
import app from '../../../../backend/src/index.js'; 
import db from '../../../../backend/src/database/init_db.js';
import PaymentPage from '../../../src/pages/order/PaymentPage';

expect.extend(matchers);

let server;
let lastApiResponse = null;

describe('PaymentPage Integration', () => {
    let userId;
    let orderId;

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
        vi.restoreAllMocks();
        
        // Setup DB
        await new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('DELETE FROM orders');
                db.run('DELETE FROM users');
                
                // Create user
                db.run("INSERT INTO users (username, password, real_name, id_card, phone, type) VALUES ('payuser', 'pass', 'Pay User', 'ID_PAY', '13900000000', 'USER')", function(err) {
                    if (err) return reject(err);
                    userId = this.lastID;
                    
                    // Create pending order
                    db.run("INSERT INTO orders (user_id, train_number, departure_time, status, created_at, total_amount) VALUES (?, 'G-PAY', '10:00', 'pending', datetime('now'), 100)", [userId], function(err) {
                        if (err) return reject(err);
                        orderId = this.lastID;
                        resolve();
                    });
                });
            });
        });

        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn((key) => {
                    if (key === 'user') return JSON.stringify({ id: userId, name: 'Pay User' });
                    return null;
                }),
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn()
            },
            writable: true
        });
        
        // Mock window.alert
        vi.spyOn(window, 'alert').mockImplementation(() => {});
    });

    it('renders order info and handles payment', async () => {
        render(
            <MemoryRouter initialEntries={[`/payment/${orderId}`]}>
                <Routes>
                    <Route path="/payment/:orderId" element={<PaymentPage />} />
                </Routes>
            </MemoryRouter>
        );
        
        // 1. Check loading or initial render
        // It might need to fetch order details first. 
        // If we don't implement GET /api/orders/:id, we might need to rely on passing state.
        // But for direct URL access, we need GET /api/orders/:id.
        // Let's assume the page fetches order details.
        
        await waitFor(() => {
             expect(screen.getByRole('heading', { name: /订单支付/i })).toBeInTheDocument();
             // Maybe check for train number if we implement fetching
             // expect(screen.getByText('G-PAY')).toBeInTheDocument();
        });

        // 2. Click Pay
        fireEvent.click(screen.getByRole('button', { name: /确认支付/i }));

        // 3. Verify API call and Success
        await waitFor(() => {
            expect(lastApiResponse).toMatchObject({ success: true });
        });
        
        // Wait a bit for DB update
        await new Promise(r => setTimeout(r, 100));

        // 4. Verify DB status
        const order = await new Promise((resolve, reject) => {
            db.get('SELECT status FROM orders WHERE id = ?', [orderId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        expect(order.status).toBe('paid');
    });
});
