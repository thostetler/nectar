# State Management Documentation

## Overview

Science Explorer uses a dual-state management approach:
1. **Zustand** for global client state (UI state, user session, preferences)
2. **TanStack React Query** for server state (API data, caching, synchronization)

This separation allows for optimal performance, clear data ownership, and proper persistence strategies.

## Zustand Store

### Architecture

**Location**: `src/store/`

**Purpose**: Manage application-level state that persists across page navigations and sessions.

**Configuration**:
```typescript
// src/store/store.ts:20-65
export const createStore = (preloadedState: Partial<AppState> = {}) => {
  const state = (set, get) => ({
    ...searchSlice(set, get),
    ...docsSlice(set, get),
    ...userSlice(set, get),
    ...appModeSlice(set, get),
    ...settingsSlice(set, get),
    ...orcidSlice(set, get),
    ...notificationSlice(set, get),
    ...preloadedState,
  });

  return create(
    subscribeWithSelector(
      devtools(
        persist(state, {
          name: APP_STORAGE_KEY,
          partialize: (state) => ({
            user: state.user,
            mode: state.mode,
            numPerPage: state.numPerPage,
            settings: state.settings,
            orcid: state.orcid,
          }),
          merge: mergeDeepLeft,
        }),
      ),
    ),
  );
};
```

**Key Features**:
- **Sliced Architecture**: State divided into logical slices
- **Persistence**: Selected state saved to `localStorage`
- **DevTools**: Redux DevTools integration for debugging
- **Subscriptions**: Selective state subscriptions for performance
- **Deep Merge**: Intelligent merging of persisted and incoming state

### State Slices

#### 1. Search Slice

**Purpose**: Manage search query parameters and UI state.

**Location**: `src/store/slices/search.ts:1-89`

**State**:
```typescript
interface ISearchState {
  query: IADSApiSearchParams;           // Current query (being edited)
  latestQuery: IADSApiSearchParams;     // Submitted query (active search)
  prevQuery: IADSApiSearchParams;       // Previous query (for back button)
  numPerPage: NumPerPageType;           // Results per page (25, 50, 100)
  showHighlights: boolean;              // Show search term highlights
  queryAddition: string;                // Additional query terms
  clearQueryFlag: boolean;              // Flag to clear search input
}
```

**Actions**:
```typescript
interface ISearchAction {
  setQuery: (query: IADSApiSearchParams) => void;
  updateQuery: (query: Partial<IADSApiSearchParams>) => void;
  swapQueries: () => void;              // Swap current and previous
  submitQuery: () => void;              // Move query to latestQuery
  resetQuery: () => void;
  setNumPerPage: (numPerPage: NumPerPageType) => void;
  toggleShowHighlights: () => void;
  setQueryAddition: (queryAddition: string) => void;
  setClearQueryFlag: (clearQueryFlag: boolean) => void;
}
```

**Default Query Parameters**:
```typescript
// src/store/slices/search.ts:8-31
const defaultQueryParams: IADSApiSearchParams = {
  q: '',
  fl: [
    'bibcode',
    'title',
    'author',
    '[fields author=10]',
    'author_count',
    'pubdate',
    'bibstem',
    '[citations]',
    'reference_count',
    'citation_count',
    'citation_count_norm',
    'credit',
    'esources',
    'property',
    'data',
    'id',
  ],
  sort: 'score desc',
  start: 0,
  rows: 25,
};
```

**Usage**:
```typescript
import { useStore } from '@/store';

// Get current query
const query = useStore((state) => state.query);

// Update query
const updateQuery = useStore((state) => state.updateQuery);
updateQuery({ q: 'black holes' });

// Submit query (trigger search)
const submitQuery = useStore((state) => state.submitQuery);
submitQuery();
```

**Persistence**: Not persisted (resets on page reload)

---

#### 2. User Slice

**Purpose**: Store user authentication and session data.

**Location**: `src/store/slices/user.ts:1-27`

