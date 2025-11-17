# UI Components Documentation

## Overview

The Science Explorer application contains 56+ React components built with Chakra UI. Components follow a consistent pattern with TypeScript interfaces, proper accessibility, and reusability.

## Component Architecture

### Component Structure Pattern

```typescript
// ComponentName.tsx
interface IComponentNameProps {
  // Props definition
  required: string;
  optional?: number;
  callback: (value: string) => void;
}

export const ComponentName: React.FC<IComponentNameProps> = ({
  required,
  optional = defaultValue,
  callback,
}) => {
  // 1. Hooks (context, state, refs, effects)
  const store = useStore();
  const [localState, setLocalState] = useState();

  // 2. Callbacks
  const handleAction = useCallback(() => {
    // Logic
  }, [dependencies]);

  // 3. Render
  return <Box>...</Box>;
};

ComponentName.displayName = 'ComponentName';
```

**Location Pattern**: `src/components/ComponentName/ComponentName.tsx`

## Core Components

### SearchBar

**Purpose**: Advanced search input with autocomplete, quick fields, and query building.

**Location**: `src/components/SearchBar/SearchBar.tsx`

**Props**:
```typescript
interface SearchBarProps {
  query?: string;               // Initial/current query
  isLoading?: boolean;          // Loading state
  queryAddition?: string;       // Additional query terms
  onSubmit?: (query: string) => void;
}
```

**Features**:
- Typeahead suggestions (journals, keywords, UAT)
- Quick field builders (author, year, bibstem)
- Query syntax highlighting
- Lucene query syntax support
- Keyboard navigation
- Auto-complete dropdown

**Sub-components**:
- `SearchInput`: Main input field with autocomplete
- `QuickFields`: Quick field buttons (author, year, etc.)
- `TypeaheadDropdown`: Suggestion dropdown

**Usage**:
```typescript
import { SearchBar } from '@/components/SearchBar';

<SearchBar
  query={currentQuery}
  isLoading={isSearching}
  onSubmit={handleSearch}
/>
```

**Related Files**:
- `src/components/SearchBar/SearchInput.tsx` - Main input component
- `src/components/SearchBar/QuickFields.tsx` - Quick field UI
- `src/components/SearchBar/searchInputReducer.ts` - State management
- `src/components/SearchBar/TypeaheadDropdown.tsx` - Autocomplete dropdown

---

### ResultList

**Purpose**: Display search results with multiple view options and interactions.

**Location**: `src/components/ResultList/`

**Features**:
- Multiple view modes (list, compact, card)
- Result selection for bulk operations
- Abstract preview
- Citation count badges
- Author list with "show more"
- Publication information
- Action buttons (save to library, export, etc.)

**Key Components**:
- `ResultItem`: Individual result display
- `ItemCheckbox`: Bulk selection checkbox
- `ResultActions`: Action buttons per result

**Usage**:
```typescript
import { ResultList } from '@/components/ResultList';

<ResultList
  results={searchResults}
  onSelect={handleResultSelect}
  viewMode="list"
/>
```

---

### SearchFacet

**Purpose**: Faceted filtering UI with drag-and-drop reordering.

**Location**: `src/components/SearchFacet/SearchFacet.tsx:1-100`

**Props**:
```typescript
interface ISearchFacetProps {
  field: FacetField;                  // Facet field name
  label: string;                      // Display label
  storeId: SearchFacetID;            // Unique facet ID
  logic: {                            // Filter logic
    single: FacetLogic[];
    multiple: FacetLogic[];
  };
  onQueryUpdate: (updates: Partial<IADSApiSearchParams>) => void;
  defaultIsHidden?: boolean;
  maxDepth?: number;
  noLoadMore?: boolean;
}
```

**Features**:
- Drag-and-drop reordering (dnd-kit)
- Show/hide facets
- Single/multiple selection modes
- Load more pagination
- Search within facet values
- Hierarchical facets support
- Facet state persistence

**Available Facets**:
- Author
- Year (with histogram slider)
- Publication (bibstem)
- Keywords
- Database
- Object type
- Document type
- Data source

**Sub-components**:
- `FacetList`: Renders facet items
- `FacetItem`: Individual facet value
- `HistogramSlider`: Year range slider

**Usage**:
```typescript
import { SearchFacet } from '@/components/SearchFacet';

<SearchFacet
  field="author_facet"
  label="Authors"
  storeId="author"
  logic={{
    single: ['limit'],
    multiple: ['and', 'or', 'exclude']
  }}
  onQueryUpdate={handleQueryUpdate}
/>
```

