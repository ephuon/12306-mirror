import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';

describe('App Component', () => {
  it('renders home page by default', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    // 假设首页有特定的元素
    expect(screen.getByText(/12306 Demo System/i)).toBeInTheDocument();
  });

  it('renders login page on /login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/用户登录/i)).toBeInTheDocument();
  });
});
