import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import apiClient from '../../src/api';
import app from '../../../backend/src/index'; 
import db from '../../../backend/src/database/init_db'; 
import operations from '../../../backend/src/database/operations';
import ForgotPassword from '../../src/pages/ForgotPassword';

let server;
let lastApiResponse = null; 

describe('Full-Stack Integration: <ForgotPassword />', () => {
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
    await new Promise((resolve) => db.run('DELETE FROM verification_codes', resolve));

    await operations.createUser({
      username: 'testuser',
      password: 'OldPassword123!',
      id_type: '1',
      id_card: '110101199001011234',
      real_name: 'Test User',
      phone: '13800138000',
      email: 'test@example.com',
      type: 1
    });
  });

  it('completes the password reset flow successfully', async () => {
    render(<BrowserRouter><ForgotPassword /></BrowserRouter>);

    // Step 1: Identity Verification
    fireEvent.change(screen.getByPlaceholderText('用户名'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('姓名'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('证件号码'), { target: { value: '110101199001011234' } });
    fireEvent.change(screen.getByPlaceholderText('手机号'), { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('下一步'));

    await waitFor(() => {
        expect(screen.getByText(/验证码已发送至/)).toBeInTheDocument();
    });

    // Step 2: Code Verification
    // Manually insert code since we can't receive real SMS
    await operations.storeVerificationCode('13800138000', '123456');

    fireEvent.change(screen.getByPlaceholderText('验证码'), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('验证'));

    await waitFor(() => {
        expect(screen.getByPlaceholderText('新密码')).toBeInTheDocument();
    });

    // Step 3: Reset Password
    fireEvent.change(screen.getByPlaceholderText('新密码'), { target: { value: 'NewPassword123!' } });
    fireEvent.change(screen.getByPlaceholderText('确认密码'), { target: { value: 'NewPassword123!' } });
    fireEvent.click(screen.getByText('确定'));

    await waitFor(() => {
        expect(window.location.href).toContain('/login'); // Assuming it redirects to login
    });

    // Verify backend state
    const user = await operations.loginUser({ username: 'testuser', password: 'NewPassword123!' });
    expect(user).toBeDefined();
  });
});
