import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Login from '../../src/pages/Login';

describe('Login Component', () => {
  it('renders login page correctly', () => {
    render(<Login />);
    expect(screen.getByText(/用户登录/i)).toBeInTheDocument();
  });
});
