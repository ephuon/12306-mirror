import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

// [IMPORTS]
import app from '../../../backend/src/index'; 
import db from '../../../backend/src/database/init_db'; 
import HomePage from '../../src/pages/HomePage';

// [GLOBALS]
let server;
let lastApiResponse = null; 

describe('Full-Stack Integration: <HomePage />', () => {

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

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  // ================= 2. Lifecycle: Data Seeding & Mocks =================
  beforeEach(async () => {
    lastApiResponse = null; 
    vi.stubGlobal('location', { href: 'http://localhost/', assign: vi.fn() });
  });

  // ================= 3. Test Cases =================
  
  it('renders home page layout correctly', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Check for Logo (Image)
    const logo = screen.getByRole('img', { name: /logo/i });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src');

    // Check for Navigation links
    expect(screen.getByText(/首页/i)).toBeInTheDocument();
    
    // Check for Search Panel
    expect(screen.getByText(/车票查询/i)).toBeInTheDocument();
  });
});
