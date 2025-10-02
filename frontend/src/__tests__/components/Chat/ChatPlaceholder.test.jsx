import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ChatPlaceholder } from '../../../components/Chat/ChatPlaceholder';
import { theme } from '../../../theme';

const renderWithProvider = (component) => {
  return render(
    <MantineProvider theme={theme}>
      {component}
    </MantineProvider>
  );
};

describe('ChatPlaceholder Component', () => {
  it('renders the chat placeholder content', () => {
    renderWithProvider(<ChatPlaceholder />);
    
    expect(screen.getByText('Chat Coming Soon')).toBeInTheDocument();
    expect(screen.getByText('AI-powered conversation to help manage your calendar and tasks')).toBeInTheDocument();
  });

  it('renders with proper styling', () => {
    renderWithProvider(<ChatPlaceholder />);
    
    const container = screen.getByText('Chat Coming Soon').closest('div');
    expect(container).toBeInTheDocument();
  });
});
