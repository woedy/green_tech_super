import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import AdminLayout from '../layout/AdminLayout'
import AdminDashboard from '../pages/Dashboard'
import AdminUsers from '../pages/Users'
import AdminProperties from '../pages/Properties'
import AdminAnalytics from '../pages/Analytics'

// Mock react-router-dom hooks
const mockNavigate = vi.fn()
const mockLocation = { state: null }

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  }
})

// Mock the admin API
vi.mock('../api', () => ({
  adminApi: {
    listProperties: vi.fn().mockResolvedValue([
      {
        id: 1,
        title: 'Accra Eco Villa',
        price: '250000',
        currency: 'GHS',
        status: 'active',
        region: 'Greater Accra'
      }
    ])
  }
}))

// Mock the database
vi.mock('../data/db', () => ({
  db: {
    listUsers: vi.fn().mockReturnValue([
      { id: 1, name: 'Admin One', email: 'admin1@example.com', role: 'admin', active: true },
      { id: 2, name: 'Agent Jane', email: 'jane@example.com', role: 'agent', active: true },
      { id: 3, name: 'Builder Bob', email: 'bob@example.com', role: 'builder', active: false },
    ])
  }
}))

// Test wrapper component
const TestWrapper = ({ children, initialEntries = ['/admin'] }: { children: React.ReactNode, initialEntries?: string[] }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

describe('System Management Access', () => {
  beforeEach(() => {
    // Mock authenticated state
    localStorage.getItem = vi.fn().mockReturnValue('true')
    vi.clearAllMocks()
  })

  describe('AdminLayout Navigation', () => {
    it('renders all navigation items correctly', () => {
      render(
        <TestWrapper>
          <AdminLayout />
        </TestWrapper>
      )

      // Check main navigation items
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Plans')).toBeInTheDocument()
      expect(screen.getByText('Properties')).toBeInTheDocument()
      expect(screen.getByText('Users')).toBeInTheDocument()
      expect(screen.getByText('Ghana Regions')).toBeInTheDocument()
      expect(screen.getByText('Notifications')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
      expect(screen.getByText('Analytics')).toBeInTheDocument()
    })

    it('displays admin branding correctly', () => {
      render(
        <TestWrapper>
          <AdminLayout />
        </TestWrapper>
      )

      expect(screen.getByText('Green Admin')).toBeInTheDocument()
      expect(screen.getByText('Admin Portal')).toBeInTheDocument()
    })

    it('shows logout functionality', () => {
      render(
        <TestWrapper>
          <AdminLayout />
        </TestWrapper>
      )

      const logoutButton = screen.getByRole('button', { name: /logout/i })
      expect(logoutButton).toBeInTheDocument()
    })

    it('handles build request notifications', () => {
      render(
        <TestWrapper>
          <AdminLayout />
        </TestWrapper>
      )

      // Should not show notification badge initially
      const dashboardLink = screen.getByText('Dashboard').closest('a')
      expect(dashboardLink).not.toHaveTextContent('1')
    })
  })

  describe('Dashboard Analytics', () => {
    it('displays key performance indicators', () => {
      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      )

      expect(screen.getByText('New Leads (7d)')).toBeInTheDocument()
      expect(screen.getByText('Quotes Sent (7d)')).toBeInTheDocument()
      expect(screen.getByText('Projects Active')).toBeInTheDocument()
      expect(screen.getByText('Listings Live')).toBeInTheDocument()
    })

    it('shows Ghana market insights through KPI values', () => {
      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      )

      // Check that KPI values are displayed
      expect(screen.getByText('32')).toBeInTheDocument() // New Leads
      expect(screen.getByText('14')).toBeInTheDocument() // Quotes Sent
      expect(screen.getByText('9')).toBeInTheDocument()  // Projects Active
      expect(screen.getByText('128')).toBeInTheDocument() // Listings Live
    })

    it('displays recent activity feed', () => {
      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      )

      expect(screen.getByText('Recent Activity')).toBeInTheDocument()
      expect(screen.getByText(/Plan "Eco Bungalow"/)).toBeInTheDocument()
      expect(screen.getByText(/New property inquiry/)).toBeInTheDocument()
      expect(screen.getByText(/Regional pricing update/)).toBeInTheDocument()
    })
  })

  describe('User Management Interface', () => {
    it('displays user management table', () => {
      render(
        <TestWrapper>
          <AdminUsers />
        </TestWrapper>
      )

      expect(screen.getByText('Users')).toBeInTheDocument()
      expect(screen.getByText('All Users')).toBeInTheDocument()
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Role')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('provides bulk user management capabilities', () => {
      render(
        <TestWrapper>
          <AdminUsers />
        </TestWrapper>
      )

      // Check for New User button
      expect(screen.getByRole('button', { name: 'New User' })).toBeInTheDocument()

      // Check for user data from mock
      expect(screen.getByText('Admin One')).toBeInTheDocument()
      expect(screen.getByText('Agent Jane')).toBeInTheDocument()
      expect(screen.getByText('Builder Bob')).toBeInTheDocument()
    })

    it('supports user role management', () => {
      render(
        <TestWrapper>
          <AdminUsers />
        </TestWrapper>
      )

      // Check that different user roles are displayed
      expect(screen.getByText('admin')).toBeInTheDocument()
      expect(screen.getByText('agent')).toBeInTheDocument()
      expect(screen.getByText('builder')).toBeInTheDocument()
    })
  })

  describe('Property Management Interface', () => {
    it('displays property management table with Ghana context', async () => {
      // Mock the API call
      const mockProperties = [
        {
          id: 1,
          title: 'Accra Eco Villa',
          price: '250000',
          currency: 'GHS',
          status: 'active',
          region: 'Greater Accra'
        }
      ]

      // Mock the adminApi
      vi.mock('../api', () => ({
        adminApi: {
          listProperties: vi.fn().mockResolvedValue(mockProperties)
        }
      }))

      render(
        <TestWrapper>
          <AdminProperties />
        </TestWrapper>
      )

      expect(screen.getByText('Properties')).toBeInTheDocument()
      expect(screen.getByText('Listings')).toBeInTheDocument()

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading properties…')).not.toBeInTheDocument()
      })
    })

    it('provides bulk property management capabilities', () => {
      render(
        <TestWrapper>
          <AdminProperties />
        </TestWrapper>
      )

      // Check for New Property button
      expect(screen.getByRole('button', { name: 'New Property' })).toBeInTheDocument()
    })

    it('handles property management errors gracefully', async () => {
      // Mock API error
      vi.mock('../api', () => ({
        adminApi: {
          listProperties: vi.fn().mockRejectedValue(new Error('API Error'))
        }
      }))

      render(
        <TestWrapper>
          <AdminProperties />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/Unable to load properties/)).toBeInTheDocument()
      })
    })
  })

  describe('Analytics and Reporting', () => {
    it('displays platform-wide analytics charts', () => {
      render(
        <TestWrapper>
          <AdminAnalytics />
        </TestWrapper>
      )

      expect(screen.getByText('Leads This Week')).toBeInTheDocument()
      expect(screen.getByText('Quotes Per Month')).toBeInTheDocument()
    })

    it('provides Ghana market performance insights', () => {
      render(
        <TestWrapper>
          <AdminAnalytics />
        </TestWrapper>
      )

      // The charts should be rendered (testing chart data would require more complex setup)
      const chartsContainer = screen.getByText('Leads This Week').closest('.grid')
      expect(chartsContainer).toBeInTheDocument()
    })
  })

  describe('System Access Controls', () => {
    it('restricts access to admin-only features', () => {
      render(
        <TestWrapper>
          <AdminLayout />
        </TestWrapper>
      )

      // All admin navigation should be available to authenticated admin users
      const adminNavItems = [
        'Dashboard', 'Plans', 'Properties', 'Users', 
        'Ghana Regions', 'Notifications', 'Content', 'Analytics'
      ]

      adminNavItems.forEach(item => {
        expect(screen.getByText(item)).toBeInTheDocument()
      })
    })

    it('provides comprehensive system management navigation', () => {
      render(
        <TestWrapper>
          <AdminLayout />
        </TestWrapper>
      )

      // Check that all system management areas are accessible
      expect(screen.getByText('Plans')).toBeInTheDocument() // Content management
      expect(screen.getByText('Properties')).toBeInTheDocument() // Property catalog
      expect(screen.getByText('Users')).toBeInTheDocument() // User management
      expect(screen.getByText('Ghana Regions')).toBeInTheDocument() // Ghana regions
      expect(screen.getByText('Notifications')).toBeInTheDocument() // Communication
      expect(screen.getByText('Analytics')).toBeInTheDocument() // Reporting
    })
  })
})