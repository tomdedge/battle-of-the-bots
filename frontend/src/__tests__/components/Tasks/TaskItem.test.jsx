import { render, screen } from '@testing-library/react';
import { TaskItem } from '../../../components/Tasks/TaskItem';

// Mock the entire Mantine core module to avoid media query issues
jest.mock('@mantine/core', () => {
  const MenuTarget = ({ children }) => <div data-testid="menu-target">{children}</div>;
  const MenuDropdown = ({ children }) => <div data-testid="menu-dropdown">{children}</div>;
  const MenuItem = ({ children, onClick, leftSection, ...props }) => {
    const { leftSection: _, ...cleanProps } = props;
    return (
      <button data-testid="menu-item" onClick={onClick} {...cleanProps}>
        {children}
      </button>
    );
  };
  
  const Menu = ({ children }) => <div data-testid="menu">{children}</div>;
  Menu.Target = MenuTarget;
  Menu.Dropdown = MenuDropdown;
  Menu.Item = MenuItem;

  return {
    Card: ({ children, withBorder, p, ...props }) => {
      const { withBorder: _, p: __, ...cleanProps } = props;
      return <div data-testid="card" {...cleanProps}>{children}</div>;
    },
    Text: ({ children, td, c, ...props }) => {
      const { td: _, c: __, ...cleanProps } = props;
      return (
        <span 
          data-testid="text" 
          style={{ textDecoration: td, color: c }}
          {...cleanProps}
        >
          {children}
        </span>
      );
    },
    Group: ({ children, justify, ...props }) => {
      const { justify: _, ...cleanProps } = props;
      return <div data-testid="group" {...cleanProps}>{children}</div>;
    },
    Checkbox: ({ checked, onChange, ...props }) => (
      <input 
        type="checkbox"
        data-testid="checkbox"
        checked={checked}
        onChange={onChange}
        {...props}
      />
    ),
    ActionIcon: ({ children, onClick, variant, ...props }) => {
      const { variant: _, ...cleanProps } = props;
      return (
        <button data-testid="action-icon" onClick={onClick} {...cleanProps}>
          {children}
        </button>
      );
    },
    Menu,
    MantineProvider: ({ children }) => <div>{children}</div>,
  };
});

// Mock Tabler icons
jest.mock('@tabler/icons-react', () => ({
  IconDots: () => <span data-testid="dots-icon">⋯</span>,
  IconEdit: () => <span data-testid="edit-icon">✏️</span>,
  IconTrash: () => <span data-testid="trash-icon">🗑️</span>,
}));

describe('TaskItem Component', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    notes: 'Test notes',
    status: 'needsAction'
  };

  const mockOnComplete = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders task information', () => {
    render(
      <TaskItem 
        task={mockTask} 
        onComplete={mockOnComplete}
        onDelete={mockOnDelete}
        onUpdate={mockOnUpdate}
      />
    );
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test notes')).toBeInTheDocument();
  });

  it('renders completed task with strikethrough', () => {
    const completedTask = { ...mockTask, status: 'completed' };
    
    render(
      <TaskItem 
        task={completedTask} 
        onDelete={mockOnDelete}
        onUpdate={mockOnUpdate}
      />
    );
    
    const taskTitle = screen.getByText('Test Task');
    expect(taskTitle).toHaveStyle('text-decoration: line-through');
  });
});
