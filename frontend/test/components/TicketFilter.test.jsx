
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TicketFilter from '../../src/components/TicketFilter';

describe('TicketFilter', () => {
  it('renders filter options', () => {
    render(<TicketFilter />);
    expect(screen.getByText('车次类型：')).toBeInTheDocument();
    expect(screen.getByText('车次席别：')).toBeInTheDocument();
    expect(screen.getByText(/GC-高铁/)).toBeInTheDocument();
    expect(screen.getByText(/商务座/)).toBeInTheDocument();
  });

  it('toggles checkboxes and notifies parent', () => {
    const onFilterChange = vi.fn();
    render(<TicketFilter onFilterChange={onFilterChange} />);
    
    const checkbox = screen.getByLabelText(/GC-高铁/);
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    
    // useEffect might be async in test env? 
    // Actually standard React update is sync within act(), but useEffect runs after render.
    // Testing library handles this usually.
    expect(onFilterChange).toHaveBeenCalled();
    const lastCall = onFilterChange.mock.calls[onFilterChange.mock.calls.length - 1][0];
    expect(lastCall.types).toContain('G');
  });
});
