import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectTimeline } from '../ProjectTimeline';
import type { ProjectTimelineMilestone } from '@/types/project';

const mockMilestones: ProjectTimelineMilestone[] = [
  {
    id: 1,
    title: 'Site Preparation',
    start_date: '2025-01-01',
    end_date: '2025-01-15',
    status: 'completed',
    completion_percentage: 100,
    dependencies: [],
    is_on_track: true,
  },
  {
    id: 2,
    title: 'Foundation Work',
    start_date: '2025-01-16',
    end_date: '2025-02-28',
    status: 'in_progress',
    completion_percentage: 60,
    dependencies: [1],
    is_on_track: true,
  },
  {
    id: 3,
    title: 'Framing',
    start_date: '2025-03-01',
    end_date: '2025-04-15',
    status: 'not_started',
    completion_percentage: 0,
    dependencies: [2],
    is_on_track: true,
  },
];

describe('ProjectTimeline', () => {
  it('renders milestone titles', () => {
    render(<ProjectTimeline milestones={mockMilestones} />);
    
    expect(screen.getByText('Site Preparation')).toBeInTheDocument();
    expect(screen.getByText('Foundation Work')).toBeInTheDocument();
    expect(screen.getByText('Framing')).toBeInTheDocument();
  });

  it('displays milestone dates', () => {
    render(<ProjectTimeline milestones={mockMilestones} />);
    
    // Dates should be formatted and displayed
    const dateElements = screen.getAllByText(/→/);
    expect(dateElements.length).toBe(3); // One arrow per milestone
  });

  it('shows completion percentage', () => {
    render(<ProjectTimeline milestones={mockMilestones} />);
    
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('displays status badges', () => {
    render(<ProjectTimeline milestones={mockMilestones} />);
    
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('in progress')).toBeInTheDocument();
    expect(screen.getByText('not started')).toBeInTheDocument();
  });

  it('shows dependencies information', () => {
    render(<ProjectTimeline milestones={mockMilestones} />);
    
    const dependencyTexts = screen.getAllByText('Depends on 1 milestone');
    expect(dependencyTexts.length).toBeGreaterThan(0);
  });

  it('indicates when milestone is behind schedule', () => {
    const behindScheduleMilestones = [
      {
        ...mockMilestones[1],
        is_on_track: false,
      },
    ];
    
    render(<ProjectTimeline milestones={behindScheduleMilestones} />);
    
    expect(screen.getByText('Behind schedule')).toBeInTheDocument();
  });

  it('shows empty state when no milestones', () => {
    render(<ProjectTimeline milestones={[]} />);
    
    expect(screen.getByText('No milestones defined yet')).toBeInTheDocument();
  });

  it('renders project title when provided', () => {
    render(<ProjectTimeline milestones={mockMilestones} projectTitle="Test Project" />);
    
    expect(screen.getByText('Test Project - Timeline')).toBeInTheDocument();
  });

  it('renders progress bars for each milestone', () => {
    const { container } = render(<ProjectTimeline milestones={mockMilestones} />);
    
    // Progress bars should be rendered
    const progressBars = container.querySelectorAll('[role="progressbar"]');
    expect(progressBars.length).toBe(3);
  });
});
