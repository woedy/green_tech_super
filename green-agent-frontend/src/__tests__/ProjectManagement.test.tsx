import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import ProjectManagement from '@/pages/agent/ProjectManagement';
import * as api from '@/lib/api';

// Mock the API
vi.mock('@/lib/api');
const mockApi = vi.mocked(api);

// Mock the AgentShell component
vi.mock('@/components/layout/AgentShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="agent-shell">{children}</div>
}));

const mockProjects = [
  {
    id: 'PRJ-001',
    title: 'Eco Villa Construction',
    status: 'in_progress',
    status_display: 'In Progress',
    current_phase: 'Foundation',
    phase_display: 'Foundation Work',
    progress_percentage: 35,
    planned_start_date: '2024-01-15',
    planned_end_date: '2024-06-15',
    project_manager: { id: 'pm1', name: 'John Manager' },
    site_supervisor: { id: 'sup1', name: 'Jane Supervisor' },
  },
  {
    id: 'PRJ-002',
    title: 'Solar Panel Installation',
    status: 'planning',
    status_display: 'Planning',
    current_phase: 'Design',
    progress_percentage: 10,
    planned_start_date: '2024-03-01',
    planned_end_date: '2024-04-30',
    project_manager: { id: 'pm2', name: 'Bob Manager' },
  },
  {
    id: 'PRJ-003',
    title: 'Green Office Complex',
    status: 'completed',
    status_display: 'Completed',
    current_phase: 'Handover',
    progress_percentage: 100,
    planned_start_date: '2023-08-01',
    planned_end_date: '2023-12-31',
    actual_end_date: '2023-12-28',
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ProjectManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.fetchProjects.mockResolvedValue(mockProjects);
  });

  it('renders project management dashboard', async () => {
    render(<ProjectManagement />, { wrapper: createWrapper() });

    expect(screen.getByText('Project Management')).toBeInTheDocument();
    expect(screen.getByText('Manage your construction projects, milestones, and client communication')).toBeInTheDocument();
  });

  it('displays project statistics correctly', async () => {
    render(<ProjectManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Eco Villa Construction')).toBeInTheDocument();
    });

    // Check statistics - look for the numbers in the cards
    const totalProjectsCard = screen.getByText('Total Projects').closest('.rounded-lg');
    expect(totalProjectsCard).toHaveTextContent('3');
    
    const inProgressCard = screen.getByText('In Progress').closest('.rounded-lg');
    expect(inProgressCard).toHaveTextContent('1');
    
    const planningCard = screen.getByText('Planning').closest('.rounded-lg');
    expect(planningCard).toHaveTextContent('1');
    
    const completedCard = screen.getByText('Completed').closest('.rounded-lg');
    expect(completedCard).toHaveTextContent('1');
  });

  it('displays project cards with correct information', async () => {
    render(<ProjectManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Eco Villa Construction')).toBeInTheDocument();
    });

    // Check project details
    expect(screen.getByText('Solar Panel Installation')).toBeInTheDocument();
    expect(screen.getByText('Green Office Complex')).toBeInTheDocument();
    expect(screen.getAllByText('In Progress')).toHaveLength(2); // One in card, one in filter
    expect(screen.getAllByText('Planning')).toHaveLength(2);
    expect(screen.getAllByText('Completed')).toHaveLength(2);
  });

  it('filters projects by status', async () => {
    render(<ProjectManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Eco Villa Construction')).toBeInTheDocument();
    });

    // Click on status filter button
    const statusFilter = screen.getByText('All Projects');
    fireEvent.click(statusFilter);

    // Select "In Progress" from the dropdown
    const inProgressOptions = screen.getAllByText('In Progress');
    const dropdownOption = inProgressOptions.find(el => el.closest('[role="option"]'));
    if (dropdownOption) {
      fireEvent.click(dropdownOption);
    }

    // Verify API is called with correct filter
    await waitFor(() => {
      expect(mockApi.fetchProjects).toHaveBeenCalledWith({ status: 'in_progress' });
    });
  });

  it('shows progress bars for projects', async () => {
    render(<ProjectManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('35%')).toBeInTheDocument();
    });

    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('displays project team information', async () => {
    render(<ProjectManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('John Manager')).toBeInTheDocument();
    });

    expect(screen.getByText('Jane Supervisor')).toBeInTheDocument();
    expect(screen.getByText('Bob Manager')).toBeInTheDocument();
  });

  it('shows action buttons for each project', async () => {
    render(<ProjectManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByText('View Details')).toHaveLength(3);
    });

    expect(screen.getAllByText('Message Client')).toHaveLength(3);
  });

  it('handles loading state', () => {
    mockApi.fetchProjects.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<ProjectManagement />, { wrapper: createWrapper() });

    expect(screen.getByText('Loading projects...')).toBeInTheDocument();
  });

  it('handles empty projects list', async () => {
    mockApi.fetchProjects.mockResolvedValue([]);

    render(<ProjectManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No projects found for the selected filter.')).toBeInTheDocument();
    });
  });

  it('identifies overdue projects', async () => {
    const overdueProject = {
      ...mockProjects[0],
      planned_end_date: '2023-12-31', // Past date
      status: 'in_progress',
    };

    mockApi.fetchProjects.mockResolvedValue([overdueProject]);

    render(<ProjectManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });
  });
});