**State**:
```typescript
interface IUserState {
  user: {
    username: string;
    anonymous: boolean;
    access_token: string;
    expires_at: string;
  };
}
```

**Actions**:
```typescript
interface IUserAction {
  resetUser: () => void;
  getUsername: () => string;
}
```

**Usage**:
```typescript
import { useStore } from '@/store';

// Get user data
const user = useStore((state) => state.user);

// Check if logged in
const isLoggedIn = !user.anonymous && !!user.access_token;

// Get username
const username = useStore((state) => state.getUsername());

// Reset user (logout)
const resetUser = useStore((state) => state.resetUser);
resetUser();
```

**Persistence**: ✅ Persisted to `localStorage`

---

#### 3. App Mode Slice

**Purpose**: Manage current science domain selection.

**Location**: `src/store/slices/appMode.ts`

**State**:
```typescript
interface IAppModeState {
  mode: AppMode;
}

type AppMode =
  | 'ASTROPHYSICS'
  | 'HELIOPHYSICS'
  | 'PLANETARY_SCIENCE'
  | 'EARTH_SCIENCE'
  | 'BIOPHYSICAL_SCIENCE';
```

**Actions**:
```typescript
interface IAppModeAction {
  setMode: (mode: AppMode) => void;
}
```

**Usage**:
```typescript
import { useStore } from '@/store';

// Get current mode
const mode = useStore((state) => state.mode);

// Change mode
const setMode = useStore((state) => state.setMode);
setMode('HELIOPHYSICS');
```

**Persistence**: ✅ Persisted to `localStorage`

---

#### 4. Settings Slice

**Purpose**: Store user preferences and facet configuration.

**Location**: `src/store/slices/settings.ts`

**State**:
```typescript
interface ISettingsState {
  settings: {
    searchFacets: {
      order: SearchFacetID[];        // Facet display order
      state: Record<SearchFacetID, { // Per-facet state
        expanded: boolean;
        ignored: string[];            // Ignored facet values
      }>;
      open: SearchFacetID[];          // Currently open facets
      ignored: SearchFacetID[];       // Hidden facets
    };
    user: IADSApiUserDataResponse;    // User preferences from API
  };
}
```

**Actions**:
```typescript
interface ISettingsAction {
  setSearchFacetOrder: (order: SearchFacetID[]) => void;
  setSearchFacetState: (id: SearchFacetID, state: Partial<FacetState>) => void;
  getSearchFacetState: (id: SearchFacetID) => FacetState;
  hideSearchFacet: (id: SearchFacetID) => void;
  showSearchFacet: (id: SearchFacetID) => void;
  resetSearchFacets: () => void;
}
```

**Facet Configuration**:
```typescript
// Example facet state
{
  searchFacets: {
    order: ['author', 'year', 'bibstem', 'keyword'],
    state: {
      author: { expanded: true, ignored: [] },
      year: { expanded: false, ignored: [] },
    },
    open: ['author'],
    ignored: ['database'],
  }
}
```

**Usage**:
```typescript
import { useStore } from '@/store';

// Get facet order
const facetOrder = useStore((state) => state.settings.searchFacets.order);

// Reorder facets (drag-and-drop)
const setFacetOrder = useStore((state) => state.setSearchFacetOrder);
setFacetOrder(['year', 'author', 'bibstem', 'keyword']);

// Get specific facet state
const getFacetState = useStore((state) => state.getSearchFacetState);
const authorFacetState = getFacetState('author');

// Update facet state
const setFacetState = useStore((state) => state.setSearchFacetState);
setFacetState('author', { expanded: true });
```

**Persistence**: ✅ Persisted to `localStorage`

---

#### 5. Docs Slice

**Purpose**: Track currently loaded documents (search results, abstract page).

**Location**: `src/store/slices/docs.ts`

**State**:
```typescript
interface IDocsState {
  docs: {
    current: IDocsEntity[];  // Currently displayed documents
  };
}

interface IDocsEntity {
  bibcode: string;
  title: string[];
  author: string[];
  pubdate: string;
  // ... other document fields
}
```

