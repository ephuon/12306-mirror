/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import QuickSearchPanel from '../../src/components/QuickSearchPanel';

// Mock child components to isolate QuickSearchPanel logic
vi.mock('../../src/components/StationSelector', () => ({
  default: ({ label, value, onChange, placeholder }) => (
    <div data-testid={`mock-station-selector-${label}`}>
      <label>{label}</label>
      <input 
        data-testid={`input-${label}`}
        placeholder={placeholder}
        value={value} 
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}));

vi.mock('../../src/components/DatePicker', () => ({
  default: ({ label, value, onChange, placeholder }) => (
    <div data-testid={`mock-date-picker-${label}`}>
      <label>{label}</label>
      <input 
        data-testid={`input-${label}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}));

describe('QuickSearchPanel Component', () => {
  it('renders all inputs and buttons', () => {
    render(
      <BrowserRouter>
        <QuickSearchPanel />
      </BrowserRouter>
    );

    // Check for StationSelectors
    expect(screen.getByTestId('mock-station-selector-出发地')).toBeInTheDocument();
    expect(screen.getByTestId('mock-station-selector-到达地')).toBeInTheDocument();
    
    // Check for DatePicker
    expect(screen.getByTestId('mock-date-picker-出发日期')).toBeInTheDocument();
    
    // Check for Checkboxes
    expect(screen.getByLabelText(/学生/)).toBeInTheDocument();
    expect(screen.getByLabelText(/高铁\/动车/)).toBeInTheDocument();
    
    // Check for Search Button
    expect(screen.getByRole('button', { name: /查询/i })).toBeInTheDocument();
    
    // Check for Footer Link
    expect(screen.getByText(/车票查询/i)).toBeInTheDocument();
  });

  it('updates state when inputs change', () => {
    render(
      <BrowserRouter>
        <QuickSearchPanel />
      </BrowserRouter>
    );

    const departureInput = screen.getByTestId('input-出发地');
    const arrivalInput = screen.getByTestId('input-到达地');
    const dateInput = screen.getByTestId('input-出发日期');

    fireEvent.change(departureInput, { target: { value: 'Beijing' } });
    fireEvent.change(arrivalInput, { target: { value: 'Shanghai' } });
    fireEvent.change(dateInput, { target: { value: '2023-10-01' } });

    expect(departureInput.value).toBe('Beijing');
    expect(arrivalInput.value).toBe('Shanghai');
    expect(dateInput.value).toBe('2023-10-01');
  });

  it('handles tab switching (visual only for now)', () => {
    render(
      <BrowserRouter>
        <QuickSearchPanel />
      </BrowserRouter>
    );
    
    expect(screen.getByText('车票')).toHaveClass('active');
    expect(screen.getByText('候补')).not.toHaveClass('active');
  });
});
