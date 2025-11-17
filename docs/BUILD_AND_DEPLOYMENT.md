# Build and Deployment Documentation

## Overview

Science Explorer uses Next.js standalone mode for optimized production builds with Docker-based deployment for containerization and scalability.

## Build Process

### Development Build

**Command**: `pnpm dev`

```bash
pnpm dev
# Or with custom port
pnpm dev -- -p 8000
```

**Features**:
- Hot Module Replacement (HMR)
- Fast Refresh for React components
- Source maps enabled
- API proxy to backend (development only)
- React DevTools integration
- Zustand DevTools integration

**Environment**: `NODE_ENV=development`

### Production Build

**Command**: `pnpm build`

**Script**: `scripts/build-prod.sh`

```bash
#!/bin/bash
set -e

export NODE_ENV=production

echo "🔍 Running linter..."
pnpm lint

echo "🧪 Running tests..."
pnpm test:ci

echo "📦 Building Next.js application..."
next build

echo "✅ Build complete!"
```

**Build Steps**:
1. Lint code (ESLint)
2. Run tests (Vitest)
3. Type check (TypeScript)
4. Build Next.js application
5. Generate standalone output

**Output**: `dist/standalone/`

**Contents**:
```
dist/
├── standalone/
│   ├── server.js           # Next.js server
│   ├── package.json        # Production dependencies
│   ├── node_modules/       # Bundled dependencies
│   └── .next/              # Built pages and assets
├── static/                 # Static assets (public folder)
└── cache/                  # Build cache
```

### Local Build (Fast)

**Command**: `pnpm build:local`

**Script**: `scripts/build-local.sh`

```bash
#!/bin/bash
export NODE_ENV=production
next build
```

**Difference**: Skips linting and testing for faster iteration.

**Use Case**: Local testing of production build.

## Build Configuration

### Next.js Config

**Location**: `next.config.mjs`

```javascript
export default {
  // Output Configuration
  output: 'standalone',
  distDir: 'dist',

  // Webpack Configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side only modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // Experimental Features
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB'],
    optimizePackageImports: ['@chakra-ui/react', 'ramda'],
  },

  // Transpilation
  transpilePackages: [
    '@nivo/core',
    '@nivo/bar',
    '@nivo/line',
    '@nivo/network',
  ],
};
```

### Bundle Analysis

**Command**: `pnpm analyze`

```json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
}
```

**Output**: Opens bundle analyzer in browser showing:
- Bundle sizes by route
- Module sizes
- Duplicate dependencies
- Code splitting effectiveness

**Configuration**: `next.config.mjs`

```javascript
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer({
  // ... config
});
```

## Docker Deployment

### Dockerfile

**Location**: `Dockerfile`

**Multi-Stage Build**:

```dockerfile
# Stage 1: Base
FROM node:18-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

# Stage 3: Builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables
ARG API_HOST_CLIENT
ARG API_HOST_SERVER
ARG BASE_CANONICAL_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_GTM_ID
ARG NEXT_PUBLIC_ORCID_CLIENT_ID
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY

ENV API_HOST_CLIENT=$API_HOST_CLIENT
ENV API_HOST_SERVER=$API_HOST_SERVER
ENV BASE_CANONICAL_URL=$BASE_CANONICAL_URL
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID
ENV NEXT_PUBLIC_ORCID_CLIENT_ID=$NEXT_PUBLIC_ORCID_CLIENT_ID
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY

RUN pnpm run build

# Stage 4: Runner (Production)
FROM base AS runner
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/dist/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/dist/static ./dist/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**Build Stages**:
1. **base**: Node.js 18 Alpine with pnpm
2. **deps**: Install dependencies
3. **builder**: Build application
4. **runner**: Minimal production image

**Benefits**:
- Small final image size (~150MB)
- Only production dependencies
- Non-root user for security
- Caching for faster rebuilds

### Building Docker Image

```bash
# Build image
docker build -t scixplorer:latest \
  --build-arg API_HOST_CLIENT=https://api.scixplorer.org \
  --build-arg API_HOST_SERVER=http://backend:5000 \
  --build-arg BASE_CANONICAL_URL=https://scixplorer.org \
  --build-arg NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx \
  .

