# Architecture Overview

## System Architecture

Science Explorer (SciX) is a modern, server-side rendered (SSR) web application built on Next.js 15, designed for high-performance scientific research discovery and paper management.

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                           │
├─────────────────────────────────────────────────────────────────┤
│  React Components (Chakra UI)                                    │
│  ├── SearchBar, ResultList, AbstractDetails                     │
│  ├── Visualizations (D3, Nivo)                                  │
│  └── Forms, Modals, Navigation                                  │
├─────────────────────────────────────────────────────────────────┤
│  State Management                                                │
│  ├── Zustand (Global State): query, user, settings, orcid       │
│  └── React Query (Server State): search, metrics, libraries     │
├─────────────────────────────────────────────────────────────────┤
│  API Client Layer (Axios)                                        │
│  ├── Cache Interceptor                                           │
│  ├── Auth Token Injection                                        │
│  └── Request/Response Transformation                             │
└─────────────────────────────────────────────────────────────────┘
                            ▼ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Server (Node.js)                      │
├─────────────────────────────────────────────────────────────────┤
│  Edge Middleware                                                 │
│  ├── Bot Detection                                               │
│  ├── Legacy URL Redirects                                        │
│  └── Auth Verification                                           │
├─────────────────────────────────────────────────────────────────┤
│  Server-Side Rendering (SSR)                                     │
│  ├── React Query Dehydration                                     │
│  ├── Initial State Hydration                                     │
│  └── Session Bootstrap                                           │
├─────────────────────────────────────────────────────────────────┤
│  API Routes                                                       │
│  ├── /api/user (Session Management)                             │
│  ├── /api/isBot (Bot Detection)                                 │
│  └── /api/monitor (Health Check)                                │
├─────────────────────────────────────────────────────────────────┤
│  Session Management (Iron-Session)                               │
│  └── Encrypted Cookie Storage                                    │
└─────────────────────────────────────────────────────────────────┘
                            ▼ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                      ADS API Backend                             │
├─────────────────────────────────────────────────────────────────┤
│  /v1/search      - Search & Facets                              │
│  /v1/user        - Authentication & User Data                   │
│  /v1/biblib      - Library Management                           │
│  /v1/export      - Citation Export                              │
│  /v1/objects     - Document Details                             │
│  /v1/metrics     - Analytics & Metrics                          │
│  /v1/orcid       - ORCID Integration                            │
│  /v1/reference   - Reference Data                               │
│  /v1/resolver    - DOI/ArXiv Resolution                         │
│  /v1/feedback    - User Feedback                                │
│  /v1/graphics    - Graphics Retrieval                           │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Framework
- **Next.js 15.4.7**: React framework with hybrid SSR/SSG/CSR
- **React 18.3.1**: UI library with concurrent features
- **TypeScript 4.9.5**: Static type checking

### State Management
- **Zustand 3.7.1**: Lightweight global state (query, user, settings, mode, orcid)
  - Middleware: `persist` (localStorage), `devtools`, `subscribeWithSelector`
  - Deep merge with Ramda for state rehydration
- **TanStack React Query 4.29.17**: Server state management
  - SSR support with dehydration/rehydration
  - Automatic background refetching
  - Optimistic updates
  - Cache management with query key factories

### UI Framework
- **Chakra UI 2.4.6**: Accessible component library
- **Emotion**: CSS-in-JS styling engine
- **Framer Motion 6.5.1**: Animation library
- **Custom Theme**: Light/dark mode with brand colors

### Data Visualization
- **D3 7.6.1**: Low-level visualization primitives
- **Nivo 0.80.0**: High-level chart components (bar, line, network)
- **D3-cloud**: Word cloud generation

### HTTP & Networking
- **Axios 1.12.0**: Promise-based HTTP client
- **axios-cache-interceptor 1.5.2**: Request/response caching
- **http-proxy 1.18.1**: API proxying in development

### Forms & Validation
- **React Hook Form 7.46.1**: Performant form management
- **Zod 3.22.3**: Schema validation
- **Downshift 6.1.7**: Accessible autocomplete
- **React Select 5.7.3**: Advanced select components

