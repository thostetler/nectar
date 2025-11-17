# Configuration Documentation

## Overview

Science Explorer configuration is managed through environment variables, Next.js configuration, and application constants. This document covers all configuration options and their purposes.

## Environment Variables

### Required Variables

**File**: `.env.local` (create from `.env.example`)

```bash
# API Endpoints
API_HOST_CLIENT=https://api.scixplorer.org
API_HOST_SERVER=http://backend:5000

# Base URL
BASE_CANONICAL_URL=https://scixplorer.org

# Session Management
COOKIE_SECRET=your-32-character-secret-key-here
SCIX_SESSION_COOKIE_NAME=scix_session

# ORCID OAuth
NEXT_PUBLIC_ORCID_CLIENT_ID=APP-XXXX-XXXX-XXXX-XXXX
NEXT_PUBLIC_ORCID_REDIRECT_URI=https://scixplorer.org/user/orcid/OAuth
NEXT_PUBLIC_ORCID_API_URL=https://orcid.org
NEXT_PUBLIC_ORCID_OAUTH_URL=https://orcid.org/oauth/authorize

# Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-auth-token

# Analytics
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Security
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LeXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Variable Details

#### API Configuration

**API_HOST_CLIENT**
- **Purpose**: API endpoint for client-side requests (browser)
- **Example**: `https://api.scixplorer.org`
- **Used by**: Axios client in browser
- **Default**: None (required)

**API_HOST_SERVER**
- **Purpose**: API endpoint for server-side requests (SSR, API routes)
- **Example**: `http://backend:5000` (internal) or `https://api.scixplorer.org` (external)
- **Used by**: Axios client in `getServerSideProps`, API routes
- **Default**: Falls back to `API_HOST_CLIENT`
- **Note**: Can be internal URL for better performance

**Why Two API URLs?**
- Client requests may go through proxy/CDN
- Server requests can use internal network (faster, no CORS)
- Different rate limiting rules

#### URL Configuration

**BASE_CANONICAL_URL**
- **Purpose**: Canonical URL for SEO and redirects
- **Example**: `https://scixplorer.org`
- **Used by**: Meta tags, sitemap, canonical links
- **Default**: None (required)

#### Session Management

**COOKIE_SECRET**
- **Purpose**: Encryption key for iron-session cookies
- **Length**: Minimum 32 characters
- **Generate**: `openssl rand -base64 32`
- **Security**: Keep secret, rotate periodically
- **Used by**: `src/middlewares/initSession.ts`

**SCIX_SESSION_COOKIE_NAME**
- **Purpose**: Name of session cookie
- **Example**: `scix_session`
- **Default**: `scix_session`
- **Security**: HttpOnly, Secure (production), SameSite=Lax

#### ORCID Configuration

**NEXT_PUBLIC_ORCID_CLIENT_ID**
- **Purpose**: ORCID OAuth application client ID
- **Get From**: ORCID developer portal
- **Example**: `APP-1234567890123456`
- **Visibility**: Public (safe to expose)

**NEXT_PUBLIC_ORCID_REDIRECT_URI**
- **Purpose**: OAuth callback URL
- **Must Match**: Registered redirect URI in ORCID app settings
- **Example**: `https://scixplorer.org/user/orcid/OAuth`
- **Note**: Must be HTTPS in production

**NEXT_PUBLIC_ORCID_API_URL**
- **Purpose**: ORCID API endpoint
- **Production**: `https://orcid.org`
- **Sandbox**: `https://sandbox.orcid.org`

**NEXT_PUBLIC_ORCID_OAUTH_URL**
- **Purpose**: ORCID OAuth authorization endpoint
- **Production**: `https://orcid.org/oauth/authorize`
- **Sandbox**: `https://sandbox.orcid.org/oauth/authorize`

#### Error Tracking (Sentry)

**NEXT_PUBLIC_SENTRY_DSN**
- **Purpose**: Sentry project DSN (Data Source Name)
- **Get From**: Sentry project settings
- **Example**: `https://abc123@o123456.ingest.sentry.io/987654`
- **Visibility**: Public (safe to expose)

**SENTRY_ORG**
- **Purpose**: Sentry organization slug
- **Used by**: Source map upload scripts

**SENTRY_PROJECT**
- **Purpose**: Sentry project slug
- **Used by**: Source map upload scripts

**SENTRY_AUTH_TOKEN**
- **Purpose**: Sentry authentication token
- **Get From**: Sentry settings > Auth Tokens
- **Permissions**: Releases, source maps
- **Security**: Keep secret

#### Analytics

**NEXT_PUBLIC_GTM_ID**
- **Purpose**: Google Tag Manager container ID
- **Example**: `GTM-XXXXXXX`
- **Used by**: `@next/third-parties/google`
- **Optional**: Remove if not using GTM