**State Management**:
- Uses Zustand store for facet configuration
- Persists open/closed state, order, visibility
- Store: `src/components/SearchFacet/store/FacetStore.ts`

---

### AbstractDetails

**Purpose**: Display comprehensive paper metadata and details.

**Location**: `src/components/AbstractDetails/`

**Sections**:
1. **Header**: Title, authors, publication info
2. **Abstract**: Paper abstract/summary
3. **Keywords**: Subject keywords
4. **Bibcode**: Unique identifier
5. **Publication**: Journal, volume, page
6. **Dates**: Publication and other dates
7. **DOI/ArXiv**: External identifiers
8. **Links**: Full text, data links

**Features**:
- Expandable author list
- Author affiliation lookup
- Clickable keywords (search)
- Copy bibcode button
- External link handling
- MathJax equation rendering

**Sub-components**:
- `AbstractTitle`: Title with status badges
- `AuthorList`: Author display with modal
- `PublicationInfo`: Journal/venue information
- `ExternalLinks`: DOI, ArXiv, full text links

**Usage**:
```typescript
import { AbstractDetails } from '@/components/AbstractDetails';

<AbstractDetails
  doc={paperDocument}
  onAuthorClick={handleAuthorSearch}
/>
```

---

### AbstractSideNav

**Purpose**: Navigation menu for abstract sub-pages (citations, references, etc.).

**Location**: `src/components/AbstractSideNav/AbstractSideNav.tsx`

**Features**:
- Active page highlighting
- Count badges for sections
- Responsive (drawer on mobile)
- Keyboard navigation
- Sticky positioning

**Navigation Items**:
- Abstract
- Citations (with count)
- References (with count)
- Co-Reads
- Similar Papers
- Mentions
- Graphics
- Table of Contents
- Metrics

**Usage**:
```typescript
import { AbstractSideNav } from '@/components/AbstractSideNav';

<AbstractSideNav
  bibcode={bibcode}
  counts={{
    citations: 42,
    references: 15,
  }}
  activePage="citations"
/>
```

**Source**: `src/components/AbstractSideNav/AbstractSideNav.tsx:1-50`

---

### CitationExporter

**Purpose**: Export citations in various formats.

**Location**: `src/components/CitationExporter/`

**Features**:
- Multiple formats (BibTeX, APA, MLA, Harvard, etc.)
- Custom author cutoff
- Batch export support
- Copy to clipboard
- Download as file
- Preview before export

**Supported Formats**:
- BibTeX
- APA
- MLA
- Chicago
- Harvard
- IEEE
- AASTeX
- Icarus
- MNRAS
- SoPh
- And more...

**Usage**:
```typescript
import { CitationExporter } from '@/components/CitationExporter';

<CitationExporter
  bibcodes={selectedBibcodes}
  defaultFormat="bibtex"
  onExport={handleExport}
/>
```

---

### Libraries

**Purpose**: Manage user paper libraries (collections).

**Location**: `src/components/Libraries/`

**Features**:
- Create/edit/delete libraries
- Add/remove papers
- Share libraries (public/private)
- Library permissions
- Search within library
- Sort and filter
- Export library

**Sub-components**:
- `LibraryList`: List of all libraries
- `LibraryItem`: Individual library display
- `LibraryEditor`: Create/edit form
- `LibraryPaperList`: Papers in library
- `LibraryActions`: Action buttons

**Usage**:
```typescript
import { Libraries } from '@/components/Libraries';

<Libraries
  userId={currentUser.id}
  onSelect={handleLibrarySelect}
/>
```

---

### Orcid Components

**Purpose**: ORCID OAuth integration and profile management.

**Location**: `src/components/Orcid/`

**Components**:

#### OrcidLogin
**Purpose**: ORCID OAuth login button

```typescript
<OrcidLogin
  onSuccess={handleOrcidConnect}
  onError={handleError}
/>
```

#### OrcidProfile
**Purpose**: Display ORCID profile and works

**Features**:
- Show ORCID profile info
- List works from ORCID
- Push/pull work synchronization
- Bulk operations on works

#### OrcidWorksList
**Purpose**: List of works from ORCID with actions

---

### Settings

**Purpose**: User settings and preferences management.

**Location**: `src/components/Settings/`

**Settings Categories**:
1. **Application**: UI preferences, default search settings
2. **Email**: Notification preferences
3. **Password**: Change password
4. **Export**: Data export (libraries, searches)
5. **Delete**: Account deletion
6. **ORCID**: ORCID integration settings
7. **Library Link**: Library sharing settings
8. **Token**: API token management