### Utilities
- **Ramda 0.28.0**: Functional programming utilities
- **Ramda-adjunct 2.30.0**: Additional functional utilities
- **date-fns 2.30.0**: Date manipulation
- **Lodash (partial)**: Utility functions (debounce, etc.)

### Development & Testing
- **Vitest 0.34.5**: Fast unit test runner
- **Testing Library**: React testing utilities
- **MSW 1.2.3**: API mocking for tests
- **ESLint 9.13.0**: Code linting
- **Prettier 2.3.0**: Code formatting

### Build Tools
- **Webpack 5.94.0**: Module bundler (via Next.js)
- **Next.js Bundle Analyzer**: Bundle size analysis
- **SWC**: Fast TypeScript/JavaScript compiler

### Monitoring & Analytics
- **Sentry 10.11.0**: Error tracking and performance monitoring
  - Client-side error tracking
  - Server-side error tracking
  - Edge middleware error tracking
- **Google Analytics**: User analytics
- **Google Tag Manager**: Tag management
- **Pino 8.16.2**: Structured logging

### Security
- **Iron-session 6.3.1**: Encrypted session management
- **Google reCAPTCHA v3**: Bot protection
- **Content Security Policy**: XSS protection

## Project Structure

```
nectar/
├── src/
│   ├── api/                          # API Client Layer (21 modules)
│   │   ├── search/                   # Search API
│   │   │   ├── search.ts            # Query, facets, stats
│   │   │   ├── types.ts             # Type definitions
│   │   │   └── __tests__/           # Tests
│   │   ├── user/                     # User & Auth API
│   │   ├── biblib/                   # Library management
│   │   ├── orcid/                    # ORCID integration
│   │   ├── export/                   # Citation export
│   │   ├── metrics/                  # Metrics & analytics
│   │   ├── objects/                  # Document details
│   │   ├── reference/                # Reference data
│   │   ├── resolver/                 # DOI/ArXiv resolution
│   │   ├── graphics/                 # Graphics retrieval
│   │   ├── vis/                      # Visualization data
│   │   ├── journals/                 # Journal lookup
│   │   ├── uat/                      # UAT (Unified Astronomy Thesaurus)
│   │   ├── author-affiliation/       # Author affiliation
│   │   ├── citation_helper/          # Citation helper
│   │   ├── feedback/                 # User feedback
│   │   ├── vault/                    # Data vault
│   │   └── lib/                      # API utilities
│   │       ├── apiClient.ts         # Axios instance & config
│   │       ├── interceptors.ts      # Request/response interceptors
│   │       └── types.ts             # Common API types
│   │
│   ├── components/                   # React Components (56+ modules)
│   │   ├── SearchBar/               # Search input with autocomplete
│   │   ├── ResultList/              # Search results display
│   │   ├── SearchFacet/             # Faceted filters
│   │   ├── AbstractDetails/         # Paper details view
│   │   ├── AbstractSideNav/         # Abstract navigation
│   │   ├── CitationExporter/        # Export UI
│   │   ├── Libraries/               # Library management UI
│   │   ├── Settings/                # User settings
│   │   ├── Orcid/                   # ORCID UI
│   │   ├── Layout/                  # Page layouts
│   │   ├── NavBar/                  # Top navigation
│   │   ├── Visualizations/          # Charts & graphs
│   │   ├── Modals/                  # Modal dialogs
│   │   ├── Forms/                   # Form components
│   │   └── ...                      # 40+ more components
│   │
│   ├── pages/                        # Next.js File-based Routing
│   │   ├── _app.tsx                 # App wrapper
│   │   ├── _document.tsx            # HTML document
│   │   ├── index.tsx                # Home page
│   │   ├── search/                  # Search pages
│   │   │   ├── index.tsx            # Results
│   │   │   ├── metrics.tsx          # Metrics view
│   │   │   ├── overview.tsx         # Overview
│   │   │   ├── results_graph.tsx    # Graph view
│   │   │   ├── author_network.tsx   # Author network
│   │   │   ├── paper_network.tsx    # Paper network
│   │   │   └── concept_cloud.tsx    # Concept cloud
│   │   ├── abs/[id]/                # Abstract pages (dynamic)
│   │   │   ├── abstract.tsx         # Main abstract
│   │   │   ├── citations.tsx        # Citations
│   │   │   ├── references.tsx       # References
│   │   │   ├── metrics.tsx          # Paper metrics
│   │   │   └── ...                  # 7 more routes
│   │   ├── user/                    # User pages
│   │   │   ├── account/             # Auth (login, register, etc.)
│   │   │   ├── libraries/           # Library management
│   │   │   ├── settings/            # User settings
│   │   │   └── orcid/               # ORCID integration
│   │   ├── feedback/                # Feedback forms
│   │   └── api/                     # API routes
│   │       ├── user.ts              # User session
│   │       ├── isBot.ts             # Bot detection
│   │       └── monitor.ts           # Health check
│   │
│   ├── store/                        # Zustand State Management
│   │   ├── store.ts                 # Store factory & context
│   │   ├── types.ts                 # Store types
│   │   └── slices/                  # State slices
│   │       ├── search.ts            # Search query state
│   │       ├── user.ts              # User data
│   │       ├── settings.ts          # User settings
│   │       ├── docs.ts              # Current documents
│   │       ├── appMode.ts           # App mode (science domain)
│   │       ├── orcid.ts             # ORCID state
│   │       └── notification.ts      # Notifications
│   │
│   ├── lib/                          # Custom Hooks & Utilities
│   │   ├── useCreateQueryClient.ts  # React Query client
│   │   ├── useSettings.ts           # Settings hook
│   │   ├── useUser.ts               # User hook
│   │   ├── useBatchedSearch.ts      # Batched search
│   │   ├── useMetrics.ts            # Metrics hook
│   │   ├── useDownloadFile.ts       # File download
│   │   ├── orcid/                   # ORCID hooks
│   │   └── serverside/              # SSR utilities
│   │
│   ├── utils/                        # Utility Functions
│   │   ├── common/                  # Common utilities
│   │   │   ├── formatters.ts        # Date, number formatters
│   │   │   ├── parsers.ts           # Data parsers
│   │   │   ├── guards.ts            # Type guards
│   │   │   └── validators.ts        # Validation functions
│   │   └── ...
│   │
│   ├── types/                        # TypeScript Definitions
│   │   ├── global.d.ts              # Global types
│   │   ├── api.ts                   # API types
│   │   └── ...
│   │
│   ├── middlewares/                  # Server Middlewares
│   │   ├── initSession.ts           # Session initialization
│   │   ├── verifyMiddleware.ts      # Auth verification
│   │   ├── legacySearchURLMiddleware.ts  # Legacy redirects
│   │   └── botCheck.ts              # Bot detection
│   │
│   ├── mocks/                        # MSW Mock Data
│   │   ├── handlers.ts              # Request handlers
│   │   ├── responses/               # Mock response JSON
│   │   └── generators/              # Data generators
│   │
│   ├── middleware.ts                 # Edge Middleware
│   ├── providers.tsx                 # React Context Providers
│   ├── config.ts                     # App configuration
│   ├── theme.ts                      # Chakra UI theme
│   ├── query.ts                      # Query parsing (Lucene)
│   ├── query-utils.ts                # Query utilities
│   ├── query-builder.ts              # Query builder
│   ├── logger.ts                     # Pino logger
│   ├── auth-utils.ts                 # Auth utilities
│   ├── ssr-utils.ts                  # SSR utilities
│   ├── mathjax.ts                    # MathJax config
│   └── test-utils.tsx                # Testing utilities
│
├── public/                           # Static Assets
│   ├── images/                      # Images
│   ├── fonts/                       # Fonts
│   └── ...
│
├── scripts/                          # Build Scripts
│   ├── build-prod.sh                # Production build
│   └── build-local.sh               # Local build
│
├── .github/workflows/                # CI/CD Pipelines
│   ├── pull-request.yml             # PR checks
│   ├── post-merge.yml               # Post-merge tests
│   └── auto-tag.yml                 # Auto versioning
│
├── docs/                             # Documentation
│   └── ...                          # (this folder)
│
├── next.config.mjs                   # Next.js configuration
├── vitest.config.js                  # Vitest configuration
├── tsconfig.json                     # TypeScript configuration
├── eslint.config.mjs                 # ESLint configuration
├── .prettierrc.json                  # Prettier configuration
├── Dockerfile                        # Docker multi-stage build
├── package.json                      # Dependencies & scripts
└── pnpm-lock.yaml                   # Lockfile
```

