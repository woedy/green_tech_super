import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityFeed, type ActivityItem } from '../ActivityFeed';

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'project_update',
    title: 'Project Update',
    description: 'Foundation work completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    projectId: 1,
    projectTitle: 'Test Project',
  },
  {
    id: '2',
    type: 'quote_received',
    title: 'New Quote',
    description: 'Quote for construction received',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    projectId: 2,
    projectTitle: 'Another Project',
  },
  {
    id: '3',
    type: 'milestone_completed',
    title: 'Milestone Completed',
    description: 'Site preparation finished',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
];

describe('ActivityFeed', () => {
  it('renders activity items', () => {
    render(<ActivityFeed activities={mockActivities} />);
    
    expect(screen.getByText('Project Update')).toBeInTheDocument();
    expect(screen.getByText('New Quote')).toBeInTheDocument();
    expect(screen.getByText('Milestone Completed')).toBeInTheDocument();
  });

  it('displays activity descriptions', () => {
    render(<ActivityFeed activities={mockActivities} />);
    
    expect(screen.getByText('Foundation work completed')).toBeInTheDocument();
    expect(screen.getByText('Quote for construction received')).toBeInTheDocument();
  });

  it('shows project titles when available', () => {
    render(<ActivityFeed activities={mockActivities} />);
    
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Another Project')).toBeInTheDocument();
  });

  it('displays relative timestamps', () => {
    render(<ActivityFeed activities={mockActivities} />);
    
    // Should show relative time like "30m ago", "2h ago", "1d ago"
    const timestamps = screen.getAllByText(/ago|Just now/);
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('respects maxItems prop', () => {
    render(<ActivityFeed activities={mockActivities} maxItems={2} />);
    
    expect(screen.getByText('Project Update')).toBeInTheDocument();
    expect(screen.getByText('New Quote')).toBeInTheDocument();
    expect(screen.queryByText('Milestone Completed')).not.toBeInTheDocument();
  });

  it('shows empty state when no activities', () => {
    render(<ActivityFeed activities={[]} />);
    
    expect(screen.getByText('No recent activity to display')).toBeInTheDocument();
  });

  it('renders correct icons for different activity types', () => {
    const { container } = render(<ActivityFeed activities={mockActivities} />);
    
    // Check that icons are rendered (they should be in the DOM)
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });
});