**NEXT_PUBLIC_GA_MEASUREMENT_ID**
- **Purpose**: Google Analytics 4 measurement ID
- **Example**: `G-XXXXXXXXXX`
- **Used by**: Google Tag Manager
- **Optional**: Remove if not using GA

#### Security

**NEXT_PUBLIC_RECAPTCHA_SITE_KEY**
- **Purpose**: Google reCAPTCHA v3 site key
- **Get From**: Google reCAPTCHA admin console
- **Example**: `6LeXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- **Used by**: Feedback forms, registration
- **Visibility**: Public (safe to expose)

### Optional Variables

```bash
# Development
NEXT_PUBLIC_API_MOCKING=enabled  # Enable MSW mocking
NODE_ENV=development              # Environment mode

# Logging
LOG_LEVEL=debug                   # Pino log level (debug, info, warn, error)

# Build
NEXT_PUBLIC_BUILD_ID=v1.2.3       # Build version
NEXT_PUBLIC_COMMIT_SHA=abc123     # Git commit SHA
```

## Application Configuration

### Constants

**Location**: `src/config.ts`

```typescript
export const APP_DEFAULTS = {
  // Search
  RESULT_PER_PAGE: 25,
  SORT: 'score desc',
  MAX_EXPORT: 3000,

  // API
  API_TIMEOUT: 30000,              // 30 seconds
  SSR_API_TIMEOUT: 30000,

  // UI
  MAX_AUTHOR_DISPLAY: 10,
  MAX_KEYWORD_DISPLAY: 5,
  DEBOUNCE_TIME: 300,              // ms

  // Session
  SESSION_TTL: 24 * 60 * 60,       // 24 hours
};

export const APP_MODES = [
  'ASTROPHYSICS',
  'HELIOPHYSICS',
  'PLANETARY_SCIENCE',
  'EARTH_SCIENCE',
  'BIOPHYSICAL_SCIENCE',
] as const;
```

### API Targets

**Location**: `src/api/models.ts`

```typescript
export enum ApiTargets {
  SEARCH = '/v1/search',
  USER = '/v1/user',
  BIBLIB = '/v1/biblib',
  EXPORT = '/v1/export',
  OBJECTS = '/v1/objects',
  METRICS = '/v1/metrics',
  ORCID = '/v1/orcid',
  REFERENCE = '/v1/reference',
  RESOLVER = '/v1/resolver',
  GRAPHICS = '/v1/graphics',
  JOURNALS = '/v1/journals',
  UAT = '/v1/uat',
  AUTHOR_AFF = '/v1/author-affiliation',
  CITATION_HELPER = '/v1/citation_helper',
  FEEDBACK = '/v1/feedback',
  VAULT = '/v1/vault',
  VIS = '/v1/vis',
}
```

## Next.js Configuration

### next.config.mjs

**Location**: `/next.config.mjs`

#### Output Configuration

```javascript
export default {
  output: 'standalone',          // Self-contained deployment
  distDir: 'dist',              // Build output directory
}
```

**Standalone Mode**:
- Creates `dist/standalone/` directory
- Includes all dependencies
- Minimal Docker image size
- Self-contained Node.js server

#### Transpilation

```javascript
export default {
  transpilePackages: [
    '@nivo/core',
    '@nivo/bar',
    '@nivo/line',
    // ... other @nivo packages
  ],
}
```

**Why**: @nivo packages need transpilation for Next.js compatibility

#### Experimental Features

```javascript
export default {
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB'],
    optimizePackageImports: ['@chakra-ui/react', 'ramda'],
  },
}
```

**webVitalsAttribution**: Track Web Vitals for performance monitoring
**optimizePackageImports**: Tree-shake large packages

#### Security Headers

```javascript
export default {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.google-analytics.com *.googletagmanager.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' *.scixplorer.org *.sentry.io",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
}
```

#### Redirects

```javascript
export default {
  async redirects() {
    return [
      {
        source: '/abs/:id',
        destination: '/abs/:id/abstract',
        permanent: true,
      },
    ];
  },
}
```

#### Rewrites (Development Only)

```javascript
export default {
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/v1/:path*',
          destination: `${process.env.API_HOST_CLIENT}/v1/:path*`,
        },
      ];
    }
    return [];
  },
}
```

**Purpose**: Proxy API requests in development to avoid CORS

#### Image Optimization

```javascript
export default {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.scixplorer.org',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
  },
}
```

## TypeScript Configuration

### tsconfig.json

**Location**: `/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2015",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "strictNullChecks": false,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

**Key Options**:
- `strict: true`: Enable all strict type checking
- `strictNullChecks: false`: Allow undefined/null (legacy)
- `paths`: Alias `@/` to `./src/`
- `target: ES2015`: Modern JavaScript output

## Theme Configuration

### Chakra UI Theme

**Location**: `src/theme.ts`

