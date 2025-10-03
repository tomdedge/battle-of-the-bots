import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { InstallPrompt } from '../../components/InstallPrompt';
import * as usePWAHook from '../../hooks/usePWA';

// Mock the usePWA hook
jest.mock('../../hooks/usePWA');

const renderWithProvider = (component) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('InstallPrompt Component', () => {
  let mockUsePWA;

  beforeEach(() => {
    mockUsePWA = {
      isInstallable: false,
      isInstalled: false,
      installApp: jest.fn()
    };
    usePWAHook.usePWA.mockReturnValue(mockUsePWA);
    
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('does not render when already installed', () => {
    mockUsePWA.isInstalled = true;
    
    renderWithProvider(<InstallPrompt />);
    
    expect(screen.queryByText('Install AuraFlow')).not.toBeInTheDocument();
  });

  it('renders install prompt when installable', () => {
    mockUsePWA.isInstallable = true;
    
    renderWithProvider(<InstallPrompt />);
    
    expect(screen.getByText('Install AuraFlow')).toBeInTheDocument();
    expect(screen.getByText('Add to your home screen for quick access')).toBeInTheDocument();
    expect(screen.getByText('Install')).toBeInTheDocument();
  });

  it('shows manual instructions after delay when not installable', async () => {
    mockUsePWA.isInstallable = false;
    
    renderWithProvider(<InstallPrompt />);
    
    // Initially should not render
    expect(screen.queryByText('Add to Home Screen')).not.toBeInTheDocument();
    
    // Fast forward 5 seconds
    jest.advanceTimersByTime(5000);
    
    // Re-render to trigger state update
    renderWithProvider(<InstallPrompt />);
    
    await waitFor(() => {
      expect(screen.getByText('Add to Home Screen')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Use browser menu → "Add to Home Screen"')).toBeInTheDocument();
    expect(screen.getByText('Got it')).toBeInTheDocument();
  });

  it('calls installApp when install button clicked', async () => {
    mockUsePWA.isInstallable = true;
    mockUsePWA.installApp.mockResolvedValue(true);
    
    renderWithProvider(<InstallPrompt />);
    
    const installButton = screen.getByText('Install');
    fireEvent.click(installButton);
    
    expect(mockUsePWA.installApp).toHaveBeenCalled();
    
    // Wait for async operation
    await waitFor(() => {
      expect(screen.queryByText('Install AuraFlow')).not.toBeInTheDocument();
    });
  });

  it('does not dismiss when install fails', async () => {
    mockUsePWA.isInstallable = true;
    mockUsePWA.installApp.mockResolvedValue(false);
    
    renderWithProvider(<InstallPrompt />);
    
    const installButton = screen.getByText('Install');
    fireEvent.click(installButton);
    
    expect(mockUsePWA.installApp).toHaveBeenCalled();
    
    // Should still be visible after failed install
    await waitFor(() => {
      expect(screen.getByText('Install AuraFlow')).toBeInTheDocument();
    });
  });

  it('dismisses when close button clicked', () => {
    mockUsePWA.isInstallable = true;
    
    const { rerender } = renderWithProvider(<InstallPrompt />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    // Re-render to trigger state update
    rerender(
      <MantineProvider>
        <InstallPrompt />
      </MantineProvider>
    );
    
    expect(screen.queryByText('Install AuraFlow')).not.toBeInTheDocument();
  });

  it('dismisses when "Got it" button clicked', async () => {
    mockUsePWA.isInstallable = false;
    
    renderWithProvider(<InstallPrompt />);
    
    // Fast forward to show manual instructions
    jest.advanceTimersByTime(5000);
    
    const { rerender } = renderWithProvider(<InstallPrompt />);
    
    await waitFor(() => {
      expect(screen.getByText('Got it')).toBeInTheDocument();
    });
    
    const gotItButton = screen.getByText('Got it');
    fireEvent.click(gotItButton);
    
    // Re-render to trigger state update
    rerender(
      <MantineProvider>
        <InstallPrompt />
      </MantineProvider>
    );
    
    expect(screen.queryByText('Add to Home Screen')).not.toBeInTheDocument();
  });

  it('has correct styling and positioning', () => {
    mockUsePWA.isInstallable = true;
    
    renderWithProvider(<InstallPrompt />);
    
    const paper = screen.getByText('Install AuraFlow').closest('[class*="Paper"]');
    expect(paper).toHaveStyle({
      position: 'fixed',
      bottom: '80px',
      left: '16px',
      right: '16px',
      zIndex: '1000'
    });
  });

  it('shows download icon in install button', () => {
    mockUsePWA.isInstallable = true;
    
    renderWithProvider(<InstallPrompt />);
    
    const installButton = screen.getByText('Install');
    expect(installButton).toBeInTheDocument();
    // Icon is rendered as SVG, check for its presence
    expect(installButton.querySelector('svg')).toBeInTheDocument();
  });

  it('shows close icon in close button', () => {
    mockUsePWA.isInstallable = true;
    
    renderWithProvider(<InstallPrompt />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton.querySelector('svg')).toBeInTheDocument();
  });
});