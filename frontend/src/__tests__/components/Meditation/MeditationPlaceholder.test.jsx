import { render, screen } from '@testing-library/react';
import { MeditationPlaceholder } from '../../../components/Meditation/MeditationPlaceholder';

// Mock the entire MeditationMenu component to avoid Mantine hooks issues
jest.mock('../../../components/Meditation/MeditationMenu', () => ({
  MeditationMenu: () => (
    <div data-testid="meditation-menu">
      <h2>Box Breathing</h2>
      <p>4-4-4-4 breathing pattern for focus and calm</p>
      <h2>Soundscapes</h2>
      <p>Ambient sounds to enhance your meditation</p>
    </div>
  )
}));



describe('MeditationPlaceholder Component', () => {
  it('renders the meditation menu', () => {
    render(<MeditationPlaceholder />);
    
    expect(screen.getByText('Box Breathing')).toBeInTheDocument();
    expect(screen.getByText('Soundscapes')).toBeInTheDocument();
  });

  it('renders meditation options', () => {
    render(<MeditationPlaceholder />);
    
    expect(screen.getByText('4-4-4-4 breathing pattern for focus and calm')).toBeInTheDocument();
    expect(screen.getByText('Ambient sounds to enhance your meditation')).toBeInTheDocument();
  });
});
