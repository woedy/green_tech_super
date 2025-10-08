import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserManagement from '../components/UserManagement';
import type { User } from '../types';

// Mock the database
const mockUsers: User[] = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    active: true,
    phone: '+233244123456',
    location: 'Accra, Ghana',
    verified: true,
    created_at: '2024-01-01T00:00:00Z',
    last_login: '2024-12-01T10:00:00Z'
  },
  {
    id: 2,
    name: 'Agent User',
    email: 'agent@example.com',
    role: 'agent',
    active: true,
    phone: '+233201987654',
    location: 'Kumasi, Ghana',
    verified: false,
    created_at: '2024-02-01T00:00:00Z',
    last_login: '2024-11-30T15:30:00Z'
  }
];

vi.mock('../data/db', () => ({
  db: {
    listUsers: vi.fn(() => mockUsers),
    listRegions: vi.fn(() => [
      { code: 'GH-GA', name: 'Greater Accra' },
      { code: 'GH-AS', name: 'Ashanti' }
    ]),
    updateUser: vi.fn((id, updates) => {
      const user = mockUsers.find(u => u.id === id);
      return user ? { ...user, ...updates } : undefined;
    }),
    bulkUpdateUsers: vi.fn(() => ({
      success: mockUsers,
      errors: []
    }))
  }
}));

describe('UserManagement', () => {
  const mockOnUserSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render user management interface', () => {
    render(<UserManagement onUserSelect={mockOnUserSelect} />);
    
    expect(screen.getByPlaceholderText('Search users by name, email, or phone...')).toBeInTheDocument();
    expect(screen.getByText('Users (2)')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('Agent User')).toBeInTheDocument();
  });

  it('should filter users by search term', async () => {
    render(<UserManagement onUserSelect={mockOnUserSelect} />);
    
    const searchInput = screen.getByPlaceholderText('Search users by name, email, or phone...');
    fireEvent.change(searchInput, { target: { value: 'admin' } });

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.queryByText('Agent User')).not.toBeInTheDocument();
    });
  });

  it('should filter users by role', async () => {
    render(<UserManagement onUserSelect={mockOnUserSelect} />);
    
    const roleFilter = screen.getByDisplayValue('All Roles');
    fireEvent.click(roleFilter);
    
    const agentOption = screen.getByText('Agent');
    fireEvent.click(agentOption);

    await waitFor(() => {
      expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
      expect(screen.getByText('Agent User')).toBeInTheDocument();
    });
  });

  it('should filter users by status', async () => {
    render(<UserManagement onUserSelect={mockOnUserSelect} />);
    
    const statusFilter = screen.getByDisplayValue('All Status');
    fireEvent.click(statusFilter);
    
    const activeOption = screen.getByText('Active');
    fireEvent.click(activeOption);

    await waitFor(() => {
      // Both users are active, so both should be visible
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('Agent User')).toBeInTheDocument();
    });
  });

  it('should toggle user active status', async () => {
    render(<UserManagement onUserSelect={mockOnUserSelect} />);
    
    const activeSwitches = screen.getAllByRole('switch');
    const firstActiveSwitch = activeSwitches[0];
    
    fireEvent.click(firstActiveSwitch);

    await waitFor(() => {
      expect(vi.mocked(require('../data/db').db.updateUser)).toHaveBeenCalledWith(1, { active: false });
    });
  });

  it('should toggle user verification status', async () => {
    render(<UserManagement onUserSelect={mockOnUserSelect} />);
    
    // Find verification buttons (shield icons)
    const verificationButtons = screen.getAllByRole('button');
    const verificationButton = verificationButtons.find(button => 
      button.querySelector('svg') // Looking for shield icon
    );
    
    if (verificationButton) {
      fireEvent.click(verificationButton);

      await waitFor(() => {
        expect(vi.mocked(require('../data/db').db.updateUser)).toHaveBeenCalled();
      });
    }
  });

  it('should handle bulk user selection', async () => {
    render(<UserManagement onUserSelect={mockOnUserSelect} />);
    
    // Select all users checkbox
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(selectAllCheckbox);

    await waitFor(() => {
      expect(screen.getByText('2 users selected')).toBeInTheDocument();
    });
  });

  it('should perform bulk actions', async () => {
    render(<UserManagement onUserSelect={mockOnUserSelect} />);
    
    // Select users
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(selectAllCheckbox);

    await waitFor(() => {
      expect(screen.getByText('2 users selected')).toBeInTheDocument();
    });

    // Choose bulk action
    const bulkActionSelect = screen.getByDisplayValue('Choose bulk action');
    fireEvent.click(bulkActionSelect);
    
    const activateOption = screen.getByText('Activate Users');
    fireEvent.click(activateOption);

    // Apply action
    const applyButton = screen.getByText('Apply Action');
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(vi.mocked(require('../data/db').db.bulkUpdateUsers)).toHaveBeenCalled();
    });
  });

  it('should call onUserSelect when user row is clicked', async () => {
    render(<UserManagement onUserSelect={mockOnUserSelect} />);
    
    const userRow = screen.getByText('Admin User').closest('tr');
    if (userRow) {
      fireEvent.click(userRow);
      
      await waitFor(() => {
        expect(mockOnUserSelect).toHaveBeenCalledWith(mockUsers[0]);
      });
    }
  });

  it('should display user information correctly', () => {
    render(<UserManagement onUserSelect={mockOnUserSelect} />);
    
    // Check if user details are displayed
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('+233244123456')).toBeInTheDocument();
    expect(screen.getByText('Accra, Ghana')).toBeInTheDocument();
    
    // Check role badges
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('agent')).toBeInTheDocument();
  });

  it('should show empty state when no users match filters', async () => {
    render(<UserManagement onUserSelect={mockOnUserSelect} />);
    
    const searchInput = screen.getByPlaceholderText('Search users by name, email, or phone...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No users found matching your criteria.')).toBeInTheDocument();
    });
  });

  it('should format dates correctly', () => {
    render(<UserManagement onUserSelect={mockOnUserSelect} />);
    
    // Check if dates are formatted (should show formatted date, not raw ISO string)
    expect(screen.queryByText('2024-12-01T10:00:00Z')).not.toBeInTheDocument();
    expect(screen.queryByText('2024-11-30T15:30:00Z')).not.toBeInTheDocument();
  });

  it('should handle role changes', async () => {
    render(<UserManagement onUserSelect={mockOnUserSelect} />);
    
    // Find role select for first user
    const roleSelects = screen.getAllByRole('combobox');
    const firstRoleSelect = roleSelects.find(select => 
      select.closest('tr')?.textContent?.includes('Admin User')
    );
    
    if (firstRoleSelect) {
      fireEvent.click(firstRoleSelect);
      
      const customerOption = screen.getByText('Customer');
      fireEvent.click(customerOption);

      await waitFor(() => {
        expect(vi.mocked(require('../data/db').db.updateUser)).toHaveBeenCalledWith(1, { role: 'customer' });
      });
    }
  });
});