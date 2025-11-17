# API Layer Documentation

## Overview

The Science Explorer API layer provides a structured interface to the ADS (Astrophysics Data System) backend. It uses Axios for HTTP requests with caching, authentication, and error handling built in.

## Architecture

```
┌─────────────────────────────────────────────┐
│          Component/Page                      │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│       React Query Hooks                      │
│   (useSearchQuery, useDocQuery, etc.)       │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│         API Modules                          │
│  (searchApi, userApi, biblibApi, etc.)      │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│          API Client (Axios)                  │
│  ┌─────────────────────────────────────┐   │
│  │  Request Interceptors                │   │
│  │  - Add auth token                    │   │
│  │  - Request deduplication             │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │  Cache Interceptor                   │   │
│  │  - Check cache (IndexedDB)           │   │
│  │  - Return cached response if fresh   │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │  Response Interceptors               │   │
│  │  - Handle 401 (refresh token)        │   │
│  │  - Parse errors                      │   │
│  │  - Update cache                      │   │
│  └─────────────────────────────────────┘   │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│         ADS API Backend                      │
│         /v1/search, /v1/user, etc.          │
└─────────────────────────────────────────────┘
```

## API Client

### Configuration

**Location**: `src/api/api.ts:1-150`

**Singleton Pattern**: The API uses a singleton instance to manage authentication state and caching.

```typescript
// API class (simplified)
class Api {
  private static instance: Api;
  private service: AxiosInstance;
  private userData: IUserData;
  private pendingRequestsMap: Map<string, Promise<AxiosResponse>>;

  public static getInstance(): Api {
    if (!Api.instance) {
      Api.instance = new Api();
    }
    return Api.instance;
  }

  // Methods...
}

export const api = Api.getInstance();
```

### Request Configuration

**Default Config**: `src/api/config.ts`

```typescript
export const defaultRequestConfig: AxiosRequestConfig = {
  baseURL: process.env.API_HOST_CLIENT,  // Client-side API URL
  timeout: 30000,                         // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};
```

**Server-Side Config**:
```typescript
export const serverRequestConfig: AxiosRequestConfig = {
  baseURL: process.env.API_HOST_SERVER,  // Server-side API URL
  timeout: 30000,
};
```

### Authentication

**Token Management**: Automatically adds Bearer token to requests.

**Flow**:
```
1. User logs in
2. Token stored in Zustand + localStorage
3. API reads token from localStorage
4. Adds to Authorization header
5. On 401 error, attempts token refresh
6. If refresh fails, invalidates user data
```

**Implementation**: `src/api/api.ts:40-47`

```typescript
const applyTokenToRequest = (
  request: ApiRequestConfig,
  token: string
): ApiRequestConfig => {
  return {
    ...request,
    headers: {
      ...request.headers,
      authorization: `Bearer ${token}`,
    },
  };
};
```

### Caching

**Client-Side Caching**: Uses `axios-cache-interceptor` with IndexedDB storage.

**Configuration**: `src/api/api.ts:58-86`

```typescript
const cacheConfig: CacheOptions = {
  debug: log.debug,
  cacheTakeover: false,
  cachePredicate: {
    ignoreUrls: [/^(?!\/search\/)/],  // Only cache search requests
  },
  storage: indexedDBStorage,
};
```

**Cache Strategy**:
- **Cache Scope**: Only search endpoints (`/v1/search`)
- **Storage**: IndexedDB (client-side)
- **TTL**: Configured per endpoint (default 5 minutes)
- **Cache Keys**: Based on URL + params

**Benefits**:
- Faster subsequent searches
- Reduced API load
- Offline capability (partial)

### Error Handling

**Error Interceptor**: `src/api/api.ts:110-150`

**Handled Errors**:
1. **401 Unauthorized**: Attempts token refresh, invalidates user if failed
2. **Network Errors**: Rejects immediately (no retry)
3. **Duplicate Errors**: Prevents infinite loops

**Error Flow**:
```
Request Error
    ↓
Is it 401?
    ├─ Yes → Invalidate user data → Redirect to login
    └─ No → Is it same as last error?
            ├─ Yes → Reject (prevent loop)
            └─ No → Store error → Propagate to caller
```

