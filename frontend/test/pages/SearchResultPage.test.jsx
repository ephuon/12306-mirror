/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import SearchResultPage from '../../src/pages/SearchResultPage';

describe('SearchResultPage', () => {
  it('renders header, navbar and content', () => {
    render(
      <BrowserRouter>
        <SearchResultPage />
      </BrowserRouter>
    );

    // Check Header presence (e.g. Logo or Search Bar)
    expect(screen.getByRole('button', { name: /🔍/i })).toBeInTheDocument();

    // Check Navbar presence
    expect(screen.getByText('首页')).toBeInTheDocument();

    // Check Page Content
    expect(screen.getByText('车次列表')).toBeInTheDocument();
    expect(screen.getByText('查询结果加载中...')).toBeInTheDocument();
  });
});
