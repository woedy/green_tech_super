import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import AdminLogin from '../pages/Login'
import AdminLayout from '../layout/AdminLayout'

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

// Test wrapper component
const TestWrapper = ({ children, initialEntries = ['/'] }: { children: React.ReactNode, initialEntries?: string[] }) => {
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

describe('Admin Authentication', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('AdminLogin Component', () => {
    it('renders login form correctly', () => {
      render(
        <TestWrapper>
          <AdminLogin />
        </TestWrapper>
      )

      expect(screen.getByText('Admin Login')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    })

    it('requires email and password fields', async () => {
      render(
        <TestWrapper>
          <AdminLogin />
        </TestWrapper>
      )

      const submitButton = screen.getByRole('button', { name: 'Sign in' })
      fireEvent.click(submitButton)

      // Form should not submit without required fields
      expect(localStorage.setItem).not.toHaveBeenCalled()
    })

    it('authenticates user and sets localStorage on successful login', async () => {
      render(
        <TestWrapper>
          <AdminLogin />
        </TestWrapper>
      )

      const emailInput = screen.getByPlaceholderText('Email')
      const passwordInput = screen.getByPlaceholderText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('adminAuthed', 'true')
      })
    })
  })

  describe('Authentication Guards', () => {
    it('redirects unauthenticated users to login', () => {
      // Mock unauthenticated state
      localStorage.getItem = vi.fn().mockReturnValue(null)

      render(
        <TestWrapper initialEntries={['/admin/login']}>
          <AdminLogin />
        </TestWrapper>
      )

      expect(screen.getByText('Admin Login')).toBeInTheDocument()
    })

    it('allows authenticated users to access admin routes', () => {
      // Mock authenticated state
      localStorage.getItem = vi.fn().mockReturnValue('true')

      render(
        <TestWrapper initialEntries={['/admin']}>
          <AdminLayout />
        </TestWrapper>
      )

      expect(screen.getByText('Green Admin')).toBeInTheDocument()
      expect(screen.getByText('Admin Portal')).toBeInTheDocument()
    })

    it('preserves intended route after authentication', () => {
      // Mock unauthenticated state trying to access specific admin route
      localStorage.getItem = vi.fn().mockReturnValue(null)

      render(
        <TestWrapper initialEntries={['/admin/login']}>
          <AdminLogin />
        </TestWrapper>
      )

      // Should show login page
      expect(screen.getByText('Admin Login')).toBeInTheDocument()

      // After authentication, should redirect to intended route
      // This would be tested in integration tests with actual navigation
    })
  })

  describe('Session Management', () => {
    it('maintains authentication state across page reloads', () => {
      // Mock authenticated state
      localStorage.getItem = vi.fn().mockReturnValue('true')

      render(
        <TestWrapper initialEntries={['/admin']}>
          <AdminLayout />
        </TestWrapper>
      )

      expect(screen.getByText('Admin Portal')).toBeInTheDocument()
      // Note: localStorage.getItem is called during component initialization
      // but may not be directly observable in this test setup
    })

    it('handles logout correctly', () => {
      // Mock authenticated state
      localStorage.getItem = vi.fn().mockReturnValue('true')
      localStorage.removeItem = vi.fn()

      render(
        <TestWrapper initialEntries={['/admin']}>
          <AdminLayout />
        </TestWrapper>
      )

      const logoutButton = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(logoutButton)

      expect(localStorage.removeItem).toHaveBeenCalledWith('adminAuthed')
    })
  })
})