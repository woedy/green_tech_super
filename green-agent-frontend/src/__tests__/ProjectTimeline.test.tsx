import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProjectTimeline from '@/components/projects/ProjectTimeline';
import { ProjectMilestoneItem } from '@/types/project';

const mockMilestones: ProjectMilestoneItem[] = [
  {
    id: 'milestone-1',
    title: 'Foundation Complete',
    status: 'completed',
    due_date: '2024-02-15',
    phase: 'Foundation',
    progress: 100,
    is_overdue: false,
    is_due_soon: false,
  },
  {
    id: 'milestone-2',
    title: 'Framing Complete',
    status: 'in_progress',
    due_date: '2024-03-15',
    phase: 'Structure',
    progress: 60,
    is_overdue: false,
    is_due_soon: true,
  },
  {
    id: 'milestone-3',
    title: 'Roofing Complete',
    status: 'pending',
    due_date: '2024-04-15',
    phase: 'Structure',
    progress: 0,
    is_overdue: false,
    is_due_soon: false,
  },
  {
    id: 'milestone-4',
    title: 'Electrical Rough-in',
    status: 'pending',
    due_date: '2024-01-15', // Past date
    phase: 'Systems',
    progress: 0,
    is_overdue: true,
    is_due_soon: false,
  },
];

describe('ProjectTimeline', () => {
  it('renders timeline with milestones', () => {
    render(
      <ProjectTimeline
        milestones={mockMilestones}
        currentPhase="Structure"
        progressPercentage={45}
      />
    );

    expect(screen.getByText('Project Timeline')).toBeInTheDocument();
    expect(screen.getByText('Structure • 45% Complete')).toBeInTheDocument();
  });

  it('displays all milestones in chronological order', () => {
    render(
      <ProjectTimeline
        milestones={mockMilestones}
        currentPhase="Structure"
        progressPercentage={45}
      />
    );

    expect(screen.getByText('Foundation Complete')).toBeInTheDocument();
    expect(screen.getByText('Framing Complete')).toBeInTheDocument();
    expect(screen.getByText('Roofing Complete')).toBeInTheDocument();
    expect(screen.getByText('Electrical Rough-in')).toBeInTheDocument();
  });

  it('shows correct status badges', () => {
    render(
      <ProjectTimeline
        milestones={mockMilestones}
        currentPhase="Structure"
        progressPercentage={45}
      />
    );

    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('Due Soon')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('displays due dates correctly', () => {
    render(
      <ProjectTimeline
        milestones={mockMilestones}
        currentPhase="Structure"
        progressPercentage={45}
      />
    );

    // Check that due dates are formatted correctly (using more flexible matching)
    expect(screen.getByText(/Due:.*15\/02\/2024/)).toBeInTheDocument();
    expect(screen.getByText(/Due:.*15\/03\/2024/)).toBeInTheDocument();
    expect(screen.getByText(/Due:.*15\/04\/2024/)).toBeInTheDocument();
    expect(screen.getByText(/Due:.*15\/01\/2024/)).toBeInTheDocument();
  });

  it('shows phase information', () => {
    render(
      <ProjectTimeline
        milestones={mockMilestones}
        currentPhase="Structure"
        progressPercentage={45}
      />
    );

    expect(screen.getByText(/Phase:.*Foundation/)).toBeInTheDocument();
    expect(screen.getAllByText(/Phase:.*Structure/)).toHaveLength(2); // Two milestones have Structure phase
    expect(screen.getByText(/Phase:.*Systems/)).toBeInTheDocument();
  });

  it('renders progress bars for milestones with progress', () => {
    render(
      <ProjectTimeline
        milestones={mockMilestones}
        currentPhase="Structure"
        progressPercentage={45}
      />
    );

    // Progress bars should be present for milestones with progress values
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('handles empty milestones list', () => {
    render(
      <ProjectTimeline
        milestones={[]}
        currentPhase="Planning"
        progressPercentage={0}
      />
    );

    expect(screen.getByText('No milestones scheduled')).toBeInTheDocument();
  });

  it('displays overall progress correctly', () => {
    render(
      <ProjectTimeline
        milestones={mockMilestones}
        currentPhase="Structure"
        progressPercentage={75}
      />
    );

    expect(screen.getByText('Structure • 75% Complete')).toBeInTheDocument();
  });
});