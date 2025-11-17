# Science Explorer (SciX) - Technical Documentation

## Overview

Science Explorer (SciX) is a modern Next.js-based web application for scientific research paper discovery, searching, and management. It serves as a successor to the Astrophysics Data System (ADS), supporting multiple scientific domains including astrophysics, heliophysics, planetary science, earth science, and biophysical science.

## Documentation Index

### Core Architecture
- [Architecture Overview](ARCHITECTURE.md) - System architecture, tech stack, and design patterns
- [Configuration Guide](CONFIGURATION.md) - Environment variables, settings, and deployment configuration
- [Build and Deployment](BUILD_AND_DEPLOYMENT.md) - Build process, Docker, CI/CD pipelines

### Application Features
- [Search Functionality](SEARCH.md) - Search engine, query parsing, facets, and filters
- [User Authentication](AUTHENTICATION.md) - Session management, login flows, authorization
- [Library Management](LIBRARIES.md) - User libraries, collections, and paper organization
- [ORCID Integration](ORCID.md) - OAuth flow, work synchronization, profile management
- [Visualizations](VISUALIZATIONS.md) - Charts, graphs, networks, and data visualization

### Development Guide
- [UI Components](COMPONENTS.md) - Component library, patterns, and usage
- [State Management](STATE_MANAGEMENT.md) - Zustand store, React Query, data flow
- [API Layer](API.md) - HTTP client, endpoints, request/response handling
- [Routing](ROUTING.md) - Next.js routing, navigation, middleware
- [Testing](TESTING.md) - Test setup, strategies, mocking, and coverage
- [Style Guide](STYLE_GUIDE.md) - Coding standards, conventions, and best practices

## Quick Start

### For Developers
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

### For Documentation Contributors
All documentation follows the style guide in `STYLE_GUIDE.md`. Key principles:
- Write for both human developers and AI agents
- Use clear, hierarchical structure with detailed headings
- Provide code examples for complex concepts
- Link to relevant source files with line numbers
- Keep information accurate and up-to-date

## Technology Stack

### Core Framework
- **Next.js 15.4.7** - React framework with SSR/SSG
- **React 18.3.1** - UI library
- **TypeScript 4.9.5** - Type-safe JavaScript
- **Node.js 18.18.0+** - Runtime environment

### State Management
- **Zustand 3.7.1** - Global state management
- **TanStack React Query 4.29.17** - Server state and caching

### UI Framework
- **Chakra UI 2.4.6** - Component library
- **Emotion** - CSS-in-JS styling
- **Framer Motion 6.5.1** - Animations

### Data & Visualization
- **D3 7.6.1** - Data visualization
- **Nivo 0.80.0** - Chart components
- **Axios 1.12.0** - HTTP client

### Development Tools
- **Vitest 0.34.5** - Testing framework
- **MSW 1.2.3** - API mocking
- **ESLint 9.13.0** - Code linting
- **Prettier 2.3.0** - Code formatting

## Project Structure

```
nectar/
├── src/
│   ├── api/              # API client layer (21 modules)
│   ├── components/       # React UI components (56+ modules)
│   ├── pages/            # Next.js file-based routing
│   ├── lib/              # Custom hooks and utilities
│   ├── store/            # Zustand state management
│   ├── utils/            # Helper functions
│   ├── types/            # TypeScript type definitions
│   ├── mocks/            # MSW mock data and handlers
│   ├── middlewares/      # Server middleware
│   └── __tests__/        # Test files
├── public/               # Static assets
├── docs/                 # Technical documentation (this folder)
├── scripts/              # Build and utility scripts
├── .github/workflows/    # CI/CD configuration
└── [config files]        # next.config.mjs, tsconfig.json, etc.
```

## Key Features

### Search & Discovery
- Advanced Lucene query syntax support
- Faceted filtering (author, year, publication, etc.)
- Typeahead suggestions (journals, keywords, UAT)
- Search result visualizations (graphs, networks, clouds)
- Export capabilities (BibTeX, APA, MLA, etc.)

### Document Management
- Comprehensive abstract pages with metadata
- Citations, references, and related papers
- Graphics and supplementary data viewing
- Metrics and analytics for papers
- Multi-format citation export

### User Features
- Account management and authentication
- Personal paper libraries with organization
- Search result collection and sharing
- Email notification preferences
- ORCID profile integration

### Visualizations
- Search result distribution graphs
- Author collaboration networks
- Paper citation networks
- Topic/concept word clouds
- Citation metrics and trends

## API Integration

The application communicates with the ADS API backend:
- **Production API**: Configured via `API_HOST_CLIENT` and `API_HOST_SERVER`
- **Authentication**: Bearer token-based with iron-session
- **Caching**: Axios cache interceptor for performance
- **Error Handling**: Comprehensive error parsing and user feedback

## Development Workflow

1. **Local Development**: Use `pnpm dev` with hot module reloading
2. **Testing**: Run `pnpm test` for unit/component tests
3. **Linting**: Run `pnpm lint` before commits
4. **Building**: Run `pnpm build` to create production bundle
5. **Deployment**: Docker-based deployment with multi-stage builds

## Contributing

When working on this codebase:
1. Read the [Style Guide](STYLE_GUIDE.md) for coding standards
2. Review relevant feature documentation before making changes
3. Write tests for new functionality
4. Update documentation when adding features
5. Follow the established patterns in the codebase

## Support & Resources

- **Source Code**: `/home/user/nectar/`
- **Issue Tracking**: See project repository
- **API Documentation**: See `docs/API.md`
- **Component Library**: See `docs/COMPONENTS.md`

---

**Last Updated**: 2025-11-17
**Version**: Based on Next.js 15.4.7 codebase
