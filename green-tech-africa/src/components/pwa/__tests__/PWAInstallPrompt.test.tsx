// Tests for PWA install prompt component
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PWAInstallPrompt, usePWAStatus } from '../PWAInstallPrompt';
import { renderHook } from '@testing-library/react';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn()
  }
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

// Mock window events
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
Object.defineProperty(window, 'addEventListener', { value: mockAddEventListener });
Object.defineProperty(window, 'removeEventListener', { value: mockRemoveEventListener });

describe('PWAInstallPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    mockSessionStorage.getItem.mockReturnValue(null);
    
    // Reset matchMedia mock
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not render when app is already installed', () => {
    // Mock standalone mode
    window.matchMedia = vi.fn().mockImplementation(query => {
      if (query === '(display-mode: standalone)') {
        return { matches: true };
      }
      return { matches: false };
    });

    render(<PWAInstallPrompt />);
    
    expect(screen.queryByText('Install Green Tech Africa')).not.toBeInTheDocument();
  });

  it('should not render when install was dismissed this session', () => {
    mockSessionStorage.getItem.mockReturnValue('true');
    
    render(<PWAInstallPrompt />);
    
    expect(screen.queryByText('Install Green Tech Africa')).not.toBeInTheDocument();
  });

  it('should show offline indicator when offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    
    render(<PWAInstallPrompt />);
    
    expect(screen.getByText("You're offline. Some features may be limited.")).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // WifiOff icon
  });

  it('should register event listeners on mount', () => {
    render(<PWAInstallPrompt />);
    
    expect(mockAddEventListener).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('appinstalled', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should cleanup event listeners on unmount', () => {
    const { unmount } = render(<PWAInstallPrompt />);
    
    unmount();
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('appinstalled', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should show install prompt after beforeinstallprompt event', async () => {
    render(<PWAInstallPrompt />);
    
    // Get the beforeinstallprompt handler
    const beforeInstallHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'beforeinstallprompt'
    )?.[1];

    expect(beforeInstallHandler).toBeDefined();

    // Create mock event
    const mockEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' })
    };

    // Trigger the event
    beforeInstallHandler(mockEvent);

    // Wait for the delayed prompt to show
    await waitFor(() => {
      expect(screen.getByText('Install Green Tech Africa')).toBeInTheDocument();
    }, { timeout: 4000 });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should handle install button click', async () => {
    render(<PWAInstallPrompt />);
    
    // Simulate beforeinstallprompt event
    const beforeInstallHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'beforeinstallprompt'
    )?.[1];

    const mockEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' })
    };

    beforeInstallHandler(mockEvent);

    await waitFor(() => {
      expect(screen.getByText('Install Green Tech Africa')).toBeInTheDocument();
    }, { timeout: 4000 });

    const installButton = screen.getByRole('button', { name: /install app/i });
    fireEvent.click(installButton);

    await waitFor(() => {
      expect(mockEvent.prompt).toHaveBeenCalled();
    });
  });

  it('should handle install dismissal', async () => {
    render(<PWAInstallPrompt />);
    
    // Simulate beforeinstallprompt event
    const beforeInstallHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'beforeinstallprompt'
    )?.[1];

    const mockEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'dismissed', platform: 'web' })
    };

    beforeInstallHandler(mockEvent);

    await waitFor(() => {
      expect(screen.getByText('Install Green Tech Africa')).toBeInTheDocument();
    }, { timeout: 4000 });

    const dismissButton = screen.getByRole('button', { name: /not now/i });
    fireEvent.click(dismissButton);

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('pwa-install-dismissed', 'true');
    expect(screen.queryByText('Install Green Tech Africa')).not.toBeInTheDocument();
  });

  it('should handle app installed event', () => {
    const { toast } = require('sonner');
    render(<PWAInstallPrompt />);
    
    // Get the appinstalled handler
    const appInstalledHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'appinstalled'
    )?.[1];

    expect(appInstalledHandler).toBeDefined();

    // Trigger the event
    appInstalledHandler();

    expect(toast.success).toHaveBeenCalledWith('Green Tech Africa installed successfully!');
  });

  it('should handle install errors', async () => {
    const { toast } = require('sonner');
    render(<PWAInstallPrompt />);
    
    // Simulate beforeinstallprompt event
    const beforeInstallHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'beforeinstallprompt'
    )?.[1];

    const mockEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockRejectedValue(new Error('Install failed')),
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' })
    };

    beforeInstallHandler(mockEvent);

    await waitFor(() => {
      expect(screen.getByText('Install Green Tech Africa')).toBeInTheDocument();
    }, { timeout: 4000 });

    const installButton = screen.getByRole('button', { name: /install app/i });
    fireEvent.click(installButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Installation failed. Please try again.');
    });
  });
});

describe('usePWAStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('should return initial PWA status', () => {
    const { result } = renderHook(() => usePWAStatus());
    
    expect(result.current.isInstalled).toBe(false);
    expect(result.current.isOnline).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  it('should detect standalone mode installation', () => {
    window.matchMedia = vi.fn().mockImplementation(query => {
      if (query === '(display-mode: standalone)') {
        return { matches: true };
      }
      return { matches: false };
    });

    const { result } = renderHook(() => usePWAStatus());
    
    expect(result.current.isInstalled).toBe(true);
  });

  it('should detect iOS web app installation', () => {
    Object.defineProperty(window.navigator, 'standalone', {
      value: true,
      writable: true
    });

    const { result } = renderHook(() => usePWAStatus());
    
    expect(result.current.isInstalled).toBe(true);
  });

  it('should detect offline status', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    
    const { result } = renderHook(() => usePWAStatus());
    
    expect(result.current.isOnline).toBe(false);
  });

  it('should register event listeners', () => {
    renderHook(() => usePWAStatus());
    
    expect(mockAddEventListener).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('appinstalled', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should cleanup event listeners on unmount', () => {
    const { unmount } = renderHook(() => usePWAStatus());
    
    unmount();
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('appinstalled', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});