**Usage**:
```typescript
try {
  const result = await searchApi.query(params);
} catch (error) {
  if (axios.isAxiosError(error)) {
    // Handle Axios errors
    console.error(error.response?.data);
  }
}
```

### Request Deduplication

**Purpose**: Prevent duplicate concurrent requests.

**Implementation**: Pending requests stored in Map, keyed by URL + params.

```typescript
// Simplified
private pendingRequestsMap: Map<string, Promise<AxiosResponse>>;

// Before making request
const requestKey = generateKey(url, params);
if (this.pendingRequestsMap.has(requestKey)) {
  return this.pendingRequestsMap.get(requestKey); // Return existing promise
}

// Store promise
const promise = axios.get(url, { params });
this.pendingRequestsMap.set(requestKey, promise);

// Clean up after request
promise.finally(() => {
  this.pendingRequestsMap.delete(requestKey);
});
```

**Benefits**:
- Prevents duplicate API calls
- Reduces server load
- Improves performance

---

## API Modules

### Directory Structure

```
src/api/
├── search/           # Search API
├── user/             # User & auth API
├── biblib/           # Library management
├── orcid/            # ORCID integration
├── export/           # Citation export
├── metrics/          # Analytics
├── objects/          # Document details
├── reference/        # References
├── resolver/         # DOI/ArXiv resolution
├── graphics/         # Graphics retrieval
├── journals/         # Journal lookup
├── uat/              # UAT (Unified Astronomy Thesaurus)
├── author-affiliation/  # Author affiliation
├── citation_helper/  # Citation helper
├── feedback/         # User feedback
├── vault/            # Data vault
├── vis/              # Visualization data
├── api.ts            # Main API client
├── config.ts         # Configuration
└── models.ts         # Shared types
```

---

## Search API

**Location**: `src/api/search/`

**Purpose**: Search papers, fetch facets, get search statistics.

### Endpoints

#### 1. Query Search

**Endpoint**: `POST /v1/search/query`

**Purpose**: Execute search with Lucene query syntax.

**Parameters**:
```typescript
interface IADSApiSearchParams {
  q: string;                    // Query string (Lucene syntax)
  fl?: string[];                // Fields to return
  sort?: string;                // Sort field and order
  start?: number;               // Pagination offset
  rows?: number;                // Number of results
  fq?: string[];                // Filter queries
  facet?: boolean;              // Include facets
  'facet.field'?: string[];     // Facet fields
  'facet.limit'?: number;       // Facet value limit
  'facet.mincount'?: number;    // Minimum facet count
  'facet.offset'?: number;      // Facet pagination
  hl?: boolean;                 // Highlight search terms
  'hl.fl'?: string;             // Highlight fields
}
```

**Response**:
```typescript
interface ISearchResponse {
  response: {
    docs: IDocsEntity[];        // Search results
    numFound: number;           // Total results
    start: number;              // Offset
  };
  facet_counts?: {
    facet_fields: IFacetCounts; // Facet values
  };
  highlighting?: Record<string, any>;
}
```

**Usage**:
```typescript
import { searchApi } from '@/api/search';

const results = await searchApi.query({
  q: 'author:"Einstein, A." year:1905',
  rows: 25,
  start: 0,
  sort: 'date desc',
  fl: ['bibcode', 'title', 'author', 'pubdate'],
});
```

**React Query Hook**:
```typescript
import { useSearchQuery } from '@/api/search/queries';

const { data, isLoading } = useSearchQuery({
  q: 'black holes',
  rows: 25,
});
```

#### 2. Facets

**Endpoint**: `POST /v1/search/facet`

**Purpose**: Get facet counts for filtering.

**Parameters**: Same as query search

**Response**:
```typescript
interface IFacetResponse {
  facet_counts: {
    facet_fields: {
      author_facet: string[];       // ['Einstein, A.', 42, 'Hawking, S.', 38, ...]
      year: string[];
      bibstem_facet: string[];
      keyword_facet: string[];
      // ... more facets
    };
  };
}
```

**Usage**:
```typescript
const facets = await searchApi.facets({
  q: 'dark matter',
  'facet.field': ['author_facet', 'year', 'bibstem_facet'],
  'facet.limit': 20,
});
```

