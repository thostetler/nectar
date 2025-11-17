# Science Explorer (SciX) - Style Guide

## Purpose

This style guide defines coding standards, conventions, and best practices for the Science Explorer codebase. It ensures consistency, readability, and maintainability for both human developers and AI agents working on the project.

## Core Principles

1. **Clarity over Cleverness**: Write code that is easy to understand and maintain
2. **Type Safety**: Leverage TypeScript's type system to catch errors early
3. **Functional Patterns**: Prefer functional programming approaches where appropriate
4. **Component Reusability**: Build modular, composable components
5. **Performance Awareness**: Consider bundle size and runtime performance
6. **Accessibility First**: Ensure all UI components are accessible (WCAG 2.1 AA)
7. **Testability**: Write code that is easy to test

## TypeScript Standards

### File Naming

- **Components**: PascalCase - `SearchBar.tsx`, `ResultList.tsx`
- **Utilities**: camelCase - `formatDate.ts`, `parseQuery.ts`
- **Types**: PascalCase - `SearchTypes.ts`, `ApiTypes.ts`
- **Hooks**: camelCase with `use` prefix - `useSearch.ts`, `useMetrics.ts`
- **Tests**: Match source file - `SearchBar.test.tsx`, `parseQuery.test.ts`

### Type Definitions

#### Use Interfaces for Objects

```typescript
// Good
interface ISearchParams {
  q: string;
  rows: number;
  start: number;
}

// Avoid (use type for unions, intersections only)
type SearchParams = {
  q: string;
  rows: number;
  start: number;
}
```

#### Prefix Interfaces with "I"

```typescript
// Good
interface IUser {
  username: string;
  email: string;
}

interface IApiResponse<T> {
  data: T;
  status: number;
}

// Bad
interface User {
  username: string;
}
```

#### Use Type for Unions and Complex Types

```typescript
// Good
type AppMode = 'ASTROPHYSICS' | 'HELIOPHYSICS' | 'PLANETARY_SCIENCE';
type ApiResult<T> = { success: true; data: T } | { success: false; error: string };

// Good for intersections
type UserWithSettings = IUser & ISettings;
```

#### Avoid `any`, Use `unknown` When Needed

```typescript
// Bad
function processData(data: any) {
  return data.value;
}

// Good
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  throw new Error('Invalid data');
}

// Best (with type guard)
function isDataWithValue(data: unknown): data is { value: string } {
  return typeof data === 'object' && data !== null && 'value' in data;
}

function processData(data: unknown) {
  if (isDataWithValue(data)) {
    return data.value; // Type-safe!
  }
  throw new Error('Invalid data');
}
```

#### Explicit Return Types for Public Functions

```typescript
// Good
export function calculateScore(metrics: IMetrics): number {
  return metrics.citations * 2 + metrics.reads;
}

// Bad (implicit return type)
export function calculateScore(metrics: IMetrics) {
  return metrics.citations * 2 + metrics.reads;
}
```

### Imports and Exports

#### Import Order

```typescript
// 1. External libraries
import React, { useState, useEffect } from 'react';
import { Box, Button, Text } from '@chakra-ui/react';
import axios from 'axios';

// 2. Internal absolute imports (using @ alias)
import { useStore } from '@/store';
import { SearchBar } from '@/components/SearchBar';
import { formatDate } from '@/utils/common/formatters';

// 3. Relative imports
import { LocalComponent } from './LocalComponent';
import { helperFunction } from './helpers';

// 4. Type imports (separated)
import type { ISearchParams } from '@/types';
```

#### Named Exports Preferred

```typescript
// Good
export function useSearch() { ... }
export function useSearchParams() { ... }

// Avoid default exports (except for Next.js pages and dynamic imports)
export default function SearchPage() { ... } // Only in pages/
```

## React Component Standards

### Component Structure

