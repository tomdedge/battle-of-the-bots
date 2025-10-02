import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { BottomTabs } from '../../../components/Navigation/BottomTabs';
import { theme } from '../../../theme';

const renderWithProvider = (component) => {
  return render(
    <MantineProvider theme={theme}>
      {component}
    </MantineProvider>
  );
};

describe('BottomTabs Component', () => {
  const mockSetActiveTab = jest.fn();

  beforeEach(() => {
    mockSetActiveTab.mockClear();
  });

  it('renders all navigation tabs', () => {
    renderWithProvider(<BottomTabs activeTab="chat" setActiveTab={mockSetActiveTab} />);
    
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Meditation')).toBeInTheDocument();
  });

  it('highlights the active tab', () => {
    renderWithProvider(<BottomTabs activeTab="calendar" setActiveTab={mockSetActiveTab} />);
    
    const calendarTab = screen.getByText('Calendar').closest('button');
    expect(calendarTab).toHaveAttribute('data-active', 'true');
  });

  it('calls setActiveTab when a tab is clicked', () => {
    renderWithProvider(<BottomTabs activeTab="chat" setActiveTab={mockSetActiveTab} />);
    
    const tasksTab = screen.getByText('Tasks');
    fireEvent.click(tasksTab);
    
    expect(mockSetActiveTab).toHaveBeenCalledWith('tasks');
  });

  it('renders with correct styling for mobile', () => {
    renderWithProvider(<BottomTabs activeTab="chat" setActiveTab={mockSetActiveTab} />);
    
    const tabsContainer = screen.getByRole('tablist');
    expect(tabsContainer).toBeInTheDocument();
  });
});
