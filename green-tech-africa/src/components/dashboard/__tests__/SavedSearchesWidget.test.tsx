import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SavedSearchesWidget } from '../SavedSearchesWidget';
import type { SavedSearch } from '@/lib/savedSearches';

const mockSearches: SavedSearch[] = [
  {
    id: '1',
    name: 'Eco Homes in Accra',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    filters: {
      q: 'eco',
      type: 'residential',
      location: 'Accra',
    },
    alerts: true,
  },
  {
    id: '2',
    name: 'Commercial Properties',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    filters: {
      type: 'commercial',
      minPrice: 50000,
      maxPrice: 200000,
    },
    alerts: false,
  },
  {
    id: '3',
    name: 'Budget Homes',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    filters: {
      maxPrice: 30000,
    },
    alerts: true,
  },
];

describe('SavedSearchesWidget', () => {
  it('renders saved search items', () => {
    const mockHandlers = {
      onToggleAlerts: vi.fn(),
      onDelete: vi.fn(),
      onApply: vi.fn(),
    };

    render(<SavedSearchesWidget searches={mockSearches} {...mockHandlers} />);
    
    expect(screen.getByText('Eco Homes in Accra')).toBeInTheDocument();
    expect(screen.getByText('Commercial Properties')).toBeInTheDocument();
    expect(screen.getByText('Budget Homes')).toBeInTheDocument();
  });

  it('displays search count badge', () => {
    const mockHandlers = {
      onToggleAlerts: vi.fn(),
      onDelete: vi.fn(),
      onApply: vi.fn(),
    };

    render(<SavedSearchesWidget searches={mockSearches} {...mockHandlers} />);
    
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows alerts status for each search', () => {
    const mockHandlers = {
      onToggleAlerts: vi.fn(),
      onDelete: vi.fn(),
      onApply: vi.fn(),
    };

    render(<SavedSearchesWidget searches={mockSearches} {...mockHandlers} />);
    
    const alertsOn = screen.getAllByText('Alerts On');
    const alertsOff = screen.getAllByText('Alerts Off');
    
    expect(alertsOn.length).toBe(2); // Two searches have alerts on
    expect(alertsOff.length).toBe(1); // One search has alerts off
  });

  it('calls onApply when clicking apply search button', () => {
    const mockHandlers = {
      onToggleAlerts: vi.fn(),
      onDelete: vi.fn(),
      onApply: vi.fn(),
    };

    render(<SavedSearchesWidget searches={mockSearches} {...mockHandlers} />);
    
    const applyButtons = screen.getAllByText('Apply Search');
    fireEvent.click(applyButtons[0]);
    
    expect(mockHandlers.onApply).toHaveBeenCalledWith(mockSearches[0]);
  });

  it('calls onToggleAlerts when clicking alert toggle button', () => {
    const mockHandlers = {
      onToggleAlerts: vi.fn(),
      onDelete: vi.fn(),
      onApply: vi.fn(),
    };

    const { container } = render(<SavedSearchesWidget searches={mockSearches} {...mockHandlers} />);
    
    // Find the bell icon buttons (toggle alerts)
    const toggleButtons = container.querySelectorAll('button[title*="alerts"]');
    fireEvent.click(toggleButtons[0]);
    
    expect(mockHandlers.onToggleAlerts).toHaveBeenCalledWith('1');
  });

  it('calls onDelete when clicking delete button', () => {
    const mockHandlers = {
      onToggleAlerts: vi.fn(),
      onDelete: vi.fn(),
      onApply: vi.fn(),
    };

    const { container } = render(<SavedSearchesWidget searches={mockSearches} {...mockHandlers} />);
    
    // Find the delete buttons
    const deleteButtons = container.querySelectorAll('button[title="Delete search"]');
    fireEvent.click(deleteButtons[0]);
    
    expect(mockHandlers.onDelete).toHaveBeenCalledWith('1');
  });

  it('respects maxItems prop', () => {
    const mockHandlers = {
      onToggleAlerts: vi.fn(),
      onDelete: vi.fn(),
      onApply: vi.fn(),
    };

    render(<SavedSearchesWidget searches={mockSearches} maxItems={2} {...mockHandlers} />);
    
    expect(screen.getByText('Eco Homes in Accra')).toBeInTheDocument();
    expect(screen.getByText('Commercial Properties')).toBeInTheDocument();
    expect(screen.queryByText('Budget Homes')).not.toBeInTheDocument();
  });

  it('shows "view all" link when there are more searches than maxItems', () => {
    const mockHandlers = {
      onToggleAlerts: vi.fn(),
      onDelete: vi.fn(),
      onApply: vi.fn(),
    };

    render(<SavedSearchesWidget searches={mockSearches} maxItems={2} {...mockHandlers} />);
    
    expect(screen.getByText(/View all 3 saved searches/)).toBeInTheDocument();
  });

  it('shows empty state when no searches', () => {
    const mockHandlers = {
      onToggleAlerts: vi.fn(),
      onDelete: vi.fn(),
      onApply: vi.fn(),
    };

    render(<SavedSearchesWidget searches={[]} {...mockHandlers} />);
    
    expect(screen.getByText('No saved searches yet')).toBeInTheDocument();
    expect(screen.getByText(/Save searches from the properties page/)).toBeInTheDocument();
  });

  it('displays filter summary for each search', () => {
    const mockHandlers = {
      onToggleAlerts: vi.fn(),
      onDelete: vi.fn(),
      onApply: vi.fn(),
    };

    render(<SavedSearchesWidget searches={mockSearches} {...mockHandlers} />);
    
    // Check that filter summaries are displayed
    expect(screen.getByText(/"eco"/)).toBeInTheDocument();
    expect(screen.getByText(/Type: residential/)).toBeInTheDocument();
    expect(screen.getByText(/Location: Accra/)).toBeInTheDocument();
  });

  it('displays relative dates for saved searches', () => {
    const mockHandlers = {
      onToggleAlerts: vi.fn(),
      onDelete: vi.fn(),
      onApply: vi.fn(),
    };

    render(<SavedSearchesWidget searches={mockSearches} {...mockHandlers} />);
    
    // Should show relative dates like "Yesterday", "7 days ago", etc.
    const savedTexts = screen.getAllByText(/Saved/);
    expect(savedTexts.length).toBeGreaterThan(0);
  });
});