## Data Flow Architecture

### 1. Search Flow

```
User Input (SearchBar)
    ↓
Zustand Store (query slice)
    ↓ (triggers React Query)
useSearchQuery Hook
    ↓
API Client (searchApi.query)
    ↓
Axios Request (with cache interceptor)
    ↓
ADS API (/v1/search)
    ↓
Response Transformation
    ↓
React Query Cache Update
    ↓
Component Re-render (ResultList)
```

### 2. Authentication Flow

```
Login Form Submission
    ↓
userApi.login(credentials)
    ↓
ADS API (/v1/user/login)
    ↓
Response: { access_token, username, ... }
    ↓
Iron-Session Cookie Set
    ↓
Zustand Store (user slice)
    ↓
LocalStorage Persistence
    ↓
App Re-render with Authenticated State
```

### 3. Server-Side Rendering (SSR) Flow

```
Browser Request (/search?q=...)
    ↓
Next.js Server
    ↓
Edge Middleware (bot check, redirects)
    ↓
Page Component getServerSideProps
    ↓
React Query prefetchQuery
    ↓
ADS API Request (server-side)
    ↓
Dehydrate Query State
    ↓
Render React to HTML
    ↓
Send HTML + Dehydrated State
    ↓
Browser Hydration
    ↓
Interactive App
```