**Actions**:
```typescript
interface IDocsAction {
  setCurrentDocs: (docs: IDocsEntity[]) => void;
  resetDocs: () => void;
}
```

**Usage**:
```typescript
import { useStore } from '@/store';

// Get current documents
const currentDocs = useStore((state) => state.docs.current);

// Set documents (from search results)
const setDocs = useStore((state) => state.setCurrentDocs);
setDocs(searchResults);
```

**Persistence**: Not persisted

---

#### 6. ORCID Slice

**Purpose**: Manage ORCID integration state.

**Location**: `src/store/slices/orcid.ts`

**State**:
```typescript
interface IOrcidState {
  orcid: {
    isLinked: boolean;
    orcidId?: string;
    works: IOrcidWork[];
    profile?: IOrcidProfile;
  };
}
```

**Actions**:
```typescript
interface IOrcidAction {
  setOrcidLinked: (isLinked: boolean) => void;
  setOrcidWorks: (works: IOrcidWork[]) => void;
  setOrcidProfile: (profile: IOrcidProfile) => void;
  resetOrcid: () => void;
}
```

**Usage**:
```typescript
import { useStore } from '@/store';

// Check if ORCID is linked
const isLinked = useStore((state) => state.orcid.isLinked);

// Get ORCID works
const works = useStore((state) => state.orcid.works);

// Set ORCID connection
const setLinked = useStore((state) => state.setOrcidLinked);
setLinked(true);
```

**Persistence**: ✅ Persisted to `localStorage`

---

#### 7. Notification Slice

**Purpose**: Manage toast notifications and alerts.

**Location**: `src/store/slices/notification.ts`

**State**:
```typescript
interface INotificationState {
  notification: INotification | null;
}

interface INotification {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Actions**:
```typescript
interface INotificationAction {
  setNotification: (notification: INotification) => void;
  clearNotification: () => void;
}
```

**Usage**:
```typescript
import { useStore } from '@/store';

// Show notification
const setNotification = useStore((state) => state.setNotification);
setNotification({
  type: 'success',
  message: 'Settings saved successfully',
  duration: 3000,
});

// Clear notification
const clearNotification = useStore((state) => state.clearNotification);
clearNotification();
```

**Persistence**: Not persisted

---

### Store Persistence

**Storage Key**: `nectar-app-state`

**Persisted Slices**:
- ✅ `user`: Authentication token, username
- ✅ `mode`: Current app mode (science domain)
- ✅ `numPerPage`: Results per page preference
- ✅ `settings`: User preferences, facet configuration
- ✅ `orcid`: ORCID connection state

**Not Persisted**:
- ❌ `query`, `latestQuery`, `prevQuery`: Search state (reset on reload)
- ❌ `docs`: Current documents (fetched fresh)
- ❌ `notification`: Notifications (ephemeral)

**Merge Strategy**:
```typescript
// Deep merge using Ramda
merge: mergeDeepLeft
```
This ensures incoming state (from SSR) takes precedence over persisted state.

**Location**: `src/store/store.ts:50-60`

---

### Using the Store

#### In Components

```typescript
import { useStore } from '@/store';

export const MyComponent = () => {
  // Subscribe to specific state (efficient - only re-renders when this changes)
  const query = useStore((state) => state.query);

  // Get action
  const updateQuery = useStore((state) => state.updateQuery);

  // Multiple selections
  const { user, mode } = useStore((state) => ({
    user: state.user,
    mode: state.mode,
  }));

  // Use in handler
  const handleSearch = () => {
    updateQuery({ q: 'new query' });
  };

  return <div>{query.q}</div>;
};
```

#### With Selectors

```typescript
import { useStore } from '@/store';

// Create selector
const selectIsLoggedIn = (state: AppState): boolean => {
  return !state.user.anonymous && !!state.user.access_token;
};

