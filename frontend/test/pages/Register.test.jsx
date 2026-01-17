import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Register from '../../src/pages/Register';

describe('Register Component', () => {
  it('renders register page correctly', () => {
    render(<Register />);
    expect(screen.getByText(/用户注册/i)).toBeInTheDocument();
  });
});