### 4. ORCID Integration Flow

```
User Clicks "Connect ORCID"
    ↓
Redirect to ORCID OAuth
    ↓
User Authorizes
    ↓
Callback to /user/orcid/OAuth
    ↓
Exchange Code for Token
    ↓
Store in ADS API
    ↓
Fetch ORCID Works
    ↓
Update Zustand Store (orcid slice)
    ↓
Display in UI
```

## State Management Strategy

### Zustand (Global Client State)

**Purpose**: Manage application-level state that persists across page navigations

**Slices**:
1. **search**: Current query, pagination, display settings
2. **user**: Authentication state, tokens, user info
3. **settings**: User preferences, facet configuration
4. **appMode**: Current science domain (ASTROPHYSICS, etc.)
5. **docs**: Currently loaded documents
6. **orcid**: ORCID connection state and works
7. **notification**: Alert/notification messages

**Persistence**:
- Stored in `localStorage` under key `SCIX_SESSION_STORAGE_KEY`
- Only persists: user, mode, numPerPage, settings, orcid
- Deep merge strategy on rehydration

**Location**: `src/store/`

### React Query (Server State)

**Purpose**: Manage server data with caching, refetching, and synchronization

**Query Patterns**:
- `useSearchQuery`: Search results
- `useInfiniteSearchQuery`: Paginated search
- `useDocQuery`: Document details
- `useMetricsQuery`: Paper metrics
- `useLibrariesQuery`: User libraries
- `useOrcidWorksQuery`: ORCID works

**Key Features**:
- Automatic background refetching
- Cache invalidation on mutations
- SSR support with dehydration
- Optimistic updates
- Query key factories for organization

**Location**: `src/api/*/queries.ts`, `src/lib/useCreateQueryClient.ts`

### When to Use Each

| Use Case | Zustand | React Query |
|----------|---------|-------------|
| Search query parameters | ✅ | ❌ |
| Search results | ❌ | ✅ |
| User auth token | ✅ | ❌ |
| User profile data | ❌ | ✅ |
| UI preferences | ✅ | ❌ |
| Library list | ❌ | ✅ |
| Current app mode | ✅ | ❌ |

## API Architecture

### Client-Side API (`API_HOST_CLIENT`)

- Used by browser requests
- Proxied through Next.js server in development
- Direct to ADS API in production
- Includes CORS headers
- Rate-limited per IP

