# Testing Documentation

## Overview

Science Explorer uses Vitest as the primary testing framework with Testing Library for React component tests and MSW (Mock Service Worker) for API mocking.

## Testing Stack

### Core Libraries

- **Vitest 0.34.5**: Fast unit test runner (Vite-powered)
- **@testing-library/react**: React component testing utilities
- **@testing-library/dom**: DOM testing utilities
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/react-hooks**: Hook testing utilities
- **MSW 1.2.3**: API mocking for tests and development
- **vitest-fetch-mock**: Fetch API mocking

### Test Environment

**Configuration**: `vitest.config.js`

```javascript
export default defineConfig({
  test: {
    environment: 'jsdom',           // Browser-like environment
    globals: true,                  // Global test functions
    setupFiles: './vitest-setup.ts', // Setup file
    isolate: true,                  // Isolate test files
    threads: true,                  // Run in parallel
    maxConcurrency: 16,             // Max parallel tests
    testTimeout: 10000,             // 10 second timeout
    hookTimeout: 10000,             // 10 second hook timeout
    coverage: {
      provider: 'v8',               // V8 coverage
      reporter: ['lcov', 'text'],   // Coverage reporters
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.{ts,tsx}',
        '**/*.config.{js,ts}',
        'vitest-setup.ts',
      ],
    },
  },
});
```

## Test Setup

### Vitest Setup File

**Location**: `vitest-setup.ts`

```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import createFetchMock from 'vitest-fetch-mock';

// Extend Vitest matchers
expect.extend(matchers);

// Setup fetch mock
const fetchMock = createFetchMock(vi);
fetchMock.enableMocks();

// Cleanup after each test
afterEach(() => {
  cleanup();
  fetchMock.resetMocks();
});

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: vi.fn(() => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    beforePopState: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
  })),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

## Running Tests

### Commands

```bash
# Run all tests (watch mode)
pnpm test

# Run tests once
pnpm test:run

# Run with coverage
pnpm test:coverage

# Run CI tests (no watch, verbose, JUnit output)
pnpm test:ci

# Run specific test file
pnpm test src/components/SearchBar/__tests__/SearchBar.test.tsx

# Run tests matching pattern
pnpm test --grep "SearchBar"
```

### Watch Mode

```bash
pnpm test

# In watch mode:
# - Press 'a' to run all tests
# - Press 'f' to run only failed tests
# - Press 'p' to filter by filename
# - Press 't' to filter by test name
# - Press 'q' to quit
```

## Test Structure

### File Organization

**Pattern**: Colocated tests next to source files

```
src/
├── components/
│   ├── SearchBar/
│   │   ├── SearchBar.tsx
│   │   ├── SearchBar.test.tsx     # Component tests
│   │   ├── SearchInput.tsx
│   │   └── QuickFields.tsx
│   └── ResultList/
│       ├── ResultList.tsx
│       └── __tests__/              # Alternatively
│           └── ResultList.test.tsx
├── api/
│   ├── search/
│   │   ├── search.ts
│   │   └── __tests__/
│           └── search.test.ts
└── utils/
    ├── formatters.ts
    └── __tests__/
        └── formatters.test.ts
```

### Test File Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  // Setup
  const defaultProps = {
    onSubmit: vi.fn(),
    placeholder: 'Search...',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Group related tests
  describe('rendering', () => {
    it('renders input field', () => {
      render(<SearchBar {...defaultProps} />);
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('renders with initial query', () => {
      render(<SearchBar {...defaultProps} query="test" />);
      expect(screen.getByDisplayValue('test')).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('calls onSubmit when form submitted', async () => {
      render(<SearchBar {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search...');

      fireEvent.change(input, { target: { value: 'test query' } });
      fireEvent.submit(input);

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith('test query');
      });
    });

    it('updates input value on change', () => {
      render(<SearchBar {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;

      fireEvent.change(input, { target: { value: 'new value' } });

      expect(input.value).toBe('new value');
    });
  });

  describe('error handling', () => {
    it('displays error message', () => {
      render(<SearchBar {...defaultProps} error="Invalid query" />);
      expect(screen.getByText('Invalid query')).toBeInTheDocument();
    });
  });
});
```

## Testing Patterns

### Component Testing

#### Basic Render Test

```typescript
import { render, screen } from '@testing-library/react';

it('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

#### With Props

```typescript
it('renders with props', () => {
  render(<Button variant="primary" onClick={handleClick}>Click</Button>);

  const button = screen.getByRole('button', { name: 'Click' });
  expect(button).toHaveClass('primary');
});
```

#### User Interactions

```typescript
import userEvent from '@testing-library/user-event';

