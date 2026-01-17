import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SearchResultPage from '../../src/pages/SearchResultPage';
import apiClient from '../../src/api';

// Mock dependencies
vi.mock('../../src/api');
vi.mock('../../src/components/Header', () => ({ default: () => <div data-testid="header" /> }));
vi.mock('../../src/components/Navbar', () => ({ default: () => <div data-testid="navbar" /> }));

describe('SearchResultPage Integration', () => {
  const mockTickets = [
    {
      id: '1',
      train_no: 'G1',
      type: 'G',
      from_station: 'Beijing',
      to_station: 'Shanghai',
      start_time: '09:00',
      end_time: '13:00',
      duration: '4h',
      seats: { business: 10, first: 5 }
    },
    {
      id: '2',
      train_no: 'D1',
      type: 'D',
      from_station: 'Beijing',
      to_station: 'Shanghai',
      start_time: '10:00',
      end_time: '15:00',
      duration: '5h',
      seats: { second: 100 }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockResolvedValue({ data: { success: true, data: mockTickets } });
  });

  it('renders and fetches tickets based on URL params', async () => {
    render(
      <MemoryRouter initialEntries={['/search?from=Beijing&to=Shanghai&date=2024-01-01']}>
        <SearchResultPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
    
    // Check loading or direct result
    await waitFor(() => {
      expect(screen.getByText('G1')).toBeInTheDocument();
      expect(screen.getByText('D1')).toBeInTheDocument();
    });
    
    // Check API call params
    // Note: URLSearchParams returns strings, boolean logic in component handles 'true' string
    expect(apiClient.get).toHaveBeenCalled();
    const callArgs = apiClient.get.mock.calls[0][1];
    expect(callArgs.params).toMatchObject({
        from: 'Beijing',
        to: 'Shanghai',
        date: '2024-01-01'
    });
  });

  it('filters tickets when filter options are selected', async () => {
     render(
      <MemoryRouter initialEntries={['/search?from=Beijing&to=Shanghai']}>
        <SearchResultPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('G1')).toBeInTheDocument();
      expect(screen.getByText('D1')).toBeInTheDocument();
    });

    // Find checkbox for G type (GC-高铁/城际)
    const gCheckbox = screen.getByLabelText(/GC-高铁/i);
    
    // Click to filter ONLY G
    fireEvent.click(gCheckbox); 
    
    // Wait for update
    await waitFor(() => {
        expect(screen.getByText('G1')).toBeInTheDocument();
        expect(screen.queryByText('D1')).not.toBeInTheDocument();
    });
    
    // Uncheck G, should show all
    fireEvent.click(gCheckbox);
    await waitFor(() => {
        expect(screen.getByText('G1')).toBeInTheDocument();
        expect(screen.getByText('D1')).toBeInTheDocument();
    });
  });
});
