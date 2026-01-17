import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import apiClient from '../../src/api';

// [IMPORTS]
import app from '../../../backend/src/index'; 
import db from '../../../backend/src/database/init_db'; 
import Register from '../../src/pages/Register';

// [GLOBALS]
let server;
let lastApiResponse = null; 

describe('Full-Stack Integration: <Register />', () => {

  // ================= 1. Lifecycle: Server & Network Spy =================
  beforeAll(async () => {
    // Start real backend
    server = await new Promise(resolve => {
      const s = app.listen(0, () => resolve(s));
    });
    const port = server.address().port;
    
    // Configure Axios Client
    apiClient.defaults.baseURL = `http://localhost:${port}`;
    
    // Spy on response
    apiClient.interceptors.response.use((response) => {
      lastApiResponse = response.data; 
      return response; 
    }, (error) => {
        lastApiResponse = error.response ? error.response.data : null;
        return Promise.reject(error);
    });
  });

  afterAll((done) => server?.close(done));

  // ================= 2. Lifecycle: Data Seeding & Mocks =================
  beforeEach(async () => {
    lastApiResponse = null; 
    
    // Mock window.location
    vi.stubGlobal('location', { href: 'http://localhost/', assign: vi.fn() });
    
    // Clean DB
    await new Promise((resolve) => {
        db.run('DELETE FROM users', resolve);
    });
  });

  // ================= 3. Test Cases =================
  
  it('renders registration form correctly', () => {
    render(<BrowserRouter><Register /></BrowserRouter>);
    expect(screen.getByText(/用户注册/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/字母开头，6-30位/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /下一步/i })).toBeInTheDocument();
  });

  it('validates input and submits successfully', async () => {
    render(<BrowserRouter><Register /></BrowserRouter>);

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/字母开头，6-30位/i), { target: { value: 'validuser' } });
    fireEvent.change(screen.getByPlaceholderText(/6-20位字符/i), { target: { value: 'StrongPass1!' } });
    fireEvent.change(screen.getByPlaceholderText(/再次输入密码/i), { target: { value: 'StrongPass1!' } });
    fireEvent.change(screen.getByPlaceholderText(/请输入姓名/i), { target: { value: '测试员' } });
    fireEvent.change(screen.getByPlaceholderText(/请输入证件号码/i), { target: { value: '110101199001011234' } });
    fireEvent.change(screen.getByPlaceholderText(/请输入手机号码/i), { target: { value: '13800138000' } });
    
    // Check agreement
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));

    // Verify
    await waitFor(() => {
      // Backend should receive data and return success
      expect(lastApiResponse).not.toBeNull();
      expect(lastApiResponse.success).toBe(true);
      
      // UI should update (e.g., redirect to login)
      // Since we mocked location.assign, we can check if it was called
      // Or checking if the success message is displayed if the UI does that
      expect(window.location.href).toContain('/login');
    });
  });

  it('shows error for existing username', async () => {
    // Seed existing user
    await new Promise(resolve => {
        db.run(`INSERT INTO users (username, password, phone) VALUES ('existing', 'pass', '13811112222')`, resolve);
    });

    render(<BrowserRouter><Register /></BrowserRouter>);

    fireEvent.change(screen.getByPlaceholderText(/字母开头，6-30位/i), { target: { value: 'existing' } });
    fireEvent.change(screen.getByPlaceholderText(/6-20位字符/i), { target: { value: 'Pass123' } });
    fireEvent.change(screen.getByPlaceholderText(/再次输入密码/i), { target: { value: 'Pass123' } });
    fireEvent.change(screen.getByPlaceholderText(/请输入姓名/i), { target: { value: '测试员' } });
    fireEvent.change(screen.getByPlaceholderText(/请输入证件号码/i), { target: { value: '110101199001011234' } });
    fireEvent.change(screen.getByPlaceholderText(/请输入手机号码/i), { target: { value: '13800138001' } });
    
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));

    await waitFor(() => {
       expect(lastApiResponse).not.toBeNull();
       expect(lastApiResponse.success).toBe(false);
       expect(screen.getByText(/已被使用/i)).toBeInTheDocument();
    });
  });
});
