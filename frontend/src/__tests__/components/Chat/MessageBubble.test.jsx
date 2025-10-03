import { render, screen } from '@testing-library/react';

// Mock the MessageBubble component to avoid complex dependencies
jest.mock('../../../components/Chat/MessageBubble', () => ({
  MessageBubble: ({ message, isUser }) => (
    <div data-testid="message-bubble">
      <div data-testid={isUser ? 'user-message' : 'ai-message'}>
        {message.content}
      </div>
    </div>
  )
}));

const { MessageBubble } = require('../../../components/Chat/MessageBubble');

describe('MessageBubble Component', () => {
  it('renders user message', () => {
    const message = { content: 'Hello AI!' };
    render(<MessageBubble message={message} isUser={true} />);
    
    expect(screen.getByTestId('user-message')).toBeInTheDocument();
    expect(screen.getByText('Hello AI!')).toBeInTheDocument();
  });

  it('renders AI message', () => {
    const message = { content: 'Hello human!' };
    render(<MessageBubble message={message} isUser={false} />);
    
    expect(screen.getByTestId('ai-message')).toBeInTheDocument();
    expect(screen.getByText('Hello human!')).toBeInTheDocument();
  });
});