**Customization**:
```typescript
export const theme = extendTheme({
  colors: {
    brand: {
      50: '#e6f2ff',
      100: '#cce5ff',
      // ... more shades
      900: '#001a33',
    },
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: true,
  },
  // ... more customization
});
```

**Features**:
- Custom brand colors
- Light/dark mode support
- Responsive breakpoints
- Component style overrides

## Logging Configuration

### Pino Logger

**Location**: `src/logger.ts`

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  browser: {
    asObject: true,
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
});
```

**Log Levels**:
- `debug`: Detailed debugging
- `info`: General information
- `warn`: Warnings
- `error`: Errors
- `fatal`: Critical errors

**Usage**:
```typescript
import { logger } from '@/logger';

logger.info('User logged in', { userId: '123' });
logger.error({ err }, 'API request failed');
```

## Testing Configuration

### Vitest

**Location**: `vitest.config.js`

```javascript
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: './vitest-setup.ts',
    globals: true,
    isolate: true,
    threads: true,
    maxConcurrency: 16,
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.{ts,tsx}',
        '**/*.config.{js,ts}',
      ],
    },
  },
});
```

## Build Configuration

### Scripts

**Location**: `package.json`

```json
{
  "scripts": {
    "dev": "next dev -p 8000",
    "build": "./scripts/build-prod.sh",
    "build:local": "./scripts/build-local.sh",
    "start": "node dist/standalone/server.js",
    "lint": "next lint",
    "test": "vitest",
    "test:ci": "vitest run --reporter=verbose --reporter=junit --outputFile=test-results.xml --maxConcurrency=2 --testTimeout=30000 --hookTimeout=30000 --retry=2"
  }
}
```

### Build Scripts

**Production Build**: `scripts/build-prod.sh`
```bash
#!/bin/bash
export NODE_ENV=production
pnpm run lint
pnpm run test:ci
next build
```

**Local Build**: `scripts/build-local.sh`
```bash
#!/bin/bash
export NODE_ENV=production
next build
```

## Docker Configuration

### Dockerfile

**Location**: `/Dockerfile`

**Multi-Stage Build**:
```dockerfile
# 1. Base
FROM node:18-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# 2. Dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 3. Builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# 4. Runner (production)
FROM base AS runner
COPY --from=builder /app/dist/standalone ./
COPY --from=builder /app/dist/static ./dist/static
EXPOSE 3000
CMD ["node", "server.js"]
```

## Environment-Specific Configuration

### Development

```bash
NODE_ENV=development
API_HOST_CLIENT=http://localhost:5000
API_HOST_SERVER=http://localhost:5000
NEXT_PUBLIC_API_MOCKING=enabled
LOG_LEVEL=debug
```

**Features**:
- Hot module reloading
- API mocking available
- Detailed logging
- Source maps
- React DevTools

### Production

```bash
NODE_ENV=production
API_HOST_CLIENT=https://api.scixplorer.org
API_HOST_SERVER=http://backend:5000
LOG_LEVEL=info
```

**Features**:
- Optimized bundles
- Minified code
- Source maps uploaded to Sentry
- Rate limiting
- Cache headers

### Testing

```bash
NODE_ENV=test
```

**Features**:
- MSW mocking enabled
- Simplified Zustand store
- No persistence

## Security Configuration

### Content Security Policy

**Location**: `next.config.mjs`

**Directives**:
- `default-src 'self'`: Only load from same origin
- `script-src`: Allow Google Analytics, GTM
- `style-src 'unsafe-inline'`: Chakra UI requires inline styles
- `img-src`: Allow images from HTTPS
- `connect-src`: API endpoints, Sentry
- `frame-ancestors 'none'`: Prevent clickjacking

### Session Security

**iron-session Configuration**:
```typescript
{
  cookieName: process.env.SCIX_SESSION_COOKIE_NAME,
  password: process.env.COOKIE_SECRET,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
  },
}
```

## Performance Configuration

### React Query

**Default Options**:
```typescript
{
  queries: {
    staleTime: 5 * 60 * 1000,      // 5 minutes
    gcTime: 10 * 60 * 1000,        // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  },
  mutations: {
    retry: 1,
  },
}
```

### Axios Cache

**Cache Configuration**:
```typescript
{
  ttl: 5 * 60 * 1000,              // 5 minutes
  cacheTakeover: false,
  cachePredicate: {
    ignoreUrls: [/^(?!\/search\/)/],  // Only cache search
  },
}
```

## Monitoring Configuration

### Sentry

**Client**: `sentry.client.config.ts`
```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

**Server**: `sentry.server.config.ts`
```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

---

**Last Updated**: 2025-11-17

**Related Documentation**:
- [Architecture](ARCHITECTURE.md)
- [Build & Deployment](BUILD_AND_DEPLOYMENT.md)
