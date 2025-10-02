import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../../../components/Navigation/Header';

// Mock the entire Mantine core module to avoid media query issues
const mockToggleColorScheme = jest.fn();
jest.mock('@mantine/core', () => ({
  Group: ({ children, ...props }) => <div data-testid="group" {...props}>{children}</div>,
  ActionIcon: ({ children, onClick, ...props }) => (
    <button data-testid="action-icon" onClick={onClick} {...props}>
      {children}
    </button>
  ),
  Title: ({ children, ...props }) => <h3 data-testid="title" {...props}>{children}</h3>,
  MantineProvider: ({ children }) => <div>{children}</div>,
  useMantineColorScheme: () => ({
    colorScheme: 'light',
    toggleColorScheme: mockToggleColorScheme,
  }),
}));

// Mock Tabler icons
jest.mock('@tabler/icons-react', () => ({
  IconSun: () => <span data-testid="sun-icon">☀️</span>,
  IconMoon: () => <span data-testid="moon-icon">🌙</span>,
}));

describe('Header Component', () => {
  beforeEach(() => {
    mockToggleColorScheme.mockClear();
  });

  it('renders the AuraFlow title', () => {
    render(<Header />);
    expect(screen.getByText('AuraFlow')).toBeInTheDocument();
  });

  it('renders the theme toggle button', () => {
    render(<Header />);
    const toggleButton = screen.getByTestId('action-icon');
    expect(toggleButton).toBeInTheDocument();
  });

  it('calls toggleColorScheme when theme button is clicked', () => {
    render(<Header />);
    const toggleButton = screen.getByTestId('action-icon');
    fireEvent.click(toggleButton);
    expect(mockToggleColorScheme).toHaveBeenCalledTimes(1);
  });

  it('displays moon icon in light mode', () => {
    render(<Header />);
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
  });
});
