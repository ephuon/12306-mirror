/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../../src/components/Navbar';

describe('Navbar Component', () => {
  it('renders navigation links', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('车票')).toBeInTheDocument();
    expect(screen.getByText('团购服务')).toBeInTheDocument();
  });

  it('renders dropdown menu for tickets', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Dropdown items should be present but maybe hidden (depending on CSS impl, but in JSDOM they exist)
    expect(screen.getByText('单程')).toBeInTheDocument();
    expect(screen.getByText('往返')).toBeInTheDocument();
  });

  it('links point to correct locations', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('首页').closest('a')).toHaveAttribute('href', '/');
    // React Router Link uses relative paths, but closest('a').href might be absolute.
    // Simpler check:
    expect(screen.getByText('单程').closest('a')).toHaveAttribute('href', '/search?type=single');
  });
});
