import { renderHook, act } from '@testing-library/react';
import { usePWA } from '../../hooks/usePWA';

describe('usePWA Hook', () => {
  beforeEach(() => {
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Mock navigator.standalone
    Object.defineProperty(window.navigator, 'standalone', {
      writable: true,
      value: false,
    });
  });

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => usePWA());

    expect(result.current.isInstallable).toBe(false);
    expect(result.current.isInstalled).toBe(false);
    expect(typeof result.current.installApp).toBe('function');
  });

  it('detects standalone mode', () => {
    window.matchMedia.mockReturnValue({ matches: true });
    
    const { result } = renderHook(() => usePWA());
    expect(result.current.isInstalled).toBe(true);
  });

  it('detects webkit standalone', () => {
    Object.defineProperty(window.navigator, 'standalone', {
      writable: true,
      value: true,
    });
    
    const { result } = renderHook(() => usePWA());
    expect(result.current.isInstalled).toBe(true);
  });

  it('handles beforeinstallprompt event', () => {
    const { result } = renderHook(() => usePWA());
    
    const mockEvent = {
      preventDefault: jest.fn(),
      prompt: jest.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' })
    };
    
    act(() => {
      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent));
    });
    
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(result.current.isInstallable).toBe(true);
  });

  it('handles app installed event', () => {
    const { result } = renderHook(() => usePWA());
    
    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });
    
    expect(result.current.isInstalled).toBe(true);
    expect(result.current.isInstallable).toBe(false);
  });

  it('installs app successfully', async () => {
    const { result } = renderHook(() => usePWA());
    
    const mockEvent = {
      preventDefault: jest.fn(),
      prompt: jest.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' })
    };
    
    act(() => {
      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent));
    });
    
    let installResult;
    await act(async () => {
      installResult = await result.current.installApp();
    });
    
    expect(mockEvent.prompt).toHaveBeenCalled();
    expect(installResult).toBe(true);
    expect(result.current.isInstallable).toBe(false);
  });

  it('handles install rejection', async () => {
    const { result } = renderHook(() => usePWA());
    
    const mockEvent = {
      preventDefault: jest.fn(),
      prompt: jest.fn(),
      userChoice: Promise.resolve({ outcome: 'dismissed' })
    };
    
    act(() => {
      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent));
    });
    
    let installResult;
    await act(async () => {
      installResult = await result.current.installApp();
    });
    
    expect(installResult).toBe(false);
  });

  it('returns false when no deferred prompt', async () => {
    const { result } = renderHook(() => usePWA());
    
    let installResult;
    await act(async () => {
      installResult = await result.current.installApp();
    });
    
    expect(installResult).toBe(false);
  });
});