**Configuration**: `src/api/lib/apiClient.ts:17-31`

### Server-Side API (`API_HOST_SERVER`)

- Used by SSR and API routes
- Direct backend-to-backend communication
- No CORS restrictions
- Higher timeout (30s)
- Internal network routing

**Configuration**: `src/api/lib/apiClient.ts:33-47`

### Request/Response Pipeline

```
Request
    ↓
1. Axios Config (headers, timeout)
    ↓
2. Request Interceptor (add auth token)
    ↓
3. Cache Interceptor (check cache)
    ↓
4. HTTP Request
    ↓
5. Response Interceptor (transform data)
    ↓
6. Cache Interceptor (store in cache)
    ↓
7. Return to caller
```

**Interceptors**: `src/api/lib/interceptors.ts`

### API Modules

Each API module follows this pattern:

```typescript
// src/api/feature/feature.ts
export class FeatureAPI {
  constructor(private client: AxiosInstance) {}

  async getSomething(params: IParams): Promise<IResponse> {
    const response = await this.client.get('/v1/feature', { params });
    return response.data;
  }
}

export const featureApi = new FeatureAPI(apiClient);
```

## Routing Architecture

### File-Based Routing

Next.js automatically creates routes from the `src/pages/` directory structure:

- `/pages/index.tsx` → `/`
- `/pages/search/index.tsx` → `/search`
- `/pages/abs/[id]/abstract.tsx` → `/abs/:id/abstract`

### Dynamic Routes

- `[id]`: Single dynamic segment (e.g., `/abs/[id]/abstract`)
- `[...slug]`: Catch-all route (not currently used)

### Route Groups

1. **Public Routes**: `/`, `/search`, `/abs/*`
2. **Auth Routes**: `/user/account/login`, `/user/account/register`
3. **Protected Routes**: `/user/libraries/*`, `/user/settings/*`

### Middleware Chain

```
Request
    ↓
Edge Middleware (middleware.ts)
    ↓
Route Handler (page component)
    ↓
Server Middlewares (initSession, verifyMiddleware, etc.)
    ↓
getServerSideProps (data fetching)
    ↓
Component Render
```

**Middleware**: `src/middleware.ts`, `src/middlewares/`

## Security Architecture

### Authentication

- **Session Management**: Iron-session with encrypted cookies
- **Token Storage**: Secure, httpOnly cookies
- **Token Expiry**: Automatic session timeout
- **CSRF Protection**: Built into Next.js

**Implementation**: `src/middlewares/initSession.ts`, `src/auth-utils.ts`

### Authorization

- **Protected Routes**: Redirect to login if unauthenticated
- **API Authorization**: Bearer token in Authorization header
- **Role-Based**: User vs. anonymous access

**Implementation**: `src/middlewares/verifyMiddleware.ts`

### Content Security Policy (CSP)

```javascript
// next.config.mjs
{
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.google-analytics.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    // ... more directives
  ].join('; ')
}
```

**Configuration**: `next.config.mjs:45-80`

### Bot Protection

- **reCAPTCHA v3**: Invisible bot detection on forms
- **User-Agent Analysis**: Server-side bot detection
- **Rate Limiting**: API request throttling

**Implementation**: `src/middlewares/botCheck.ts`, `src/components/Forms/RecaptchaNotice.tsx`

## Performance Optimizations

### Server-Side Rendering (SSR)

- **Initial Page Load**: Fully rendered HTML
- **SEO Friendly**: Search engine indexable
- **Data Prefetching**: React Query dehydration

### Code Splitting

- **Route-Based**: Automatic with Next.js
- **Component-Based**: Dynamic imports for heavy components
- **Bundle Analysis**: `pnpm analyze` for size monitoring

### Caching Strategy

1. **Browser Cache**: Static assets (images, fonts)
2. **React Query Cache**: API responses (staleTime, gcTime)
3. **Axios Cache**: HTTP response cache (5-minute TTL)
4. **LocalStorage Cache**: Zustand persisted state

### Image Optimization

- **Next.js Image**: Automatic optimization and lazy loading
- **Remote Patterns**: Configured for external image sources
- **Responsive Images**: Served at appropriate sizes

