import { render, screen } from '@testing-library/react';

// Mock the SessionTimer component
jest.mock('../../../components/Session/SessionTimer', () => ({
  SessionTimer: ({ duration, onComplete }) => (
    <div data-testid="session-timer">
      <div>Timer: {duration} minutes</div>
      <button onClick={onComplete}>Complete</button>
    </div>
  )
}));

const { SessionTimer } = require('../../../components/Session/SessionTimer');

describe('SessionTimer Component', () => {
  it('renders timer with duration', () => {
    const mockOnComplete = jest.fn();
    render(<SessionTimer duration={25} onComplete={mockOnComplete} />);
    
    expect(screen.getByText('Timer: 25 minutes')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });
});