```typescript
// 1. Imports
import React, { useState, useCallback } from 'react';
import { Box, Button } from '@chakra-ui/react';
import { useStore } from '@/store';
import type { IComponentProps } from './types';

// 2. Types/Interfaces
interface ISearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
}

// 3. Component definition
export const SearchBar: React.FC<ISearchBarProps> = ({
  onSearch,
  placeholder = 'Search...',
  initialValue = '',
}) => {
  // 3a. Hooks (in order: context, state, refs, effects, callbacks)
  const { mode } = useStore((state) => state);
  const [query, setQuery] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = useCallback(() => {
    onSearch(query);
  }, [query, onSearch]);

  // 3b. Early returns for conditional rendering
  if (!mode) {
    return null;
  }

  // 3c. Render
  return (
    <Box>
      <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} />
      <Button onClick={handleSubmit}>Search</Button>
    </Box>
  );
};

// 4. Display name (for debugging)
SearchBar.displayName = 'SearchBar';
```

### Component Naming

- Use PascalCase for components: `SearchBar`, `ResultList`, `AbstractDetails`
- Use descriptive, specific names: `SearchFacetYearSlider` not `Slider`
- Prefix HOCs with `with`: `withErrorBoundary`, `withAuth`

### Props and State

```typescript
// Always define prop interfaces
interface IButtonProps {
  variant?: 'primary' | 'secondary';
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

// Use destructuring with defaults
export const Button: React.FC<IButtonProps> = ({
  variant = 'primary',
  onClick,
  disabled = false,
  children,
}) => {
  // ...
}

// Avoid prop spreading when possible (be explicit)
// Bad
<Component {...props} />

// Good
<Component
  variant={variant}
  onClick={onClick}
  disabled={disabled}
>
  {children}
</Component>
```

### Hooks Best Practices

```typescript
// Custom hooks must start with "use"
export function useSearchParams() {
  const { query } = useStore((state) => state);
  return useMemo(() => parseQuery(query), [query]);
}

// Keep hooks focused and single-purpose
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Use dependency arrays correctly (no lies to ESLint)
// Bad
useEffect(() => {
  fetchData(userId);
}, []); // Missing userId dependency!

// Good
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

### Conditional Rendering

```typescript
// Use early returns for loading/error states
if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;

// Use ternary for simple conditions
{isLoggedIn ? <UserMenu /> : <LoginButton />}

// Use && for existence checks (with proper boolean conversion)
{items.length > 0 && <ItemList items={items} />}

// Avoid complex nested ternaries
// Bad
{condition1 ? (condition2 ? <A /> : <B />) : (condition3 ? <C /> : <D />)}

// Good - use helper function or early returns
const renderContent = () => {
  if (condition1 && condition2) return <A />;
  if (condition1) return <B />;
  if (condition3) return <C />;
  return <D />;
};
```

## State Management

### Zustand Store Patterns

```typescript
// Use slices for logical separation
interface ISearchSlice {
  query: string;
  results: IResult[];
  setQuery: (query: string) => void;
  setResults: (results: IResult[]) => void;
}

// Selector functions for derived state
const selectUserDisplayName = (state: AppState): string => {
  return state.user.anonymous ? 'Guest' : state.user.username;
};

// Use selectors in components
const displayName = useStore(selectUserDisplayName);

// Batch updates in actions
const updateSearch = useStore((state) => ({
  setQuery: state.setQuery,
  setResults: state.setResults,
}));

// Call actions, don't set state directly
updateSearch.setQuery('new query');
```

### React Query Patterns

```typescript
// Use query key factories
export const searchKeys = {
  all: ['search'] as const,
  primary: (params: ISearchParams) => [...searchKeys.all, 'primary', params] as const,
  facets: (params: ISearchParams) => [...searchKeys.all, 'facets', params] as const,
};

