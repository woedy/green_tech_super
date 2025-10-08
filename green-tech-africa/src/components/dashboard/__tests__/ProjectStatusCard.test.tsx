import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProjectStatusCard } from '../ProjectStatusCard';
import type { ProjectSummary } from '@/types/project';

const mockProject: ProjectSummary = {
  id: 1,
  title: 'Test Project',
  description: 'A test project description',
  status: 'in_progress',
  status_display: 'In Progress',
  current_phase: 'construction',
  phase_display: 'Construction',
  progress_percentage: 65,
  planned_start_date: '2025-01-01',
  planned_end_date: '2025-06-30',
  actual_start_date: '2025-01-05',
  actual_end_date: null,
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ProjectStatusCard', () => {
  it('renders project title and description', () => {
    renderWithRouter(<ProjectStatusCard project={mockProject} />);
    
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('A test project description')).toBeInTheDocument();
  });

  it('displays project status badge', () => {
    renderWithRouter(<ProjectStatusCard project={mockProject} />);
    
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('shows progress percentage', () => {
    renderWithRouter(<ProjectStatusCard project={mockProject} />);
    
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('displays current phase', () => {
    renderWithRouter(<ProjectStatusCard project={mockProject} />);
    
    expect(screen.getByText(/Phase: Construction/)).toBeInTheDocument();
  });

  it('shows planned end date when available', () => {
    renderWithRouter(<ProjectStatusCard project={mockProject} />);
    
    const dateElement = screen.getByText(/Due:/);
    expect(dateElement).toBeInTheDocument();
  });

  it('renders view details link', () => {
    renderWithRouter(<ProjectStatusCard project={mockProject} />);
    
    const link = screen.getByRole('link', { name: /View Details/i });
    expect(link).toHaveAttribute('href', '/account/projects/1');
  });

  it('handles completed status correctly', () => {
    const completedProject = { ...mockProject, status: 'completed', status_display: 'Completed' };
    renderWithRouter(<ProjectStatusCard project={completedProject} />);
    
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('handles planning status correctly', () => {
    const planningProject = { ...mockProject, status: 'planning', status_display: 'Planning' };
    renderWithRouter(<ProjectStatusCard project={planningProject} />);
    
    expect(screen.getByText('Planning')).toBeInTheDocument();
  });
});