it('handles button click', async () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Click</Button>);

  await userEvent.click(screen.getByRole('button'));

  expect(onClick).toHaveBeenCalledTimes(1);
});
```

#### Async Updates

```typescript
it('loads data asynchronously', async () => {
  render(<AsyncComponent />);

  expect(screen.getByText('Loading...')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

### Hook Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

it('increments counter', () => {
  const { result } = renderHook(() => useCounter());

  expect(result.current.count).toBe(0);

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

### Store Testing (Zustand)

```typescript
import { renderHook, act } from '@testing-library/react';
import { createStore } from '@/store';

it('updates query in store', () => {
  const store = createStore();

  act(() => {
    store.getState().updateQuery({ q: 'test' });
  });

  expect(store.getState().query.q).toBe('test');
});
```

### React Query Testing

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useSearchQuery } from './queries';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

it('fetches search results', async () => {
  const { result } = renderHook(
    () => useSearchQuery({ q: 'test' }),
    { wrapper: createWrapper() }
  );

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(result.current.data).toBeDefined();
  expect(result.current.data.response.docs).toHaveLength(25);
});
```

## API Mocking

### MSW Setup

**Location**: `src/mocks/`

```
mocks/
├── handlers.ts          # Request handlers
├── responses/           # Mock response data
│   ├── search.json
│   ├── user.json
│   └── libraries.json
└── generators/          # Data generators
    └── mockData.ts
```

### Handlers

**Location**: `src/mocks/handlers.ts`

```typescript
import { rest } from 'msw';
import searchResponse from './responses/search.json';

export const handlers = [
  // Search endpoint
  rest.post('/v1/search/query', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(searchResponse)
    );
  }),

  // User endpoint
  rest.get('/api/user', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        username: 'testuser',
        anonymous: false,
        access_token: 'mock-token',
      })
    );
  }),

  // Dynamic response
  rest.get('/v1/objects/:bibcode', (req, res, ctx) => {
    const { bibcode } = req.params;

    return res(
      ctx.status(200),
      ctx.json({
        bibcode,
        title: ['Mock Paper Title'],
      })
    );
  }),

  // Error response
  rest.post('/v1/user/login', (req, res, ctx) => {
    return res(
      ctx.status(401),
      ctx.json({ error: 'Invalid credentials' })
    );
  }),
];
```

### Server Setup

**For Node Tests**:

```typescript
import { setupServer } from 'msw/node';
import { handlers } from '@/mocks/handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**For Browser (Development)**:

```typescript
// src/mocks/browser.ts
import { setupWorker } from 'msw';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

// Enable in development
if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') {
  worker.start();
}
```

### Override Handlers in Tests

```typescript
import { server } from '@/mocks/server';
import { rest } from 'msw';

it('handles API error', async () => {
  // Override for this test
  server.use(
    rest.post('/v1/search/query', (req, res, ctx) => {
      return res(ctx.status(500), ctx.json({ error: 'Server error' }));
    })
  );

  render(<SearchComponent />);

  await waitFor(() => {
    expect(screen.getByText('Server error')).toBeInTheDocument();
  });
});
```

## Test Utilities

### Custom Render Function

**Location**: `src/test-utils.tsx`

```typescript
import { render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChakraProvider } from '@chakra-ui/react';
import { StoreProvider, createStore } from '@/store';
import { theme } from '@/theme';

export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
};

export const AllProviders = ({ children }) => {
  const queryClient = createTestQueryClient();
  const store = createStore();

  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider createStore={() => store}>
        <ChakraProvider theme={theme}>
          {children}
        </ChakraProvider>
      </StoreProvider>
    </QueryClientProvider>
  );
};

export const render = (ui: React.ReactElement, options = {}) => {
  return rtlRender(ui, { wrapper: AllProviders, ...options });
};

// Re-export everything
export * from '@testing-library/react';
```

**Usage**:
```typescript
import { render, screen } from '@/test-utils';

it('renders with all providers', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Mock Data Generators

**Location**: `src/mocks/generators/mockData.ts`

```typescript
export const createMockUser = (overrides?: Partial<IUser>): IUser => ({
  username: 'testuser',
  email: 'test@example.com',
  anonymous: false,
  access_token: 'mock-token',
  expires_at: '2025-12-31T23:59:59Z',
  ...overrides,
});

export const createMockDocument = (overrides?: Partial<IDocsEntity>): IDocsEntity => ({
  bibcode: '2020ApJ...123..456A',
  title: ['Mock Paper Title'],
  author: ['Author, First', 'Author, Second'],
  author_count: 2,
  pubdate: '2020-01-01',
  citation_count: 10,
  ...overrides,
});

