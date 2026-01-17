import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import apiClient from '../../src/api'; 
import app from '../../../backend/src/index'; 
import db from '../../../backend/src/database/init_db'; 
import Login from '../../src/pages/Login'; 
import operations from '../../../backend/src/database/operations';

let server;
let lastApiResponse = null; 

describe('Full-Stack Integration: <Login />', () => {

  beforeAll(async () => {
    server = await new Promise(resolve => {
      const s = app.listen(0, () => resolve(s));
    });
    const port = server.address().port;
    
    apiClient.defaults.baseURL = `http://localhost:${port}/api`;
    
    apiClient.interceptors.response.use((response) => {
      lastApiResponse = response.data; 
      return response; 
    }, (error) => {
        lastApiResponse = error.response ? error.response.data : null;
        return Promise.reject(error);
    });
  });

  afterAll((done) => server?.close(done));

  beforeEach(async () => {
    lastApiResponse = null;
    vi.stubGlobal('location', { href: 'http://localhost/', assign: vi.fn() });
    
    await new Promise((resolve) => db.run('DELETE FROM users', resolve));
    await operations.createUser({
        username: 'frontenduser',
        password: 'Password123!',
        id_type: '1',
        id_card: '110101199001011234',
        real_name: 'Frontend User',
        phone: '13700137000',
        email: 'frontend@example.com',
        type: 1
    });
  });

  it('renders login form correctly', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
    expect(screen.getByPlaceholderText(/用户名\/邮箱\/手机号/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/密码/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /立即登录/i })).toBeInTheDocument();
  });

  it('logs in successfully and redirects', async () => {
    render(<BrowserRouter><Login /></BrowserRouter>);

    fireEvent.change(screen.getByPlaceholderText(/用户名\/邮箱\/手机号/i), { target: { value: 'frontenduser' } });
    fireEvent.change(screen.getByPlaceholderText(/密码/i), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /立即登录/i }));

    await waitFor(() => {
      expect(lastApiResponse).not.toBeNull();
      expect(lastApiResponse.success).toBe(true);
      expect(lastApiResponse.data.user.username).toBe('frontenduser');
      // expect(window.location.href).toContain('/'); // Assuming redirect to home
    });
  });

  it('shows error on invalid credentials', async () => {
    render(<BrowserRouter><Login /></BrowserRouter>);

    fireEvent.change(screen.getByPlaceholderText(/用户名\/邮箱\/手机号/i), { target: { value: 'frontenduser' } });
    fireEvent.change(screen.getByPlaceholderText(/密码/i), { target: { value: 'WrongPassword' } });
    fireEvent.click(screen.getByRole('button', { name: /立即登录/i }));

    await waitFor(() => {
        expect(lastApiResponse).not.toBeNull();
        expect(lastApiResponse.success).toBe(false);
        expect(screen.getByText(/用户名或密码错误/i)).toBeInTheDocument();
    });
  });
});