**Configuration**: `next.config.mjs:95-101`

## Error Handling & Monitoring

### Error Boundaries

- **Component-Level**: Catch React render errors
- **Page-Level**: Fallback UI for entire pages
- **HOC Pattern**: `withErrorBoundary` wrapper

**Implementation**: `src/hocs/withErrorBoundary.tsx`

### Sentry Integration

- **Client-Side**: Browser error tracking
- **Server-Side**: Node.js error tracking
- **Edge Middleware**: Edge function errors
- **Source Maps**: Uploaded for debugging

**Configuration**: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`

### Logging

- **Pino Logger**: Structured JSON logging
- **Log Levels**: debug, info, warn, error
- **Request Logging**: HTTP request/response logs

**Implementation**: `src/logger.ts`

## Build & Deployment Architecture

### Build Process

```bash
pnpm build
    ↓
1. Type Check (TypeScript)
    ↓
2. Lint (ESLint)
    ↓
3. Build Next.js App
    ↓
4. Generate Standalone Output
    ↓
5. Copy Public Assets
    ↓
6. Create dist/ Directory
```

**Output**: `dist/standalone/` - self-contained deployment

### Docker Build

Multi-stage build for minimal image size:

1. **base**: Node.js Alpine base
2. **deps**: Install dependencies
3. **builder**: Build application
4. **runner**: Production runtime (minimal)

**Configuration**: `Dockerfile`

### CI/CD Pipeline

1. **Pull Request**:
   - Lint code
   - Run tests
   - Type check

2. **Post-Merge** (master):
   - Full test suite
   - Coverage report
   - Sentry upload

3. **Auto-Tag**:
   - Version bump
   - Create release

**Workflows**: `.github/workflows/`

## Development vs. Production

### Development Mode

```bash
pnpm dev
```

- Hot Module Replacement (HMR)
- API proxy to backend
- Source maps enabled
- React DevTools enabled
- MSW mocking available

### Production Mode

```bash
pnpm build && pnpm start
```

- Optimized bundles
- Minified code
- Direct API calls
- Source maps uploaded to Sentry
- Standalone server

## Environment Configuration

### Required Variables

```bash
# API Endpoints
API_HOST_CLIENT=https://api.scixplorer.org
API_HOST_SERVER=http://backend:5000

# URLs
BASE_CANONICAL_URL=https://scixplorer.org

# Session
COOKIE_SECRET=<32-char secret>
SCIX_SESSION_COOKIE_NAME=scix_session

# ORCID
NEXT_PUBLIC_ORCID_CLIENT_ID=<client_id>
NEXT_PUBLIC_ORCID_REDIRECT_URI=<redirect_uri>
NEXT_PUBLIC_ORCID_API_URL=https://orcid.org

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=<sentry_dsn>

# Analytics
NEXT_PUBLIC_GTM_ID=<gtm_id>
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<recaptcha_key>
```

**Reference**: `src/config.ts:1-30`

## Scalability Considerations

### Horizontal Scaling

- **Stateless**: No server-side state (sessions in cookies)
- **Load Balancing**: Ready for multiple instances
- **CDN**: Static assets served from CDN

### Database (API Layer)

- **Caching**: Redis cache in API layer
- **Read Replicas**: Database read scaling
- **Connection Pooling**: Efficient DB connections

### Performance Monitoring

- **Web Vitals**: Core Web Vitals tracking
- **API Latency**: Request timing
- **Bundle Size**: Monitored and optimized

## Future Architecture Considerations

### Potential Enhancements

1. **Service Worker**: Offline support and caching
2. **GraphQL**: Replace REST API for better data fetching
3. **Micro-frontends**: Split into smaller apps
4. **Edge Functions**: Move more logic to edge
5. **Streaming SSR**: React 18 streaming features

---

**Last Updated**: 2025-11-17

For more details on specific areas, see:
- [State Management](STATE_MANAGEMENT.md)
- [API Layer](API.md)
- [Routing](ROUTING.md)
- [Build & Deployment](BUILD_AND_DEPLOYMENT.md)
