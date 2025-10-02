import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { TasksPlaceholder } from '../../../components/Tasks/TasksPlaceholder';
import { theme } from '../../../theme';

const renderWithProvider = (component) => {
  return render(
    <MantineProvider theme={theme}>
      {component}
    </MantineProvider>
  );
};

describe('TasksPlaceholder Component', () => {
  it('renders the tasks placeholder content', () => {
    renderWithProvider(<TasksPlaceholder />);
    
    expect(screen.getByText('Tasks Coming Soon')).toBeInTheDocument();
    expect(screen.getByText('Integrated task management with Google Tasks')).toBeInTheDocument();
  });

  it('renders with proper styling', () => {
    renderWithProvider(<TasksPlaceholder />);
    
    const container = screen.getByText('Tasks Coming Soon').closest('div');
    expect(container).toBeInTheDocument();
  });
});
