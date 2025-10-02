import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MeditationPlaceholder } from '../../../components/Meditation/MeditationPlaceholder';
import { theme } from '../../../theme';

const renderWithProvider = (component) => {
  return render(
    <MantineProvider theme={theme}>
      {component}
    </MantineProvider>
  );
};

describe('MeditationPlaceholder Component', () => {
  it('renders the meditation placeholder content', () => {
    renderWithProvider(<MeditationPlaceholder />);
    
    expect(screen.getByText('Meditation Coming Soon')).toBeInTheDocument();
    expect(screen.getByText('Box breathing exercises to help you focus')).toBeInTheDocument();
  });

  it('renders with proper styling', () => {
    renderWithProvider(<MeditationPlaceholder />);
    
    const container = screen.getByText('Meditation Coming Soon').closest('div');
    expect(container).toBeInTheDocument();
  });
});
