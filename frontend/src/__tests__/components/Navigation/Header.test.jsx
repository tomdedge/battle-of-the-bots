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
  Drawer: ({ children, opened }) => opened ? <div data-testid="drawer">{children}</div> : null,
  Stack: ({ children, ...props }) => <div data-testid="stack" {...props}>{children}</div>,
  Button: ({ children, onClick, ...props }) => (
    <button data-testid="button" onClick={onClick} {...props}>{children}</button>
  ),
  Text: ({ children, ...props }) => <span data-testid="text" {...props}>{children}</span>,
  useMantineColorScheme: () => ({
    colorScheme: 'light',
    toggleColorScheme: mockToggleColorScheme,
  }),
}));

// Mock Mantine hooks
jest.mock('@mantine/hooks', () => ({
  useDisclosure: () => [false, { open: jest.fn(), close: jest.fn() }],
}));

// Mock Tabler icons
jest.mock('@tabler/icons-react', () => ({
  IconSun: () => <span data-testid="sun-icon">☀️</span>,
  IconMoon: () => <span data-testid="moon-icon">🌙</span>,
  IconMenu2: () => <span data-testid="menu-icon">☰</span>,
  IconLogout: () => <span data-testid="logout-icon">🚪</span>,
}));

// Mock AuthContext
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Test User', email: 'test@example.com' },
    logout: jest.fn(),
  }),
}));

describe('Header Component', () => {
  beforeEach(() => {
    mockToggleColorScheme.mockClear();
  });

  it('renders the AuraFlow title', () => {
    render(<Header />);
    expect(screen.getByText('AuraFlow')).toBeInTheDocument();
  });

  it('renders both action buttons', () => {
    render(<Header />);
    const actionButtons = screen.getAllByTestId('action-icon');
    expect(actionButtons).toHaveLength(2); // hamburger menu + theme toggle
  });

  it('calls toggleColorScheme when theme button is clicked', () => {
    render(<Header />);
    // Get the theme toggle button (the one with moon icon)
    const themeButton = screen.getByTestId('moon-icon').closest('button');
    fireEvent.click(themeButton);
    expect(mockToggleColorScheme).toHaveBeenCalledTimes(1);
  });

  it('displays moon icon in light mode', () => {
    render(<Header />);
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
  });

  it('displays hamburger menu icon', () => {
    render(<Header />);
    expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
  });
});