#### 3. Stats (Bigquery)

**Endpoint**: `POST /v1/search/bigquery`

**Purpose**: Get aggregated statistics.

**Usage**:
```typescript
const stats = await searchApi.stats({
  q: 'exoplanets',
  fl: ['bibcode'],
});
```

### Query Keys

**Factory Pattern**:
```typescript
export const searchKeys = {
  all: ['search'] as const,
  primary: (params: IADSApiSearchParams) =>
    [...searchKeys.all, 'primary', params] as const,
  facets: (params: IADSApiSearchParams) =>
    [...searchKeys.all, 'facets', params] as const,
  stats: (params: IADSApiSearchParams) =>
    [...searchKeys.all, 'stats', params] as const,
};
```

**Benefits**:
- Type-safe query keys
- Easy cache invalidation
- Hierarchical organization

---

## User API

**Location**: `src/api/user/`

**Purpose**: User authentication, profile management, preferences.

### Endpoints

#### 1. Bootstrap

**Endpoint**: `GET /api/user`

**Purpose**: Get current user session data.

**Response**:
```typescript
interface IBootstrapPayload {
  username: string;
  anonymous: boolean;
  access_token: string;
  expires_at: string;
  scopes: string[];
}
```

**Usage**:
```typescript
import { userApi } from '@/api/user';

const userData = await userApi.bootstrap();
```

**Note**: This hits the Next.js API route `/api/user`, which proxies to the ADS backend.

#### 2. Login

**Endpoint**: `POST /v1/user/login`

**Parameters**:
```typescript
interface ILoginParams {
  username: string;
  password: string;
}
```

**Response**: `IBootstrapPayload`

**Usage**:
```typescript
const userData = await userApi.login({
  username: 'user@example.com',
  password: 'password123',
});
```

#### 3. Register

**Endpoint**: `POST /v1/user/register`

**Parameters**:
```typescript
interface IRegisterParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  recaptcha: string;
}
```

#### 4. User Data

**Endpoint**: `GET /v1/user`

**Purpose**: Get user profile and preferences.

**Response**:
```typescript
interface IUserDataResponse {
  email: string;
  firstName: string;
  lastName: string;
  preferences: {
    defaultDatabase: string;
    resultsPerPage: number;
    // ... more preferences
  };
}
```

#### 5. Update User Data

**Endpoint**: `PUT /v1/user`

**Purpose**: Update user profile and preferences.

---

## Library API (biblib)

**Location**: `src/api/biblib/`

**Purpose**: Manage user paper libraries (collections).

### Endpoints

#### 1. Get Libraries

**Endpoint**: `GET /v1/biblib/libraries`

**Response**:
```typescript
interface ILibrariesResponse {
  libraries: ILibrary[];
}

interface ILibrary {
  id: string;
  name: string;
  description: string;
  num_documents: number;
  date_created: string;
  date_last_modified: string;
  permission: 'owner' | 'admin' | 'read' | 'write';
  public: boolean;
}
```

#### 2. Get Library Details

**Endpoint**: `GET /v1/biblib/libraries/:id`

**Response**:
```typescript
interface ILibraryDetails extends ILibrary {
  documents: string[];  // Array of bibcodes
  metadata: {
    // ... library metadata
  };
}
```

#### 3. Create Library

**Endpoint**: `POST /v1/biblib/libraries`

**Parameters**:
```typescript
interface ICreateLibraryParams {
  name: string;
  description?: string;
  public?: boolean;
  bibcodes?: string[];
}
```

#### 4. Update Library

**Endpoint**: `PUT /v1/biblib/libraries/:id`

**Parameters**:
```typescript
interface IUpdateLibraryParams {
  name?: string;
  description?: string;
  public?: boolean;
}
```

#### 5. Add Documents

**Endpoint**: `POST /v1/biblib/libraries/:id/documents`

**Parameters**:
```typescript
interface IAddDocumentsParams {
  bibcodes: string[];
  action: 'add' | 'remove';
}
```

#### 6. Delete Library

**Endpoint**: `DELETE /v1/biblib/libraries/:id`

### React Query Hooks