export const createMockSearchResponse = (
  docs: IDocsEntity[] = [],
  numFound = 100
): ISearchResponse => ({
  response: {
    docs,
    numFound,
    start: 0,
  },
});
```

**Usage**:
```typescript
import { createMockDocument, createMockSearchResponse } from '@/mocks/generators/mockData';

const mockDoc = createMockDocument({ title: ['Custom Title'] });
const mockResponse = createMockSearchResponse([mockDoc], 1);
```

## Coverage

### Generating Coverage

```bash
# Run tests with coverage
pnpm test:coverage

# Output:
# - Terminal: Summary
# - coverage/lcov-report/index.html: Detailed HTML report
```

### Coverage Thresholds

**Configuration**: `vitest.config.js`

```javascript
export default {
  test: {
    coverage: {
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
  },
};
```

### Viewing Coverage

```bash
# Open HTML report
open coverage/lcov-report/index.html
```

## CI/CD Testing

### GitHub Actions

**Location**: `.github/workflows/pull-request.yml`

```yaml
name: Pull Request Tests

on:
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install pnpm
        run: corepack enable && corepack prepare pnpm@latest --activate

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run linter
        run: pnpm lint

      - name: Run tests
        run: pnpm test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### Post-Merge Testing

**Location**: `.github/workflows/post-merge.yml`

```yaml
name: Post-Merge Tests

on:
  push:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - # ... same as PR workflow

      - name: Upload to Sentry
        run: |
          pnpm sentry-cli releases files "${{ github.sha }}" \
            upload-sourcemaps ./dist
```

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// Bad - tests implementation
it('calls setState', () => {
  const { result } = renderHook(() => useMyHook());
  const setStateSpy = vi.spyOn(result.current, 'setState');

  result.current.doSomething();

  expect(setStateSpy).toHaveBeenCalled();
});

// Good - tests behavior
it('updates value when doSomething is called', () => {
  const { result } = renderHook(() => useMyHook());

  act(() => {
    result.current.doSomething();
  });

  expect(result.current.value).toBe('expected');
});
```

### 2. Use Testing Library Queries

**Query Priority**:
1. `getByRole`: Accessibility-first
2. `getByLabelText`: Forms
3. `getByPlaceholderText`: Inputs
4. `getByText`: Text content
5. `getByTestId`: Last resort

```typescript
// Best
const button = screen.getByRole('button', { name: 'Submit' });

// Good
const input = screen.getByLabelText('Email');

// Okay
const heading = screen.getByText('Welcome');

// Avoid
const element = screen.getByTestId('submit-button');
```

### 3. Clean Up Side Effects

```typescript
it('cleans up subscription', () => {
  const { unmount } = render(<Component />);

  // Component creates subscription

  unmount();

  // Verify cleanup happened
  expect(subscriptionCount).toBe(0);
});
```

### 4. Use Fake Timers for Time-Dependent Code

```typescript
import { vi } from 'vitest';

it('debounces input', () => {
  vi.useFakeTimers();

  const onChange = vi.fn();
  render(<DebouncedInput onChange={onChange} delay={300} />);

  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: 'test' } });

  expect(onChange).not.toHaveBeenCalled();

  vi.advanceTimersByTime(300);

  expect(onChange).toHaveBeenCalledWith('test');

  vi.useRealTimers();
});
```

### 5. Test Edge Cases

```typescript
describe('Pagination', () => {
  it('handles first page', () => { /* ... */ });
  it('handles last page', () => { /* ... */ });
  it('handles middle page', () => { /* ... */ });
  it('handles single page', () => { /* ... */ });
  it('handles empty results', () => { /* ... */ });
  it('handles invalid page number', () => { /* ... */ });
});
```

## Troubleshooting

### Common Issues

**1. "Cannot find module" errors**
- Check `tsconfig.json` paths configuration
- Ensure `@/` alias is configured in `vitest.config.js`

**2. "window is not defined"**
- Add to `vitest-setup.ts`:
  ```typescript
  global.window = { ...window, matchMedia: vi.fn() };
  ```

**3. "localStorage is not defined"**
- Mock in test:
  ```typescript
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  });
  ```

**4. Timeout errors**
- Increase timeout:
  ```typescript
  it('slow test', async () => { /* ... */ }, 20000); // 20s
  ```

**5. MSW not intercepting**
- Ensure server is started in `beforeAll`
- Check handler URL matches exactly
- Verify `server.resetHandlers()` in `afterEach`

---

**Last Updated**: 2025-11-17

**Related Documentation**:
- [Components](COMPONENTS.md)
- [API](API.md)
- [State Management](STATE_MANAGEMENT.md)