**Sub-components**:
- `ApplicationSettings`: UI and search preferences
- `EmailSettings`: Email notification toggles
- `PasswordSettings`: Password change form
- `ExportSettings`: Data export options

**Usage**:
```typescript
import { Settings } from '@/components/Settings';

<Settings
  activeTab="application"
  onSave={handleSettingsSave}
/>
```

---

### Layout Components

**Purpose**: Page layout templates with consistent structure.

**Location**: `src/components/Layout/`

#### BaseLayout
**Purpose**: Base layout with nav, footer, and main content

```typescript
<BaseLayout>
  <PageContent />
</BaseLayout>
```

#### SearchLayout
**Purpose**: Layout for search pages (facets + results)

**Features**:
- Left sidebar for facets
- Main content area for results
- Responsive (stacked on mobile)

#### AbstractLayout
**Purpose**: Layout for abstract pages (side nav + content)

**Features**:
- Left sidebar for navigation
- Main content area
- Breadcrumbs
- Related papers sidebar (optional)

---

### NavBar

**Purpose**: Top navigation bar with search and user menu.

**Location**: `src/components/NavBar/NavBar.tsx`

**Features**:
- Logo with app mode selector
- Quick search input
- User menu (logged in)
- Login/Register links (logged out)
- Responsive mobile menu
- Dark mode toggle

**Sub-components**:
- `NavBarMenu`: User dropdown menu
- `AppModeSelector`: Science domain selector
- `QuickSearch`: Condensed search input

**Usage**:
```typescript
import { NavBar } from '@/components/NavBar';

<NavBar
  currentUser={user}
  onSearch={handleQuickSearch}
/>
```

---

## Visualization Components

### Visualizations Directory

**Location**: `src/components/Visualizations/`

#### ResultsGraph
**Purpose**: Visualize search results distribution

**Features**:
- Bar charts (by year, publication, etc.)
- Line charts (citations over time)
- Interactive tooltips
- Zoom and pan
- Export as image

**Technology**: Nivo (built on D3)

#### AuthorNetwork
**Purpose**: Co-author collaboration network

**Features**:
- Force-directed graph
- Node sizing by paper count
- Edge weight by collaboration strength
- Interactive node selection
- Zoom and pan

**Technology**: D3 force simulation

#### PaperNetwork
**Purpose**: Citation network visualization

**Features**:
- Directed graph
- Node = paper, Edge = citation
- Color coding by year/topic
- Interactive exploration

#### ConceptCloud
**Purpose**: Topic/keyword word cloud

**Features**:
- Size by frequency
- Color by category
- Interactive selection
- Responsive sizing

**Technology**: d3-cloud

**Usage**:
```typescript
import { ResultsGraph } from '@/components/Visualizations';

<ResultsGraph
  data={searchResults}
  chartType="bar"
  xAxis="year"
  onBarClick={handleYearFilter}
/>
```

---

## Form Components

### FeedbackForms

**Purpose**: User feedback submission forms.

**Location**: `src/components/FeedbackForms/`

**Form Types**:
- Bug report
- Feature request
- General feedback
- Missing paper report

**Features**:
- React Hook Form validation
- reCAPTCHA v3 integration
- File attachment support
- Email notification on submission

**Usage**:
```typescript
import { FeedbackForm } from '@/components/FeedbackForms';

<FeedbackForm
  type="bug"
  onSubmit={handleFeedbackSubmit}
/>
```

---

### Email Notifications

**Purpose**: Configure email notification preferences.

**Location**: `src/components/EmailNotifications/`

**Features**:
- Toggle notification types
- Set frequency (daily, weekly, monthly)
- Test email sending
- Saved search alerts

---

## Utility Components

### Pagination

**Purpose**: Paginated navigation for lists.

**Location**: `src/components/Pagination/Pagination.tsx`

**Features**:
- Page number buttons
- Previous/Next buttons
- Jump to page input
- Configurable page size
- Total count display
- Responsive (simplified on mobile)

**Usage**:
```typescript
import { Pagination } from '@/components/Pagination';

<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
  pageSize={25}
/>
```

---

### Pager

**Purpose**: Simple previous/next navigation.

**Location**: `src/components/Pager/`

**Usage**:
```typescript
import { Pager } from '@/components/Pager';

<Pager
  hasPrevious={page > 1}
  hasNext={page < totalPages}
  onPrevious={() => setPage(page - 1)}
  onNext={() => setPage(page + 1)}
/>
```

---

### NumFound

**Purpose**: Display total number of search results.

**Location**: `src/components/NumFound/`

**Features**:
- Formatted number display
- Responsive text sizing
- Loading state

