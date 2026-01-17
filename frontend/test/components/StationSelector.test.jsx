/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StationSelector from '../../src/components/StationSelector';
import apiClient from '../../src/api';

// Mock apiClient
vi.mock('../../src/api', () => ({
  default: {
    get: vi.fn()
  }
}));

describe('StationSelector Component', () => {
  const mockStations = [
    { id: 1, name: '北京南', code: 'VNP', pinyin: 'beijingnan', initial: 'bjn' },
    { id: 2, name: '上海虹桥', code: 'SHH', pinyin: 'shanghaihongqiao', initial: 'shhq' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input with label', () => {
    render(<StationSelector label="出发地" placeholder="简拼/全拼/汉字" value="" onChange={() => {}} />);
    expect(screen.getByText('出发地')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('简拼/全拼/汉字')).toBeInTheDocument();
  });

  it('opens popup on focus and fetches stations', async () => {
    apiClient.get.mockResolvedValue({ data: { success: true, data: mockStations } });
    
    render(<StationSelector label="出发地" value="" onChange={() => {}} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    
    // Check if API was called
    expect(apiClient.get).toHaveBeenCalledWith('/stations');
    
    // Check if popup content (mock stations) appears
    await waitFor(() => {
      expect(screen.getByText('北京南')).toBeInTheDocument();
      expect(screen.getByText('上海虹桥')).toBeInTheDocument();
    });
  });

  it('filters stations when typing', async () => {
    // Mock search API
    apiClient.get.mockImplementation((url, config) => {
      if (url === '/stations/search') {
        return Promise.resolve({ 
            data: { 
                success: true, 
                data: [mockStations[0]] // Only Beijing
            } 
        });
      }
      return Promise.resolve({ data: { success: true, data: mockStations } });
    });

    render(<StationSelector label="出发地" value="" onChange={() => {}} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'bj' } });
    
    // Wait for search call
    await waitFor(() => {
       expect(apiClient.get).toHaveBeenCalledWith('/stations/search', { params: { q: 'bj' } });
       expect(screen.getByText('北京南')).toBeInTheDocument();
       expect(screen.queryByText('上海虹桥')).not.toBeInTheDocument();
    });
  });

  it('selects a station when clicked', async () => {
    apiClient.get.mockResolvedValue({ data: { success: true, data: mockStations } });
    const handleChange = vi.fn();
    
    render(<StationSelector label="出发地" value="" onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    
    await waitFor(() => {
      expect(screen.getByText('北京南')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('北京南'));
    
    expect(handleChange).toHaveBeenCalledWith('北京南');
  });
});
