import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { CalendarPlaceholder } from '../../../components/Calendar/CalendarPlaceholder';
import { theme } from '../../../theme';

const renderWithProvider = (component) => {
  return render(
    <MantineProvider theme={theme}>
      {component}
    </MantineProvider>
  );
};

describe('CalendarPlaceholder Component', () => {
  it('renders the calendar placeholder content', () => {
    renderWithProvider(<CalendarPlaceholder />);
    
    expect(screen.getByText('Calendar Coming Soon')).toBeInTheDocument();
    expect(screen.getByText('Smart calendar with AI-suggested focus blocks')).toBeInTheDocument();
  });

  it('renders with proper styling', () => {
    renderWithProvider(<CalendarPlaceholder />);
    
    const container = screen.getByText('Calendar Coming Soon').closest('div');
    expect(container).toBeInTheDocument();
  });
});
