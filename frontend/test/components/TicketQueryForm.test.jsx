
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TicketQueryForm from '../../src/components/TicketQueryForm';

// Mock dependencies
vi.mock('../../src/components/StationSelector', () => ({
  default: ({ label, value, onChange, placeholder }) => (
    <div data-testid="station-selector">
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
  default: ({ label, value, onChange }) => (
    <div data-testid="date-picker">
      <label>{label}</label>
      <input 
        data-testid="input-date"
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
      />
    </div>
  )
}));

describe('TicketQueryForm', () => {
  it('renders all inputs and button', () => {
    render(<TicketQueryForm />);
    expect(screen.getByText('出发地')).toBeInTheDocument();
    expect(screen.getByText('到达地')).toBeInTheDocument();
    expect(screen.getByText('出发日期')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /查询/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /swap/i })).toBeInTheDocument();
  });

  it('initializes with props', () => {
    const init = { from: 'A', to: 'B', date: '2024-01-01', isStudent: true };
    render(<TicketQueryForm initialValues={init} />);
    expect(screen.getByTestId('input-出发地')).toHaveValue('A');
    expect(screen.getByTestId('input-到达地')).toHaveValue('B');
    expect(screen.getByTestId('input-date')).toHaveValue('2024-01-01');
    expect(screen.getByLabelText('学生票')).toBeChecked();
  });

  it('swaps departure and arrival stations', () => {
    render(<TicketQueryForm initialValues={{ from: 'Beijing', to: 'Shanghai' }} />);
    const fromInput = screen.getByTestId('input-出发地');
    const toInput = screen.getByTestId('input-到达地');
    
    expect(fromInput).toHaveValue('Beijing');
    expect(toInput).toHaveValue('Shanghai');

    fireEvent.click(screen.getByRole('button', { name: /swap/i }));

    expect(fromInput).toHaveValue('Shanghai');
    expect(toInput).toHaveValue('Beijing');
  });

  it('calls onSearch with form data when clicked', () => {
    const onSearch = vi.fn();
    render(<TicketQueryForm 
        initialValues={{ from: 'A', to: 'B', date: 'D' }} 
        onSearch={onSearch} 
    />);
    
    fireEvent.click(screen.getByRole('button', { name: /查询/i }));
    
    expect(onSearch).toHaveBeenCalledWith({
        from: 'A',
        to: 'B',
        date: 'D',
        isStudent: false,
        isHighSpeed: false
    });
  });
});
