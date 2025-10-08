import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationCenter, type Notification, type NotificationPreferences } from '../NotificationCenter';

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Quote Received',
    message: 'New quote available for review',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
    actionUrl: '/quotes/1',
    actionLabel: 'View Quote',
  },
  {
    id: '2',
    type: 'info',
    title: 'Project Update',
    message: 'Milestone completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: true,
  },
  {
    id: '3',
    type: 'warning',
    title: 'Payment Due',
    message: 'Payment due in 3 days',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: false,
  },
];

const mockPreferences: NotificationPreferences = {
  email: true,
  sms: false,
  inApp: true,
  projectUpdates: true,
  quoteNotifications: true,
  paymentReminders: true,
  marketingEmails: false,
};

describe('NotificationCenter', () => {
  it('renders notification items', () => {
    const mockHandlers = {
      onMarkAsRead: vi.fn(),
      onMarkAllAsRead: vi.fn(),
      onUpdatePreferences: vi.fn(),
    };

    render(
      <NotificationCenter
        notifications={mockNotifications}
        preferences={mockPreferences}
        {...mockHandlers}
      />
    );
    
    expect(screen.getByText('Quote Received')).toBeInTheDocument();
    expect(screen.getByText('Project Update')).toBeInTheDocument();
    expect(screen.getByText('Payment Due')).toBeInTheDocument();
  });

  it('displays unread count badge', () => {
    const mockHandlers = {
      onMarkAsRead: vi.fn(),
      onMarkAllAsRead: vi.fn(),
      onUpdatePreferences: vi.fn(),
    };

    render(
      <NotificationCenter
        notifications={mockNotifications}
        preferences={mockPreferences}
        {...mockHandlers}
      />
    );
    
    // 2 unread notifications - check in badge
    const badges = screen.getAllByText('2');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('calls onMarkAsRead when marking notification as read', () => {
    const mockHandlers = {
      onMarkAsRead: vi.fn(),
      onMarkAllAsRead: vi.fn(),
      onUpdatePreferences: vi.fn(),
    };

    render(
      <NotificationCenter
        notifications={mockNotifications}
        preferences={mockPreferences}
        {...mockHandlers}
      />
    );
    
    const markAsReadButtons = screen.getAllByText('Mark as read');
    fireEvent.click(markAsReadButtons[0]);
    
    expect(mockHandlers.onMarkAsRead).toHaveBeenCalledWith('1');
  });

  it('calls onMarkAllAsRead when clicking mark all read button', () => {
    const mockHandlers = {
      onMarkAsRead: vi.fn(),
      onMarkAllAsRead: vi.fn(),
      onUpdatePreferences: vi.fn(),
    };

    render(
      <NotificationCenter
        notifications={mockNotifications}
        preferences={mockPreferences}
        {...mockHandlers}
      />
    );
    
    const markAllButton = screen.getByText('Mark all read');
    fireEvent.click(markAllButton);
    
    expect(mockHandlers.onMarkAllAsRead).toHaveBeenCalled();
  });

  it('has preferences tab', () => {
    const mockHandlers = {
      onMarkAsRead: vi.fn(),
      onMarkAllAsRead: vi.fn(),
      onUpdatePreferences: vi.fn(),
    };

    render(
      <NotificationCenter
        notifications={mockNotifications}
        preferences={mockPreferences}
        {...mockHandlers}
      />
    );
    
    const preferencesTab = screen.getByRole('tab', { name: /Preferences/i });
    expect(preferencesTab).toBeInTheDocument();
  });

  it('shows empty state when no notifications', () => {
    const mockHandlers = {
      onMarkAsRead: vi.fn(),
      onMarkAllAsRead: vi.fn(),
      onUpdatePreferences: vi.fn(),
    };

    render(
      <NotificationCenter
        notifications={[]}
        preferences={mockPreferences}
        {...mockHandlers}
      />
    );
    
    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });

  it('displays action buttons for notifications with actions', () => {
    const mockHandlers = {
      onMarkAsRead: vi.fn(),
      onMarkAllAsRead: vi.fn(),
      onUpdatePreferences: vi.fn(),
    };

    render(
      <NotificationCenter
        notifications={mockNotifications}
        preferences={mockPreferences}
        {...mockHandlers}
      />
    );
    
    expect(screen.getByText('View Quote')).toBeInTheDocument();
  });

  it('renders notification preferences component', () => {
    const mockHandlers = {
      onMarkAsRead: vi.fn(),
      onMarkAllAsRead: vi.fn(),
      onUpdatePreferences: vi.fn(),
    };

    const { container } = render(
      <NotificationCenter
        notifications={mockNotifications}
        preferences={mockPreferences}
        {...mockHandlers}
      />
    );
    
    // Component renders successfully
    expect(container.querySelector('[role="tablist"]')).toBeInTheDocument();
  });
});
