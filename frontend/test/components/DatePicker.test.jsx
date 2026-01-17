/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DatePicker from '../../src/components/DatePicker';

describe('DatePicker Component', () => {
  it('renders input with correct placeholder', () => {
    render(<DatePicker label="Test Date" placeholder="Select a date" value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText('Select a date')).toBeInTheDocument();
    expect(screen.getByText('Test Date')).toBeInTheDocument();
  });

  it('opens calendar popup on focus', () => {
    render(<DatePicker label="Test Date" placeholder="Select a date" value="" onChange={() => {}} />);
    
    const input = screen.getByPlaceholderText('Select a date');
    fireEvent.focus(input);
    
    // Check for month header (current year and month)
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const year = today.getFullYear();
    
    expect(screen.getByText(`${year}年${currentMonth}月`)).toBeInTheDocument();
    
    // Check for next month
    const nextMonthDate = new Date(year, currentMonth, 1); // currentMonth is 0-indexed + 1 = next month index
    const nextMonth = nextMonthDate.getMonth() + 1;
    const nextYear = nextMonthDate.getFullYear();
    
    expect(screen.getByText(`${nextYear}年${nextMonth}月`)).toBeInTheDocument();
  });

  it('selects a date and calls onChange', () => {
    const handleChange = vi.fn();
    render(<DatePicker label="Test Date" placeholder="Select a date" value="" onChange={handleChange} />);
    
    const input = screen.getByPlaceholderText('Select a date');
    fireEvent.focus(input);
    
    // Find a day button (e.g., the 15th of the current month)
    // We need to be careful to select a button that is visible
    const dayButtons = document.querySelectorAll('.day-btn');
    expect(dayButtons.length).toBeGreaterThan(0);
    
    fireEvent.click(dayButtons[0]); // Click the first available day
    
    expect(handleChange).toHaveBeenCalled();
    // The argument should be a date string YYYY-MM-DD
    expect(handleChange.mock.calls[0][0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  
  it('closes popup when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <DatePicker label="Test Date" placeholder="Select a date" value="" onChange={() => {}} />
      </div>
    );
    
    const input = screen.getByPlaceholderText('Select a date');
    fireEvent.focus(input);
    
    // Verify popup is open
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const year = today.getFullYear();
    expect(screen.getByText(`${year}年${currentMonth}月`)).toBeInTheDocument();
    
    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));
    
    // Verify popup is closed
    expect(screen.queryByText(`${year}年${currentMonth}月`)).not.toBeInTheDocument();
  });
});