// Use in component
export const MyComponent = () => {
  const isLoggedIn = useStore(selectIsLoggedIn);

  return <div>{isLoggedIn ? 'Logged in' : 'Guest'}</div>;
};
```

#### Outside React (Non-Hook)

```typescript
import { updateAppUser } from '@/store';
import { IUserData } from '@/api/user/types';

// Update user from API response
export const handleLoginSuccess = (userData: IUserData) => {
  updateAppUser(userData);
};
```

**Location**: `src/store/store.ts:102-104`

---

## React Query

### Architecture

**Purpose**: Manage server state with automatic caching, background refetching, and synchronization.

**Configuration**: `src/lib/useCreateQueryClient.ts`

```typescript
export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,      // 5 minutes
        gcTime: 10 * 60 * 1000,        // 10 minutes (garbage collection)
        retry: 2,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
      },
    },
  });
};
```

### Query Key Factories

**Pattern**: Hierarchical query keys for efficient cache invalidation.

**Example**: Search API
```typescript
// src/api/search/queries.ts
export const searchKeys = {
  all: ['search'] as const,
  primary: (params: ISearchParams) =>
    [...searchKeys.all, 'primary', params] as const,
  facets: (params: ISearchParams) =>
    [...searchKeys.all, 'facets', params] as const,
  stats: (params: ISearchParams) =>
    [...searchKeys.all, 'stats', params] as const,
};
```

**Benefits**:
- **Organized**: Logical hierarchy
- **Type-safe**: TypeScript const assertions
- **Efficient**: Invalidate all search queries with `searchKeys.all`
- **Specific**: Invalidate only facets with `searchKeys.facets(params)`

### Query Patterns

#### Basic Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { searchApi, searchKeys } from '@/api/search';

export const useSearchQuery = (params: ISearchParams) => {
  return useQuery({
    queryKey: searchKeys.primary(params),
    queryFn: () => searchApi.query(params),
    enabled: !!params.q,  // Only run when query exists
  });
};

// In component
const { data, isLoading, error } = useSearchQuery({ q: 'black holes' });
```

#### Infinite Query (Pagination)

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

