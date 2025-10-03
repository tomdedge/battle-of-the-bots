import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple LoadingSpinner component for testing
export const LoadingSpinner = ({ size = 'medium', color = 'blue', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    red: 'text-red-500'
  };

  return (
    <div className="flex flex-col items-center justify-center p-4" data-testid="loading-spinner">
      <div 
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-current ${sizeClasses[size]} ${colorClasses[color]}`}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className="mt-2 text-sm text-gray-600" data-testid="loading-text">
          {text}
        </p>
      )}
    </div>
  );
};

describe('LoadingSpinner Component', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByTestId('loading-spinner');
    const text = screen.getByTestId('loading-text');
    
    expect(spinner).toBeInTheDocument();
    expect(text).toHaveTextContent('Loading...');
  });

  it('renders with custom text', () => {
    render(<LoadingSpinner text="Please wait..." />);
    
    const text = screen.getByTestId('loading-text');
    expect(text).toHaveTextContent('Please wait...');
  });

  it('renders without text when text is empty', () => {
    render(<LoadingSpinner text="" />);
    
    const text = screen.queryByTestId('loading-text');
    expect(text).not.toBeInTheDocument();
  });

  it('renders without text when text is null', () => {
    render(<LoadingSpinner text={null} />);
    
    const text = screen.queryByTestId('loading-text');
    expect(text).not.toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<LoadingSpinner size="small" />);
    let spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('w-4', 'h-4');

    rerender(<LoadingSpinner size="large" />);
    spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('w-12', 'h-12');
  });

  it('applies correct color classes', () => {
    const { rerender } = render(<LoadingSpinner color="green" />);
    let spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('text-green-500');

    rerender(<LoadingSpinner color="red" />);
    spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('text-red-500');
  });

  it('has correct accessibility attributes', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('has spinning animation class', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('animate-spin');
  });
});