**Usage**:
```typescript
import { NumFound } from '@/components/NumFound';

<NumFound count={totalResults} isLoading={isSearching} />
```

---

### Sort

**Purpose**: Sort dropdown for search results.

**Location**: `src/components/Sort/`

**Sort Options**:
- Relevance (score desc)
- Date (newest first)
- Date (oldest first)
- Citation count
- Author count

**Usage**:
```typescript
import { Sort } from '@/components/Sort';

<Sort
  value={currentSort}
  onChange={handleSortChange}
/>
```

---

### HistogramSlider

**Purpose**: Dual-handle range slider with histogram background.

**Location**: `src/components/HistogramSlider/`

**Features**:
- Two handles (min/max)
- Histogram bars in background
- Snap to data points
- Keyboard accessible
- Touch-friendly

**Usage**:
```typescript
import { HistogramSlider } from '@/components/HistogramSlider';

<HistogramSlider
  min={1980}
  max={2025}
  values={[startYear, endYear]}
  histogram={yearCounts}
  onChange={handleYearRangeChange}
/>
```

**Use Case**: Year facet filtering in search

---

### AllAuthorsModal

**Purpose**: Display complete author list with affiliation lookup.

**Location**: `src/components/AllAuthorsModal/`

**Features**:
- Full author list (expanded from truncated view)
- Author affiliation lookup (API call)
- Clickable authors (search)
- Copy author names
- Pagination for long lists

**Usage**:
```typescript
import { AllAuthorsModal } from '@/components/AllAuthorsModal';

<AllAuthorsModal
  authors={allAuthors}
  bibcode={bibcode}
  isOpen={isOpen}
  onClose={onClose}
  onAuthorClick={handleAuthorSearch}
/>
```

---

### CopyButton

**Purpose**: Copy text to clipboard with feedback.

**Location**: `src/components/CopyButton/`

**Features**:
- Click to copy
- Visual feedback (checkmark)
- Tooltip with status
- Accessible

**Usage**:
```typescript
import { CopyButton } from '@/components/CopyButton';

<CopyButton
  text={bibcode}
  label="Copy bibcode"
/>
```

---

### SimpleLink

**Purpose**: Styled Next.js link component.

**Location**: `src/components/SimpleLink/`

**Features**:
- Next.js Link wrapper
- Consistent styling
- External link handling
- Accessibility attributes

**Usage**:
```typescript
import { SimpleLink } from '@/components/SimpleLink';

<SimpleLink href="/search">Search</SimpleLink>
```

---

### Expandable

**Purpose**: Expandable/collapsible content section.

**Location**: `src/components/Expandable/`

**Features**:
- Show more/less toggle
- Smooth transition
- Configurable max height
- Custom trigger text

**Usage**:
```typescript
import { Expandable } from '@/components/Expandable';

<Expandable maxHeight={100} showMoreText="Read more">
  <Text>{longContent}</Text>
</Expandable>
```

---

### Toggler

**Purpose**: Reusable toggle/switch component.

**Location**: `src/components/Toggler/`

**Usage**:
```typescript
import { Toggler } from '@/components/Toggler';

<Toggler
  isChecked={showAbstract}
  onChange={setShowAbstract}
  label="Show abstracts"
/>
```

---

### Tags

**Purpose**: Display and manage keyword/topic tags.

**Location**: `src/components/Tags/`

**Features**:
- Clickable tags (filter/search)
- Removable tags
- Color coding by category
- Responsive wrapping

**Usage**:
```typescript
import { Tags } from '@/components/Tags';

<Tags
  tags={keywords}
  onTagClick={handleKeywordSearch}
  onTagRemove={handleRemoveKeyword}
/>
```

---

### Notification

**Purpose**: Toast-style notifications.

**Location**: `src/components/Notification/`

**Features**:
- Success, error, warning, info types
- Auto-dismiss or manual close
- Positioned (top-right, bottom-left, etc.)
- Stacked notifications

**Usage**:
```typescript
import { useNotification } from '@/components/Notification';

const { showNotification } = useNotification();

showNotification({
  type: 'success',
  message: 'Settings saved successfully',
  duration: 3000,
});
```

---

### TopProgressBar

**Purpose**: Page loading progress indicator.

**Location**: `src/components/TopProgressBar/`

**Features**:
- Automatic on route change
- Customizable color
- Smooth animation

**Implementation**: Uses nprogress library

---

### Metatags

**Purpose**: SEO meta tags and Open Graph tags.

**Location**: `src/components/Metatags/`

