# E2E Testing with Playwright

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode
npm run test:e2e:ui

# View last test report
npx playwright show-report
```

## Test Coverage

- ✅ App loads and displays main interface
- ✅ Tab navigation works correctly
- ✅ Theme toggle functionality works

## Test Structure

Tests are located in `/e2e/` directory and use Playwright to test real browser interactions without the mocking issues we had with Jest/RTL.