```typescript
// Get all libraries
const { data: libraries } = useLibrariesQuery();

// Get library details
const { data: library } = useLibraryQuery(libraryId);

// Create library
const createLibrary = useCreateLibrary();
createLibrary.mutate({
  name: 'My Papers',
  description: 'Important papers',
});

// Add documents to library
const addDocuments = useAddDocuments();
addDocuments.mutate({
  libraryId: 'lib-123',
  bibcodes: ['2020ApJ...123..456A'],
  action: 'add',
});
```

---

## ORCID API

**Location**: `src/api/orcid/`

**Purpose**: ORCID OAuth integration and work synchronization.

### Endpoints

#### 1. Get ORCID Info

**Endpoint**: `GET /v1/orcid/info`

**Purpose**: Check if user has ORCID linked.

**Response**:
```typescript
interface IOrcidInfo {
  isLinked: boolean;
  orcidId?: string;
  name?: string;
}
```

#### 2. Exchange OAuth Code

**Endpoint**: `POST /v1/orcid/oauth`

**Purpose**: Exchange OAuth authorization code for access token.

**Parameters**:
```typescript
interface IOrcidOAuthParams {
  code: string;
  redirectUri: string;
}
```

#### 3. Get ORCID Works

**Endpoint**: `GET /v1/orcid/works`

**Response**:
```typescript
interface IOrcidWorksResponse {
  works: IOrcidWork[];
}

interface IOrcidWork {
  putCode: string;
  title: string;
  type: string;
  identifier: {
    type: string;
    value: string;
  }[];
}
```

#### 4. Update Work

**Endpoint**: `PUT /v1/orcid/works/:putCode`

**Purpose**: Update work on ORCID profile.

---

## Export API

**Location**: `src/api/export/`

**Purpose**: Export citations in various formats.

### Endpoint

**Endpoint**: `POST /v1/export/:format`

**Formats**: `bibtex`, `aastex`, `icarus`, `mnras`, `soph`, `dcxml`, `refxml`, `refabsxml`, `ads`, `endnote`, `procite`, `ris`, `refworks`, `rss`, `medlars`, `dcxml`, `refxml`, `refabsxml`, `votable`, `custom`

**Parameters**:
```typescript
interface IExportParams {
  bibcodes: string[];
  format: string;
  authorCutoff?: number;  // Max authors to show
  keyformat?: string;     // BibTeX key format
}
```

**Response**: Citation text in requested format

**Usage**:
```typescript
import { exportApi } from '@/api/export';

const citation = await exportApi.getCitation({
  bibcodes: ['2020ApJ...123..456A'],
  format: 'bibtex',
  authorCutoff: 10,
});
```

---

## Metrics API

**Location**: `src/api/metrics/`

**Purpose**: Get citation metrics and analytics.

### Endpoint

**Endpoint**: `POST /v1/metrics`

**Parameters**:
```typescript
interface IMetricsParams {
  bibcodes: string[];
  types?: string[];  // ['basic', 'citations', 'indicators', 'histograms', 'timeseries']
}
```

**Response**:
```typescript
interface IMetricsResponse {
  basic: {
    number_of_papers: number;
    total_citations: number;
    h_index: number;
    i10_index: number;
    // ... more metrics
  };
  citation_histogram: {
    year: number;
    citations: number;
  }[];
  // ... more data
}
```

**Usage**:
```typescript
import { metricsApi } from '@/api/metrics';

const metrics = await metricsApi.getMetrics({
  bibcodes: ['2020ApJ...123..456A', '2019ApJ...789..012B'],
  types: ['basic', 'histograms'],
});
```

---

## Objects API

**Location**: `src/api/objects/`

**Purpose**: Get detailed document information.

### Endpoint

**Endpoint**: `GET /v1/objects/:bibcode`

**Response**: Full document metadata with all fields

**Usage**:
```typescript
import { objectsApi } from '@/api/objects';

const paper = await objectsApi.getObject('2020ApJ...123..456A');
```

---

## Other API Modules

### Reference API

**Purpose**: Get reference and citation data
**Endpoints**: `/v1/reference/text`, `/v1/reference/xml`

### Resolver API

**Purpose**: Resolve DOI, ArXiv, and other identifiers
**Endpoint**: `/v1/resolver/:identifier`