export const useInfiniteSearchQuery = (params: ISearchParams) => {
  return useInfiniteQuery({
    queryKey: searchKeys.primary(params),
    queryFn: ({ pageParam = 0 }) =>
      searchApi.query({ ...params, start: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const nextStart = allPages.length * params.rows;
      return nextStart < lastPage.response.numFound
        ? nextStart
        : undefined;
    },
    initialPageParam: 0,
  });
};

// In component
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteSearchQuery({ q: 'stars', rows: 25 });
```

#### Mutation with Optimistic Update

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpdateLibrary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (library: ILibrary) => libraryApi.update(library),

    // Optimistic update
    onMutate: async (newLibrary) => {
      await queryClient.cancelQueries({ queryKey: libraryKeys.all });

      const previous = queryClient.getQueryData(libraryKeys.detail(newLibrary.id));

      queryClient.setQueryData(
        libraryKeys.detail(newLibrary.id),
        newLibrary
      );

      return { previous };
    },

    // Rollback on error
    onError: (err, newLibrary, context) => {
      queryClient.setQueryData(
        libraryKeys.detail(newLibrary.id),
        context.previous
      );
    },

    // Refetch on success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
    },
  });
};
```

### SSR with React Query

**Dehydration** (Server-Side):
```typescript
import { dehydrate } from '@tanstack/react-query';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const queryClient = createQueryClient();

  // Prefetch data
  await queryClient.prefetchQuery({
    queryKey: searchKeys.primary(params),
    queryFn: () => searchApi.query(params),
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
};
```

**Hydration** (Client-Side):
```typescript
import { Hydrate } from '@tanstack/react-query';

export default function App({ Component, pageProps }) {
  const queryClient = createQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <Hydrate state={pageProps.dehydratedState}>
        <Component {...pageProps} />
      </Hydrate>
    </QueryClientProvider>
  );
}
```

**Location**: `src/pages/_app.tsx`

---

## State Management Best Practices

### When to Use Zustand vs React Query

| Use Case | Zustand | React Query |
|----------|---------|-------------|
| UI state (filters, settings) | ✅ | ❌ |
| User session/auth | ✅ | ❌ |
| API data (search results) | ❌ | ✅ |
| Derived API data | ❌ | ✅ |
| Form state | ❌ (use React Hook Form) | ❌ |
| Local component state | ❌ (use useState) | ❌ |

### Performance Optimization

#### Zustand: Selective Subscriptions

```typescript
// Bad - subscribes to entire store
const store = useStore();

// Good - subscribes only to query
const query = useStore((state) => state.query);

// Good - multiple specific selections
const { user, mode } = useStore((state) => ({
  user: state.user,
  mode: state.mode,
}));
```

#### React Query: Stale Time Configuration

```typescript
// Short-lived data (changes frequently)
useQuery({
  queryKey: ['notifications'],
  queryFn: fetchNotifications,
  staleTime: 30 * 1000, // 30 seconds
});

// Long-lived data (rarely changes)
useQuery({
  queryKey: ['journals'],
  queryFn: fetchJournals,
  staleTime: 60 * 60 * 1000, // 1 hour
});

// Real-time data (always fresh)
useQuery({
  queryKey: ['status'],
  queryFn: fetchStatus,
  staleTime: 0, // Always stale
  refetchInterval: 5000, // Poll every 5s
});
```

### State Synchronization

#### Zustand → React Query

```typescript
// Update query in Zustand, trigger React Query refetch
const updateQuery = useStore((state) => state.updateQuery);
const submitQuery = useStore((state) => state.submitQuery);

const handleSearch = (newQuery: string) => {
  updateQuery({ q: newQuery });
  submitQuery(); // Moves to latestQuery
  // React Query hook watches latestQuery and refetches
};
```

#### React Query → Zustand

```typescript
// Store API response in Zustand for UI state
const { data } = useSearchQuery(params);

useEffect(() => {
  if (data?.response?.docs) {
    useStore.getState().setCurrentDocs(data.response.docs);
  }
}, [data]);
```

---

## Debugging

### Zustand DevTools

**Installation**: Automatic in development mode

**Usage**:
1. Open Redux DevTools in browser
2. View state snapshots
3. Time-travel through state changes
4. Action names: `search/updateQuery`, `user/resetUser`, etc.

**Configuration**: `src/store/store.ts:49-62`

### React Query DevTools

**Installation**:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

**Features**:
- View all queries and their state
- Force refetch
- Inspect cache
- Clear cache

---

## Testing

### Zustand Store Testing

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { createStore, StoreProvider } from '@/store';

describe('Search Slice', () => {
  it('updates query', () => {
    const store = createStore();

    act(() => {
      store.getState().updateQuery({ q: 'test' });
    });

    expect(store.getState().query.q).toBe('test');
  });
});
```

### React Query Testing

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

describe('useSearchQuery', () => {
  it('fetches search results', async () => {
    const { result } = renderHook(
      () => useSearchQuery({ q: 'test' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
```

---

## Migration Guide

### Adding a New Zustand Slice

1. Create slice file: `src/store/slices/newSlice.ts`
2. Define state and actions interfaces
3. Implement slice factory function
4. Add to store composition in `src/store/store.ts`
5. Add to persistence config (if needed)
6. Export types

**Template**:
```typescript
// src/store/slices/newSlice.ts
import { StoreSlice } from '@/store';

export interface INewState {
  value: string;
}

export interface INewAction {
  setValue: (value: string) => void;
}

export const newSlice: StoreSlice<INewState & INewAction> = (set) => ({
  value: '',
  setValue: (value: string) => set({ value }, false, 'new/setValue'),
});
```

### Adding a New React Query

1. Create query key factory
2. Define query function
3. Create custom hook
4. Add to relevant API module

**Example**: See `src/api/search/queries.ts`

---

**Last Updated**: 2025-11-17

**Related Documentation**:
- [Architecture](ARCHITECTURE.md)
- [API Layer](API.md)
- [Components](COMPONENTS.md)
