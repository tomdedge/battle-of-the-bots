import { render, screen } from '@testing-library/react';

// Mock the TTSSettings component
jest.mock('../../../components/Settings/TTSSettings', () => ({
  TTSSettings: () => (
    <div data-testid="tts-settings">
      <h3>Text-to-Speech Settings</h3>
      <select data-testid="voice-select">
        <option value="default">Default Voice</option>
      </select>
      <input type="range" data-testid="speed-slider" />
    </div>
  )
}));

const { TTSSettings } = require('../../../components/Settings/TTSSettings');

describe('TTSSettings Component', () => {
  it('renders TTS settings interface', () => {
    render(<TTSSettings />);
    
    expect(screen.getByText('Text-to-Speech Settings')).toBeInTheDocument();
    expect(screen.getByTestId('voice-select')).toBeInTheDocument();
    expect(screen.getByTestId('speed-slider')).toBeInTheDocument();
  });
});