// Keep queries focused and parameterized
export const useSearchQuery = (params: ISearchParams) => {
  return useQuery({
    queryKey: searchKeys.primary(params),
    queryFn: () => searchApi.query(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!params.q, // Only run when query exists
  });
};

// Use mutations for updates
export const useUpdateLibrary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (library: ILibrary) => libraryApi.update(library),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
    },
  });
};
```

## Styling with Chakra UI

### Use System Props

```typescript
// Good - declarative, responsive
<Box
  p={4}
  bg="gray.50"
  borderRadius="md"
  _hover={{ bg: 'gray.100' }}
>
  Content
</Box>

// Avoid inline styles
<Box style={{ padding: '16px', backgroundColor: '#f7fafc' }}>
  Content
</Box>
```

### Responsive Design

```typescript
// Use responsive array syntax
<Box
  width={{ base: '100%', md: '50%', lg: '33.33%' }}
  p={{ base: 2, md: 4, lg: 6 }}
>
  Content
</Box>

// Or use responsive object syntax
<Box width={['100%', '50%', '33.33%']}>
  Content
</Box>
```

### Theme Usage

```typescript
// Use theme tokens, not hardcoded values
<Text color="brand.500" fontSize="lg" fontWeight="semibold">
  Title
</Text>

// Access theme in custom components
const { colors } = useTheme();
```

### Component Variants

```typescript
// Define variants in theme, not inline
// In theme.ts
const Button = {
  variants: {
    primary: {
      bg: 'brand.500',
      color: 'white',
      _hover: { bg: 'brand.600' },
    },
  },
};

// In component
<Button variant="primary">Click Me</Button>
```

## API and Data Fetching

### API Client Structure

```typescript
// src/api/feature/feature.ts
import { AxiosInstance } from 'axios';
import type { IFeatureResponse, IFeatureParams } from './types';

export class FeatureAPI {
  constructor(private client: AxiosInstance) {}

  async getFeature(params: IFeatureParams): Promise<IFeatureResponse> {
    const response = await this.client.get('/v1/feature', { params });
    return response.data;
  }
}

// Export singleton instance
import { apiClient } from '@/api/lib/apiClient';
export const featureApi = new FeatureAPI(apiClient);
```

### Error Handling

```typescript
// Use try-catch for async operations
async function fetchUserData(userId: string): Promise<IUser> {
  try {
    const response = await userApi.getUser(userId);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle API errors
      throw new ApiError(error.response?.data.message || 'Failed to fetch user');
    }
    // Re-throw unknown errors
    throw error;
  }
}

// Use error boundaries for component errors
<ErrorBoundary fallback={<ErrorFallback />}>
  <Component />
