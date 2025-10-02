import { render, screen, fireEvent } from '@testing-library/react';
import { TaskForm } from '../../../components/Tasks/TaskForm';

// Mock the entire Mantine core module to avoid media query issues
jest.mock('@mantine/core', () => ({
  Card: ({ children, withBorder, p, ...props }) => {
    const { withBorder: _, p: __, ...cleanProps } = props;
    return <div data-testid="card" {...cleanProps}>{children}</div>;
  },
  TextInput: ({ label, value, onChange, required, id, ...props }) => {
    const inputId = id || 'text-input';
    const { mb, placeholder, ...cleanProps } = props;
    return (
      <div>
        <label htmlFor={inputId}>{label}</label>
        <input 
          id={inputId}
          data-testid="text-input"
          value={value || ''}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          {...cleanProps}
        />
      </div>
    );
  },
  Textarea: ({ label, value, onChange, id, ...props }) => {
    const textareaId = id || 'textarea';
    const { mb, placeholder, rows, ...cleanProps } = props;
    return (
      <div>
        <label htmlFor={textareaId}>{label}</label>
        <textarea 
          id={textareaId}
          data-testid="textarea"
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          {...cleanProps}
        />
      </div>
    );
  },
  Button: ({ children, onClick, disabled, type, leftSection, variant, color, ...props }) => {
    const { leftSection: _, variant: __, color: ___, ...cleanProps } = props;
    return (
      <button 
        data-testid="button"
        onClick={onClick}
        disabled={disabled}
        type={type}
        {...cleanProps}
      >
        {children}
      </button>
    );
  },
  Group: ({ children, gap, justify, ...props }) => {
    const { gap: _, justify: __, ...cleanProps } = props;
    return <div data-testid="group" {...cleanProps}>{children}</div>;
  },
  MantineProvider: ({ children }) => <div>{children}</div>,
}));

// Mock Tabler icons
jest.mock('@tabler/icons-react', () => ({
  IconPlus: () => <span data-testid="plus-icon">+</span>,
  IconX: () => <span data-testid="x-icon">×</span>,
}));

describe('TaskForm Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields', () => {
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    expect(screen.getByLabelText('Task Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes (optional)')).toBeInTheDocument();
    expect(screen.getByText('Add Task')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