### Graphics API

**Purpose**: Retrieve paper graphics and figures
**Endpoint**: `/v1/graphics/:bibcode`

### Journals API

**Purpose**: Journal name lookup and autocomplete
**Endpoint**: `/v1/journals/summary/:query`

### UAT API

**Purpose**: Unified Astronomy Thesaurus autocomplete
**Endpoint**: `/v1/uat/autocomplete/:query`

### Author Affiliation API

**Purpose**: Lookup author affiliations
**Endpoint**: `/v1/author-affiliation/search`

### Citation Helper API

**Purpose**: Citation analysis tools
**Endpoint**: `/v1/citation_helper`

### Feedback API

**Purpose**: User feedback submission
**Endpoint**: `/v1/feedback`

### Vault API

**Purpose**: User data storage
**Endpoint**: `/v1/vault/query`

### Visualization API

**Purpose**: Network visualization data
**Endpoint**: `/v1/vis/*`

---

## API Response Types

### Common Types

```typescript
// Document entity
interface IDocsEntity {
  bibcode: string;
  title: string[];
  author: string[];
  author_count: number;
  pubdate: string;
  citation_count: number;
  reference_count: number;
  // ... 100+ more fields
}

// Error response
interface IApiError {
  error: string;
  message: string;
  status: number;
}
```

**Location**: `src/api/search/types.ts`, `src/api/models.ts`

---

## Best Practices

### 1. Always Use React Query Hooks

```typescript
// Good
const { data, isLoading } = useSearchQuery(params);

// Avoid (unless in server-side code)
const data = await searchApi.query(params);
```

### 2. Handle Loading and Error States

```typescript
const { data, isLoading, error } = useSearchQuery(params);

if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
return <ResultList results={data.response.docs} />;
```

### 3. Use Query Keys for Cache Invalidation

```typescript
// Invalidate all search queries
queryClient.invalidateQueries({ queryKey: searchKeys.all });

// Invalidate specific query
queryClient.invalidateQueries({ queryKey: searchKeys.primary(params) });
```

### 4. Optimistic Updates for Mutations

```typescript
const updateLibrary = useMutation({
  mutationFn: libraryApi.update,
  onMutate: async (newLibrary) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: libraryKeys.all });

    // Snapshot previous value
    const previous = queryClient.getQueryData(libraryKeys.detail(newLibrary.id));

    // Optimistically update
    queryClient.setQueryData(libraryKeys.detail(newLibrary.id), newLibrary);

    return { previous };
  },
  onError: (err, newLibrary, context) => {
    // Rollback on error
    queryClient.setQueryData(
      libraryKeys.detail(newLibrary.id),
      context.previous
    );
  },
});
```

---

## Environment Configuration

### Required Environment Variables

```bash
# Client-side API (browser requests)
API_HOST_CLIENT=https://api.scixplorer.org

# Server-side API (SSR requests)
API_HOST_SERVER=http://backend:5000
```

**Usage**:
- `API_HOST_CLIENT`: Used by axios in browser
- `API_HOST_SERVER`: Used by axios in `getServerSideProps`, API routes

**Why Two URLs?**
- Client requests may need different routing (proxy, CDN)
- Server requests use internal network (faster, no CORS)

---

## Testing

### Mocking API Requests

**Using MSW (Mock Service Worker)**:

```typescript
// src/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.post('/v1/search/query', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        response: {
          docs: mockSearchResults,
          numFound: 100,
          start: 0,
        },
      })
    );
  }),
];
```

**Enable Mocking**:
```bash
NEXT_PUBLIC_API_MOCKING=enabled pnpm dev
```

### Unit Testing API Modules

```typescript
import { searchApi } from '@/api/search';
import { setupServer } from 'msw/node';
import { handlers } from '@/mocks/handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('searchApi.query returns results', async () => {
  const result = await searchApi.query({ q: 'test' });
  expect(result.response.docs).toHaveLength(25);
});
```

---

**Last Updated**: 2025-11-17

**Related Documentation**:
- [Architecture](ARCHITECTURE.md)
- [State Management](STATE_MANAGEMENT.md)
- [Search](SEARCH.md)
- [Authentication](AUTHENTICATION.md)
