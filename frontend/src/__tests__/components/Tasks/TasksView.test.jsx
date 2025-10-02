import { render, screen } from '@testing-library/react';
import { TasksView } from '../../../components/Tasks/TasksView';

// Mock the entire Mantine core module to avoid media query issues
jest.mock('@mantine/core', () => ({
  Stack: ({ children, ...props }) => <div data-testid="stack" {...props}>{children}</div>,
  Paper: ({ children, ...props }) => <div data-testid="paper" {...props}>{children}</div>,
  Group: ({ children, ...props }) => <div data-testid="group" {...props}>{children}</div>,
  Select: ({ value, onChange, data, ...props }) => (
    <select data-testid="select" value={value} onChange={onChange} {...props}>
      {data?.map(item => (
        <option key={item.value} value={item.value}>{item.label}</option>
      ))}
    </select>
  ),
  Button: ({ children, onClick, leftSection, ...props }) => (
    <button data-testid="button" onClick={onClick} {...props}>
      {leftSection}
      {children}
    </button>
  ),
  LoadingOverlay: ({ visible }) => visible ? <div data-testid="loading">Loading...</div> : null,
  Text: ({ children, ...props }) => <span data-testid="text" {...props}>{children}</span>,
  MantineProvider: ({ children }) => <div>{children}</div>,
}));

// Mock API service
jest.mock('../../../services/api', () => {
  return jest.fn().mockImplementation(() => ({
    getTaskLists: jest.fn().mockResolvedValue({ taskLists: [{ id: '@default', title: 'My Tasks' }] }),
    getTasks: jest.fn().mockResolvedValue({ tasks: [] }),
    createTask: jest.fn().mockResolvedValue({}),
    completeTask: jest.fn().mockResolvedValue({}),
    deleteTask: jest.fn().mockResolvedValue({})
  }));
});

// Mock AuthContext
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-token',
    user: { id: '1', email: 'test@example.com' }
  })
}));

// Mock Tabler icons
jest.mock('@tabler/icons-react', () => ({
  IconPlus: () => <span data-testid="plus-icon">+</span>,
}));

describe('TasksView Component', () => {
  it('renders tasks view', () => {
    render(<TasksView />);
    
    // Should render without crashing and show the Add Task button
    expect(screen.getByText('Add Task')).toBeInTheDocument();
  });
});