</ErrorBoundary>
```

### Type-Safe API Responses

```typescript
// Define API response types
interface IApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// Use generics for reusable types
async function fetchData<T>(url: string): Promise<T> {
  const response = await apiClient.get<IApiResponse<T>>(url);
  return response.data.data;
}
```

## Testing Standards

### Test File Structure

```typescript
// ComponentName.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  // Test setup
  const defaultProps = {
    onSearch: vi.fn(),
    placeholder: 'Search...',
  };

  // Group related tests
  describe('rendering', () => {
    it('renders with placeholder', () => {
      render(<SearchBar {...defaultProps} />);
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('calls onSearch when submitted', () => {
      render(<SearchBar {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search...');

      fireEvent.change(input, { target: { value: 'test query' } });
      fireEvent.submit(input);

      expect(defaultProps.onSearch).toHaveBeenCalledWith('test query');
    });
  });
});
```

### Test Naming

```typescript
// Good - descriptive, behavior-focused
it('displays error message when API request fails')
it('disables submit button when form is invalid')
it('redirects to login page when user is not authenticated')

// Bad - implementation-focused
it('sets error state to true')
it('calls useState hook')
```

### Mock Data

```typescript
// Create reusable mock factories
export const createMockUser = (overrides?: Partial<IUser>): IUser => ({
  username: 'testuser',
  email: 'test@example.com',
  anonymous: false,
  ...overrides,
});

// Use in tests
const mockUser = createMockUser({ username: 'john' });
```

## Functional Programming Patterns

### Use Ramda for Data Transformations

```typescript
import * as R from 'ramda';

// Good - functional composition
const getActiveUserEmails = R.pipe(
  R.filter(R.prop('isActive')),
  R.map(R.prop('email')),
  R.uniq
);

// Instead of imperative
function getActiveUserEmails(users) {
  const emails = [];
  for (const user of users) {
    if (user.isActive && !emails.includes(user.email)) {
      emails.push(user.email);
    }
  }
  return emails;
}
```

### Immutability

```typescript
// Good - create new objects
const updatedUser = { ...user, name: 'New Name' };
const updatedArray = [...items, newItem];

// Use Ramda for deep updates
const updatedState = R.assocPath(['user', 'profile', 'name'], 'New Name', state);

// Bad - mutate directly
user.name = 'New Name'; // Mutation!
items.push(newItem); // Mutation!
```

### Pure Functions

```typescript
// Good - pure function (no side effects)
function calculateTotal(items: IItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Bad - impure (modifies external state)
let total = 0;
function calculateTotal(items: IItem[]): void {
  total = items.reduce((sum, item) => sum + item.price, 0);
}
```

## File Organization

### Component Directory Structure

```
ComponentName/
├── ComponentName.tsx        # Main component
├── ComponentName.test.tsx   # Tests
├── index.ts                 # Public exports
├── types.ts                 # Component-specific types
├── hooks.ts                 # Component-specific hooks
├── utils.ts                 # Component-specific utilities
└── SubComponent/            # Child components (if complex)
    └── SubComponent.tsx
```

### Feature Module Structure

```
feature/
├── index.ts                 # Public API
├── feature.ts               # Main implementation
├── types.ts                 # Type definitions
├── queries.ts               # React Query hooks
├── utils.ts                 # Utilities
├── constants.ts             # Constants
└── __tests__/               # Tests
    └── feature.test.ts
```

## Code Documentation

### JSDoc Comments

```typescript
/**
 * Fetches search results from the API based on provided parameters
 *
 * @param params - Search parameters including query, filters, and pagination
 * @param options - Optional configuration for the request
 * @returns Promise resolving to search results with metadata
 * @throws {ApiError} When the API request fails
 *
 * @example
 * ```typescript
 * const results = await searchApi.query({
 *   q: 'black holes',
 *   rows: 25,
 *   start: 0
 * });
 * ```
 */
export async function query(
  params: ISearchParams,
  options?: IRequestOptions
): Promise<ISearchResponse> {
  // Implementation
}
```

### Inline Comments

```typescript
// Use comments to explain "why", not "what"

// Good - explains reasoning
// Cache for 5 minutes to reduce API load during rapid filter changes
staleTime: 5 * 60 * 1000,

// Bad - obvious from code
// Set stale time to 300000
staleTime: 5 * 60 * 1000,

// Use TODO comments sparingly and include ticket numbers
// TODO(SCIX-123): Refactor to use new API endpoint when available
```

## Performance Considerations

### Memoization

```typescript
// Memoize expensive computations
const sortedResults = useMemo(() => {
  return results.sort((a, b) => b.score - a.score);
}, [results]);

// Memoize callback functions passed to children
const handleClick = useCallback(() => {
  onItemClick(item.id);
}, [item.id, onItemClick]);
```

### Code Splitting

```typescript
// Use dynamic imports for large components
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Spinner />,
  ssr: false, // Disable SSR for client-only components
});

// Split route-level components
const SearchPage = dynamic(() => import('@/pages/search'));
```

### Bundle Size Awareness

```typescript
// Import only what you need
import { format } from 'date-fns'; // Good
import * as dateFns from 'date-fns'; // Bad - imports entire library

// Use tree-shakeable libraries
import { map, filter } from 'ramda'; // Good
import R from 'ramda'; // Also okay - Ramda is tree-shakeable
```

## Accessibility

### Semantic HTML

```typescript
// Good
<button onClick={handleClick}>Submit</button>
<nav>...</nav>
<main>...</main>

// Bad
<div onClick={handleClick}>Submit</div>
<div>...</div> // for navigation
```

### ARIA Attributes

```typescript
// Use ARIA labels for icon buttons
<IconButton
  icon={<SearchIcon />}
  aria-label="Search"
  onClick={handleSearch}
/>

// Indicate loading states
<Button isLoading loadingText="Searching...">
  Search
</Button>

// Mark required fields
<FormControl isRequired>
  <FormLabel>Email</FormLabel>
  <Input type="email" aria-required="true" />
</FormControl>
```

### Keyboard Navigation

```typescript
// Support keyboard events
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Clickable content
</div>
```

## Error Handling

### User-Facing Errors

```typescript
// Provide helpful error messages
if (!user) {
  throw new Error('Please log in to access this feature');
}

// Use error boundaries for unexpected errors
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    logError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### API Error Handling

```typescript
// Provide context in error messages
try {
  await searchApi.query(params);
} catch (error) {
  if (error.response?.status === 401) {
    throw new AuthError('Session expired. Please log in again.');
  }
  throw new ApiError('Failed to fetch search results. Please try again.');
}
```

## Git Commit Messages

### Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `style`: Code style changes (formatting, etc.)
- `test`: Adding or updating tests
- `docs`: Documentation changes
- `chore`: Build process, dependency updates, etc.
- `perf`: Performance improvements

### Examples

```
feat(search): add year range slider to facets

Implemented a dual-handle slider for year filtering that allows users
to select a range of publication years visually.

Closes #123

---

fix(auth): prevent session expiry during active usage

Updated session middleware to refresh expiry time on each request.

---

refactor(api): migrate to new query key factory pattern

Updated all React Query hooks to use centralized query key factories
for better cache invalidation control.
```

## Code Review Checklist

Before submitting code for review:

- [ ] Code follows TypeScript and React best practices
- [ ] All functions have proper type annotations
- [ ] Tests are written and passing
- [ ] No console.log statements (use logger instead)
- [ ] Error handling is comprehensive
- [ ] Component is accessible (ARIA, keyboard navigation)
- [ ] Performance considerations addressed (memoization, code splitting)
- [ ] Documentation updated if needed
- [ ] Commit messages follow convention
- [ ] No TODO comments without ticket references

## Anti-Patterns to Avoid

### TypeScript

```typescript
// Bad: Using `any`
function process(data: any) { ... }

// Bad: Type assertions without validation
const user = response.data as IUser;

// Bad: Disabling TypeScript checks
// @ts-ignore
const value = obj.property;
```

### React

```typescript
// Bad: Direct state mutation
setState({ ...state, value: newValue }); // Relying on stale closure

// Bad: Missing dependencies in hooks
useEffect(() => {
  doSomething(value);
}, []); // Should include [value]

// Bad: Index as key in lists
{items.map((item, index) => <Item key={index} {...item} />)}
```

### General

```typescript
// Bad: Deeply nested conditionals
if (condition1) {
  if (condition2) {
    if (condition3) {
      // Do something
    }
  }
}

// Good: Early returns
if (!condition1) return;
if (!condition2) return;
if (!condition3) return;
// Do something
```

---

## Summary

Following this style guide ensures:
- **Consistency**: Code looks like it was written by one person
- **Maintainability**: Easy to understand and modify
- **Quality**: Fewer bugs and better performance
- **Collaboration**: Smooth code reviews and pair programming
- **AI-Friendly**: Clear patterns for AI agents to understand and follow

When in doubt, refer to existing code in the project for examples of these patterns in action.

---

**Last Updated**: 2025-11-17
