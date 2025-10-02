import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MeditationPlaceholder } from '../../../components/Meditation/MeditationPlaceholder';
import { theme } from '../../../theme';

// Mock the BoxBreathing component to avoid media query issues
jest.mock('../../../components/Meditation/BoxBreathing', () => ({
  BoxBreathing: () => (
    <div>
      <h2>Box Breathing</h2>
      <p>4-4-4-4 breathing pattern for focus and calm</p>
      <button>Reset</button>
      <div>Breathe In</div>
    </div>
  )
}));

const renderWithProvider = (component) => {
  return render(
    <MantineProvider theme={theme}>
      {component}
    </MantineProvider>
  );
};

describe('MeditationPlaceholder Component', () => {
  it('renders the box breathing interface', () => {
    renderWithProvider(<MeditationPlaceholder />);
    
    expect(screen.getByText('Box Breathing')).toBeInTheDocument();
    expect(screen.getByText('4-4-4-4 breathing pattern for focus and calm')).toBeInTheDocument();
  });

  it('renders with proper controls', () => {
    renderWithProvider(<MeditationPlaceholder />);
    
    expect(screen.getByText('Reset')).toBeInTheDocument();
    expect(screen.getByText('Breathe In')).toBeInTheDocument();
  });
});
