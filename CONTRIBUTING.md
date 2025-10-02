# Contributing to AuraFlow

## Testing Strategy

We use a two-tier testing approach to ensure code quality and user experience:

### Unit Tests (Jest + React Testing Library)
- **Purpose**: Test individual components in isolation
- **Location**: `frontend/src/__tests__/`
- **Coverage**: Component rendering, props, user interactions
- **Mocking**: Mantine components are mocked to avoid browser API dependencies

```bash
# Run unit tests
cd frontend && npm test

# Run with coverage
cd frontend && npm test -- --coverage --watchAll=false
```

### E2E Tests (Playwright)
- **Purpose**: Test complete user workflows in real browsers
- **Location**: `frontend/e2e/`
- **Coverage**: Tab navigation, theme toggling, app loading
- **Benefits**: No mocking needed, tests actual user experience

```bash
# Run E2E tests
cd frontend && npm run test:e2e

# Run with UI mode
cd frontend && npm run test:e2e:ui

# View test report
cd frontend && npx playwright show-report
```

## Development Workflow

1. **Write unit tests** for new components using mocked Mantine components
2. **Add E2E tests** for new user workflows or interactions
3. **Run both test suites** before submitting PRs

## Why This Approach?

- **Unit tests**: Fast feedback during development, good for component logic
- **E2E tests**: Reliable integration testing without Mantine v7+ mocking issues
- **Separation of concerns**: Each test type serves a specific purpose