# Run container
docker run -p 3000:3000 \
  -e COOKIE_SECRET=your-secret-key \
  -e SCIX_SESSION_COOKIE_NAME=scix_session \
  scixplorer:latest
```

### Docker Compose

**Location**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        API_HOST_CLIENT: https://api.scixplorer.org
        API_HOST_SERVER: http://backend:5000
        BASE_CANONICAL_URL: https://scixplorer.org
        NEXT_PUBLIC_SENTRY_DSN: ${SENTRY_DSN}
        NEXT_PUBLIC_GTM_ID: ${GTM_ID}
        NEXT_PUBLIC_ORCID_CLIENT_ID: ${ORCID_CLIENT_ID}
        NEXT_PUBLIC_RECAPTCHA_SITE_KEY: ${RECAPTCHA_SITE_KEY}
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - COOKIE_SECRET=${COOKIE_SECRET}
      - SCIX_SESSION_COOKIE_NAME=scix_session
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

**Usage**:
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f app

# Rebuild
docker-compose up -d --build
```

## CI/CD Pipeline

### GitHub Actions

**Location**: `.github/workflows/`

#### Pull Request Workflow

**File**: `pull-request.yml`

```yaml
name: Pull Request CI

on:
  pull_request:
    branches: [main, master]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Enable Corepack
        run: corepack enable && corepack prepare pnpm@latest --activate

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run linter
        run: pnpm lint

      - name: Run tests
        run: pnpm test:ci

      - name: Type check
        run: pnpm tsc --noEmit

      - name: Build
        run: pnpm build
        env:
          API_HOST_CLIENT: ${{ secrets.API_HOST_CLIENT }}
          API_HOST_SERVER: ${{ secrets.API_HOST_SERVER }}
          BASE_CANONICAL_URL: ${{ secrets.BASE_CANONICAL_URL }}
```

#### Post-Merge Workflow

**File**: `post-merge.yml`

```yaml
name: Post-Merge CI

on:
  push:
    branches: [main, master]

jobs:
  test-and-upload:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Enable Corepack
        run: corepack enable && corepack prepare pnpm@latest --activate

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests with coverage
        run: pnpm test:ci:upload

      - name: Upload coverage to Sentry
        run: |
          curl -sL https://sentry.io/get-cli/ | bash
          sentry-cli upload-dif ./test-results.xml
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}

      - name: Build application
        run: pnpm build

      - name: Upload source maps to Sentry
        run: |
          sentry-cli releases files ${{ github.sha }} \
            upload-sourcemaps dist/
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
```

#### Auto-Tag Workflow

**File**: `auto-tag.yml`

```yaml
name: Auto Tag and Release

on:
  push:
    branches: [main, master]

jobs:
  tag-and-release:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Bump version and push tag
        id: tag_version
        uses: mathieudutour/github-tag-action@v6.1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}

      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ steps.tag_version.outputs.new_tag }}
          release_name: Release ${{ steps.tag_version.outputs.new_tag }}
          body: ${{ steps.tag_version.outputs.changelog }}
```

## Deployment Environments

### Development

**URL**: `http://localhost:8000`

**Start**: `pnpm dev`

**Environment Variables**: `.env.local`

**Features**:
- Hot reload
- Debug logging
- API mocking available
- DevTools enabled

### Staging

**URL**: `https://staging.scixplorer.org`

**Deployment**: Automatic on push to `staging` branch

**Environment**:
```bash
NODE_ENV=production
API_HOST_CLIENT=https://staging-api.scixplorer.org
API_HOST_SERVER=http://staging-backend:5000
BASE_CANONICAL_URL=https://staging.scixplorer.org
```

**Purpose**: Pre-production testing

### Production

**URL**: `https://scixplorer.org`

**Deployment**: Manual or automatic on push to `main`

**Environment**:
```bash
NODE_ENV=production
API_HOST_CLIENT=https://api.scixplorer.org
API_HOST_SERVER=http://backend:5000
BASE_CANONICAL_URL=https://scixplorer.org
```

**Features**:
- Optimized bundles
- Sentry error tracking
- Analytics enabled
- CDN caching

## Performance Optimization

### Build Optimizations

