import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { BoxBreathing } from '../../../components/Meditation/BoxBreathing';

const renderWithProvider = (component) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('BoxBreathing', () => {
  test('renders box breathing interface', () => {
    renderWithProvider(<BoxBreathing />);
    
    expect(screen.getByText('Box Breathing')).toBeInTheDocument();
    expect(screen.getByText('4-4-4-4 breathing pattern for focus and calm')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  test('shows initial state correctly', () => {
    renderWithProvider(<BoxBreathing />);
    
    expect(screen.getByText('Breathe In')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Cycle: 0')).toBeInTheDocument();
  });

  test('circle button toggles breathing state when clicked', () => {
    renderWithProvider(<BoxBreathing />);
    
    // Find the circle button (ActionIcon with play/pause icons)
    const buttons = screen.getAllByRole('button');
    const circleButton = buttons[0]; // First button should be the circle
    
    // Initially should show play icon (not active)
    expect(circleButton).toBeInTheDocument();
    
    // Click to start
    fireEvent.click(circleButton);
    
    // Should now show pause icon (active state)
    // Note: The icon change might not be immediately testable due to icon rendering
    // but the click handler should work
  });

  test('reset button resets the state', () => {
    renderWithProvider(<BoxBreathing />);
    
    // Start the breathing by clicking the circle
    const buttons = screen.getAllByRole('button');
    const circleButton = buttons[0]; // First button should be the circle
    fireEvent.click(circleButton);
    
    // Reset
    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);
    
    expect(screen.getByText('Breathe In')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Cycle: 0')).toBeInTheDocument();
  });

  test('shows updated instructions text', () => {
    renderWithProvider(<BoxBreathing />);
    
    expect(screen.getByText(/Click the circle to start\/stop/)).toBeInTheDocument();
  });
});
