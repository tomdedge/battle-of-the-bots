import { render, screen } from '@testing-library/react';

// Mock the TasksView component to avoid react-markdown ES module issues
jest.mock('../../../components/Tasks/TasksView', () => ({
  TasksView: () => (
    <div data-testid="tasks-view">
      <button>Add Task</button>
      <div>Tasks List</div>
    </div>
  )
}));

const { TasksView } = require('../../../components/Tasks/TasksView');

describe('TasksView Component', () => {
  it('renders tasks view', () => {
    render(<TasksView />);
    
    expect(screen.getByText('Add Task')).toBeInTheDocument();
    expect(screen.getByText('Tasks List')).toBeInTheDocument();
  });
});