**Features**:
- Dynamic title and description
- Open Graph tags
- Twitter Card tags
- Canonical URLs
- JSON-LD structured data

**Usage**:
```typescript
import { Metatags } from '@/components/Metatags';

<Metatags
  title="Search Results - Science Explorer"
  description="Search scientific research papers"
  image="/og-image.png"
  url="/search"
/>
```

---

## Component Patterns

### Accessibility

All components follow accessibility best practices:

1. **Semantic HTML**: Use proper HTML elements
2. **ARIA Attributes**: `aria-label`, `aria-describedby`, etc.
3. **Keyboard Navigation**: Full keyboard support
4. **Focus Management**: Proper focus indicators
5. **Screen Reader**: Screen reader friendly

**Example**:
```typescript
<IconButton
  icon={<SearchIcon />}
  aria-label="Search"
  onClick={handleSearch}
/>
```

### Responsive Design

Components use Chakra UI's responsive props:

```typescript
<Box
  width={{ base: '100%', md: '50%', lg: '33.33%' }}
  p={{ base: 2, md: 4 }}
>
  Content
</Box>
```

**Breakpoints**:
- `base`: 0px (mobile)
- `sm`: 480px
- `md`: 768px (tablet)
- `lg`: 992px (desktop)
- `xl`: 1280px
- `2xl`: 1536px

### Error Boundaries

Critical components are wrapped with error boundaries:

```typescript
import { withErrorBoundary } from '@/hocs/withErrorBoundary';

export const SearchBar = withErrorBoundary(SearchBarComponent, {
  fallback: <SearchBarErrorFallback />,
});
```

### Loading States

Components show loading states during async operations:

```typescript
{isLoading ? (
  <Spinner size="lg" />
) : (
  <ContentComponent data={data} />
)}
```

### Performance Optimization

1. **Memoization**: Use `useMemo` and `useCallback`
2. **Code Splitting**: Dynamic imports for heavy components
3. **Virtualization**: For long lists (react-window)
4. **Lazy Loading**: Images and heavy content

**Example**:
```typescript
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Spinner />,
  ssr: false,
});
```

## Component Testing

### Test Structure

```typescript
// SearchBar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('renders input field', () => {
    render(<SearchBar />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls onSubmit when form submitted', () => {
    const onSubmit = vi.fn();
    render(<SearchBar onSubmit={onSubmit} />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'test query' }
    });
    fireEvent.submit(screen.getByRole('textbox'));

    expect(onSubmit).toHaveBeenCalledWith('test query');
  });
});
```

### Test Location

Tests are colocated with components:
```
SearchBar/
├── SearchBar.tsx
├── SearchBar.test.tsx
├── index.ts
└── types.ts
```

## Component Directory Structure

```
components/
├── SearchBar/
│   ├── SearchBar.tsx          # Main component
│   ├── SearchInput.tsx        # Sub-component
│   ├── QuickFields.tsx        # Sub-component
│   ├── searchInputReducer.ts # State reducer
│   ├── index.ts               # Public exports
│   ├── types.ts               # Type definitions
│   └── __tests__/             # Tests
│       └── SearchBar.test.tsx
├── ResultList/
│   ├── ...
└── ...
```

## Adding New Components

### Checklist

1. [ ] Create component directory
2. [ ] Define TypeScript interface for props
3. [ ] Implement component with proper typing
4. [ ] Add accessibility attributes
5. [ ] Make responsive
6. [ ] Add error handling
7. [ ] Write tests
8. [ ] Export from index.ts
9. [ ] Document in this file
10. [ ] Add Storybook story (if applicable)

### Template

```typescript
// NewComponent.tsx
import { Box } from '@chakra-ui/react';

interface INewComponentProps {
  title: string;
  onAction: () => void;
}

export const NewComponent: React.FC<INewComponentProps> = ({
  title,
  onAction,
}) => {
  return (
    <Box>
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </Box>
  );
};

NewComponent.displayName = 'NewComponent';
```

---

## Summary

The Science Explorer component library provides:
- **56+ reusable components** for building scientific research UIs
- **Consistent patterns** following TypeScript and React best practices
- **Accessibility-first** design with ARIA and keyboard support
- **Responsive design** with Chakra UI
- **Performance-optimized** with memoization and code splitting
- **Well-tested** with comprehensive test coverage

For implementation details of specific components, refer to their source files in `src/components/`.

---

**Last Updated**: 2025-11-17

**Related Documentation**:
- [Style Guide](STYLE_GUIDE.md)
- [State Management](STATE_MANAGEMENT.md)
- [Architecture](ARCHITECTURE.md)