1. **Code Splitting**:
   - Automatic route-based splitting
   - Dynamic imports for heavy components
   - Lazy loading for visualizations

2. **Tree Shaking**:
   - Removes unused code
   - Optimized with ES modules
   - Ramda and Lodash properly tree-shaken

3. **Minification**:
   - Terser for JavaScript
   - CSS minification
   - HTML minification

4. **Image Optimization**:
   - Next.js Image component
   - Automatic format conversion (WebP)
   - Lazy loading
   - Responsive images

5. **Bundle Splitting**:
   - Shared chunks for common code
   - Vendor chunk separation
   - Route-level chunks

### Runtime Optimizations

1. **React Query Caching**:
   - 5-minute stale time
   - 10-minute garbage collection
   - Background refetching

2. **Axios Caching**:
   - IndexedDB storage
   - 5-minute TTL
   - Search endpoints only

3. **Memoization**:
   - `useMemo` for expensive computations
   - `useCallback` for stable references
   - React.memo for pure components

4. **Virtual Scrolling**:
   - For long lists (100+ items)
   - Reduces DOM nodes
   - Improves scroll performance

## Monitoring & Logging

### Sentry Integration

**Error Tracking**:
- Client-side errors
- Server-side errors
- API errors
- Performance monitoring

**Setup**: Automatic with environment variables

**Source Maps**: Uploaded post-build

```bash
sentry-cli releases files $VERSION upload-sourcemaps ./dist
```

### Logging

**Pino Logger**:
- Structured JSON logs
- Different levels (debug, info, warn, error)
- Browser and server logging

**Example**:
```typescript
import { logger } from '@/logger';

logger.info('User logged in', { userId: '123' });
logger.error({ err }, 'API request failed');
```

### Analytics

**Google Analytics**:
- Page views
- User interactions
- Custom events

**Google Tag Manager**:
- Tag management
- Event tracking
- Custom dimensions

## Deployment Checklist

### Pre-Deployment

- [ ] Run linter: `pnpm lint`
- [ ] Run tests: `pnpm test:ci`
- [ ] Check type errors: `pnpm tsc --noEmit`
- [ ] Build locally: `pnpm build:local`
- [ ] Test build: `pnpm start`
- [ ] Review bundle size: `pnpm analyze`
- [ ] Update environment variables
- [ ] Update documentation

### Deployment

- [ ] Merge to main/master
- [ ] CI/CD pipeline passes
- [ ] Docker image built
- [ ] Container deployed
- [ ] Health check passes
- [ ] Smoke tests pass

### Post-Deployment

- [ ] Monitor error rates (Sentry)
- [ ] Check performance metrics
- [ ] Verify analytics tracking
- [ ] Test critical flows
- [ ] Monitor server resources

## Rollback Procedure

### Docker Rollback

```bash
# List images
docker images scixplorer

# Rollback to previous version
docker stop scixplorer-app
docker run -d --name scixplorer-app scixplorer:v1.2.3
```

### Git Rollback

```bash
# Revert last commit
git revert HEAD

# Or reset to specific commit
git reset --hard abc123

# Force push (use with caution)
git push -f origin main
```

## Troubleshooting

### Build Failures

**Issue**: Out of memory during build
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

**Issue**: Module not found
```bash
# Clear cache and reinstall
rm -rf node_modules .next dist
pnpm install
pnpm build
```

**Issue**: Type errors
```bash
# Check for missing types
pnpm tsc --noEmit

# Update type definitions
pnpm add -D @types/node @types/react @types/react-dom
```

### Deployment Issues

**Issue**: Container won't start
```bash
# Check logs
docker logs scixplorer-app

# Inspect container
docker inspect scixplorer-app

# Shell into container
docker exec -it scixplorer-app sh
```

**Issue**: Environment variables not set
```bash
# Verify variables in container
docker exec scixplorer-app env | grep API_HOST
```

**Issue**: Health check failing
```bash
# Test health endpoint
curl http://localhost:3000/api/monitor

# Check server logs
docker logs -f scixplorer-app
```

---

**Last Updated**: 2025-11-17

**Related Documentation**:
- [Configuration](CONFIGURATION.md)
- [Architecture](ARCHITECTURE.md)
- [Testing](TESTING.md)
