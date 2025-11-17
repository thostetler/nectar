# Search Functionality Documentation

## Overview

The search system is the core feature of Science Explorer, enabling users to discover scientific papers using advanced Lucene query syntax with faceted filtering, sorting, and multiple visualization options.

## Search Flow

```
User Input (SearchBar)
    ↓
Query Building (Lucene Syntax)
    ↓
Zustand Store (query state)
    ↓
Submit Action
    ↓
React Query (useSearchQuery)
    ↓
API Request (POST /v1/search/query)
    ↓
ADS Backend
    ↓
Response with Results + Facets
    ↓
Cache (React Query + Axios)
    ↓
UI Update (ResultList, Facets, Stats)
```

## Query Syntax

### Lucene Query Parser

**Location**: `src/query.ts`

**Purpose**: Parse and validate Lucene query syntax.

**Supported Syntax**:
```
Basic Search:
  black holes
  "dark matter"

Field Search:
  author:"Einstein, A."
  year:2020
  title:"gravitational waves"

Boolean Operators:
  black AND holes
  stars OR planets
  galaxies NOT spiral

Wildcards:
  author:Hawking*
  title:exoplanet?

Ranges:
  year:[2010 TO 2020]
  citation_count:[100 TO *]

Grouping:
  (black OR dark) AND matter
  author:"Einstein" AND year:[1900 TO 1920]

Proximity Search:
  "quantum gravity"~10

Boosting:
  black holes^2 stars
```

**Parser Implementation**:
```typescript
// src/query.ts
import Lucene from 'lucene';

export const parseQuery = (query: string): ParsedQuery => {
  try {
    return Lucene.parse(query);
  } catch (error) {
    throw new QuerySyntaxError('Invalid query syntax', error);
  }
};

export const validateQuery = (query: string): boolean => {
  try {
    parseQuery(query);
    return true;
  } catch (error) {
    return false;
  }
};
```

### Query Builder

**Location**: `src/query-builder.ts`

**Purpose**: Programmatically build queries from UI components.

**Usage**:
```typescript
import { QueryBuilder } from '@/query-builder';

const query = new QueryBuilder()
  .author('Einstein, A.')
  .year(1905, 1920)
  .keyword('relativity')
  .build();
// Result: author:"Einstein, A." AND year:[1905 TO 1920] AND keyword:relativity
```

## Search Parameters

### IADSApiSearchParams

**Location**: `src/api/search/types.ts`

**Full Interface**:
```typescript
interface IADSApiSearchParams {
  // Query
  q: string;                    // Lucene query string

  // Fields to return
  fl?: string[];                // Field list

  // Pagination
  start?: number;               // Offset (default: 0)
  rows?: number;                // Results per page (default: 25)

  // Sorting
  sort?: string;                // Sort field and direction

  // Filtering
  fq?: string[];                // Filter queries (facet filters)

  // Faceting
  facet?: boolean;              // Include facets
  'facet.field'?: string[];     // Facet fields
  'facet.limit'?: number;       // Max facet values
  'facet.mincount'?: number;    // Min count for facet
  'facet.offset'?: number;      // Facet pagination

  // Highlighting
  hl?: boolean;                 // Highlight matches
  'hl.fl'?: string;             // Fields to highlight
  'hl.snippets'?: number;       // Snippets per field
  'hl.fragsize'?: number;       // Snippet size
}
```

### Default Parameters

**Location**: `src/store/slices/search.ts:8-31`

```typescript
const defaultQueryParams: IADSApiSearchParams = {
  q: '',
  fl: [
    'bibcode',
    'title',
    'author',
    '[fields author=10]',       // Limit to 10 authors
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
  sort: 'score desc',           // Relevance
  start: 0,
  rows: 25,
};
```

## Field List (fl parameter)

### Available Fields

**Document Metadata**:
- `bibcode`: Unique identifier
- `title`: Paper title
- `author`: Author list
- `pubdate`: Publication date
- `doi`: DOI identifier
- `arxiv_class`: ArXiv category

**Bibliographic**:
- `bibstem`: Journal abbreviation
- `volume`, `page`, `issue`: Journal info
- `pub`: Full publication name

**Metrics**:
- `citation_count`: Number of citations
- `citation_count_norm`: Normalized citations
- `reference_count`: Number of references
- `read_count`: Number of reads

**Content**:
- `abstract`: Paper abstract
- `keyword`: Keywords
- `ack`: Acknowledgments
- `body`: Full text (if available)

**Source**:
- `property`: Document properties
- `data`: Associated data
- `esources`: Electronic sources

**Special Syntax**:
```typescript
fl: [
  '[fields author=10]',        // Limit authors to 10
  '[citations]',                // Include citation data
  'author:10',                  // Alternative author limit
]
```

## Sorting

### Sort Options

**Available Sorts**:
```typescript
type SortOption =
  | 'score desc'                // Relevance (default)
  | 'date desc'                 // Newest first
  | 'date asc'                  // Oldest first
  | 'citation_count desc'       // Most cited
  | 'citation_count_norm desc'  // Normalized citations
  | 'read_count desc'           // Most read
  | 'first_author asc'          // Alphabetical by first author
  | 'bibcode desc';             // By bibcode
```

**Multi-field Sort**:
```typescript
sort: 'citation_count desc, date desc'
```

**Component**: `src/components/Sort/`

## Faceted Filtering

### Facet System

**Purpose**: Filter results by categorical values (author, year, journal, etc.)

**Location**: `src/components/SearchFacet/`

### Available Facets

1. **Author** (`author_facet`)
   - Facet field: `author_facet`
   - Display: Author names
   - Logic: Single (limit), Multiple (and/or/exclude)

2. **Year** (`year`)
   - Facet field: `year`
   - Display: Histogram slider
   - Logic: Range filter

3. **Publication** (`bibstem_facet`)
   - Facet field: `bibstem_facet`
   - Display: Journal abbreviations
   - Logic: Single/multiple selection

4. **Keywords** (`keyword_facet`)
   - Facet field: `keyword_facet`
   - Display: Topic keywords
   - Logic: Single/multiple selection

5. **Database** (`database`)
   - Values: astronomy, physics, general
   - Logic: Single/multiple selection

6. **Object Type** (`object_type`)
   - Values: star, galaxy, nebula, etc.
   - Logic: Single/multiple selection

7. **Document Type** (`doctype`)
   - Values: article, proceedings, book, etc.
   - Logic: Single/multiple selection

8. **Data Sources** (`data_facet`)
   - Values: CDS, NED, SIMBAD, etc.
   - Logic: Single/multiple selection

### Facet Configuration

**Location**: `src/components/SearchFacet/config.ts`

```typescript
export const facetConfig: Record<SearchFacetID, IFacetConfig> = {
  author: {
    field: 'author_facet',
    label: 'Authors',
    logic: {
      single: ['limit'],
      multiple: ['and', 'or', 'exclude'],
    },
    defaultOpen: true,
  },
  year: {
    field: 'year',
    label: 'Year',
    logic: {
      single: ['range'],
      multiple: [],
    },
    component: 'HistogramSlider',
  },
  // ... more facets
};
```

### Facet Logic

**Filter Query (fq) Generation**:

**Single Selection (Limit)**:
```typescript
// User selects: author="Einstein, A."
fq: ['author:"Einstein, A."']
```

**Multiple AND**:
```typescript
// User selects: author="Einstein" AND author="Bohr"
fq: ['author:("Einstein, A." AND "Bohr, N.")']
```

**Multiple OR**:
```typescript
// User selects: author="Einstein" OR author="Bohr"
fq: ['author:("Einstein, A." OR "Bohr, N.")']
```

**Exclude**:
```typescript
// User selects: NOT author="Einstein"
fq: ['-author:"Einstein, A."']
```

**Year Range**:
```typescript
// User selects: 2010-2020
fq: ['year:[2010 TO 2020]']
```

**Implementation**: `src/components/SearchFacet/helpers.ts`

### Facet State Management

**Zustand Store**: `src/store/slices/settings.ts`

```typescript
interface ISearchFacetSettings {
  order: SearchFacetID[];        // Display order (drag-drop)
  state: Record<SearchFacetID, {
    expanded: boolean;            // Open/closed
    ignored: string[];            // Hidden values
  }>;
  open: SearchFacetID[];          // Currently open
  ignored: SearchFacetID[];       // Hidden facets
}
```

**Persistence**: Saved to localStorage

## Search Results

### Result Display

**Component**: `src/components/ResultList/`

**Result Item Fields**:
- Bibcode
- Title
- Authors (truncated to 10)
- Publication date
- Journal
- Citation count
- Reference count
- Abstract preview
- Action buttons (save, export, etc.)

### Pagination

**Parameters**:
- `start`: Offset (e.g., 0, 25, 50)
- `rows`: Results per page (25, 50, 100)

**Total Pages**: `Math.ceil(numFound / rows)`

**Component**: `src/components/Pagination/`

**State**: Stored in URL query params

## Search Highlighting

### Purpose

Highlight search terms in results (title, abstract, etc.)

### Configuration

```typescript
{
  hl: true,
  'hl.fl': 'title,abstract',
  'hl.snippets': 3,
  'hl.fragsize': 100,
}
```

### Response

```typescript
{
  highlighting: {
    'bibcode1': {
      title: ['<em>black holes</em> in the universe'],
      abstract: ['...study of <em>black holes</em>...'],
    },
  },
}
```

### Display

**Component**: `src/components/ResultList/`

Wraps highlighted terms in `<mark>` tags.

## Search Visualizations

### Available Views

**Location**: `src/pages/search/`

1. **Results** (`/search`)
   - Standard list view
   - Component: `ResultList`

2. **Metrics** (`/search/metrics`)
   - Citation metrics for result set
   - Component: `Visualizations/MetricsView`

3. **Overview** (`/search/overview`)
   - Summary statistics
   - Component: `Visualizations/OverviewView`

4. **Results Graph** (`/search/results_graph`)
   - Bar/line charts (year, publication, etc.)
   - Technology: Nivo charts

5. **Author Network** (`/search/author_network`)
   - Co-author collaboration network
   - Technology: D3 force layout

6. **Paper Network** (`/search/paper_network`)
   - Citation network
   - Technology: D3 force layout

7. **Concept Cloud** (`/search/concept_cloud`)
   - Keyword/topic word cloud
   - Technology: d3-cloud

### Visualization Data

**Endpoint**: `POST /v1/vis/*`

**Response**: Network or aggregation data optimized for visualization.

## Search State

### Query Flow

**Three Query States** (in Zustand):

1. **query**: Current/editing query (changes as user types)
2. **latestQuery**: Submitted query (active search)
3. **prevQuery**: Previous query (for back navigation)

**Actions**:
```typescript
// Update query (doesn't trigger search)
updateQuery({ q: 'new value' });

// Submit query (triggers search)
submitQuery(); // Moves query → latestQuery

// Swap queries (back button)
swapQueries(); // Swaps latestQuery ↔ prevQuery
```

### URL Sync

**Pattern**: `/search?q=...&sort=...&start=...`

**Implementation**: `src/pages/search/index.tsx`

```typescript
// Read from URL
const router = useRouter();
const queryFromUrl = router.query.q as string;

// Update URL on query change
useEffect(() => {
  router.push({
    pathname: '/search',
    query: { ...router.query, q: currentQuery },
  }, undefined, { shallow: true });
}, [currentQuery]);
```

**Benefits**:
- Shareable search URLs
- Browser back/forward support
- Bookmark-friendly

## Quick Fields

### Purpose

Quickly add field-specific search terms without typing syntax.

**Location**: `src/components/SearchBar/QuickFields.tsx`

### Available Fields

1. **Author**: `author:"Last, First"`
2. **Year**: `year:YYYY` or `year:[YYYY TO YYYY]`
3. **Publication**: `bibstem:ApJ`
4. **Title**: `title:"search terms"`
5. **Abstract**: `abstract:"search terms"`

### UI Flow

```
User clicks "Author" button
    ↓
Modal opens with author input
    ↓
User types "Einstein"
    ↓
Autocomplete suggests "Einstein, A."
    ↓
User selects
    ↓
Query updated: author:"Einstein, A."
```

## Typeahead

### Purpose

Autocomplete suggestions for search input.

**Location**: `src/components/SearchBar/TypeaheadDropdown.tsx`

### Suggestion Types

1. **Journals**
   - API: `/v1/journals/summary/:query`
   - Shows: Full journal names
   - On select: Adds `bibstem:XXX`

2. **Keywords**
   - Source: Common astronomy keywords
   - On select: Adds to query

3. **UAT (Unified Astronomy Thesaurus)**
   - API: `/v1/uat/autocomplete/:query`
   - Shows: Astronomy concepts
   - On select: Adds keyword

### Implementation

**Library**: Downshift (accessible autocomplete)

**Debouncing**: 300ms

**Max Results**: 10

## Search Examples

### Component

**Location**: `src/components/SearchExamples/`

**Purpose**: Show example searches to help users learn syntax.

**Examples**:
```typescript
const examples = [
  {
    title: 'Find papers by author',
    query: 'author:"Einstein, A."',
  },
  {
    title: 'Find papers in a year range',
    query: 'black holes year:[2010 TO 2020]',
  },
  {
    title: 'Find highly cited papers',
    query: 'exoplanets citation_count:[100 TO *]',
  },
  // ... more examples
];
```

## Advanced Features

### Saved Searches

**Purpose**: Save search queries for later use or email alerts.

**Storage**: User account (requires login)

**Features**:
- Save query + facet filters
- Name and description
- Email notifications (daily, weekly, monthly)
- Quick access from user menu

**API**: `/v1/user/searches`

### Search History

**Storage**: Browser localStorage

**Limit**: Last 20 searches

**Features**:
- Quick re-run
- Delete individual items
- Clear all

**Component**: `src/components/SearchBar/SearchHistory.tsx`

### Export Search Results

**Purpose**: Export bibcodes or full records.

**Formats**:
- Plain text (bibcodes only)
- CSV
- JSON
- XML
- BibTeX (via Citation Exporter)

**Location**: `/search/exportcitation/:format`

## Performance Optimizations

### Caching

1. **React Query Cache**: 5-minute stale time
2. **Axios Cache**: IndexedDB storage, search endpoints only
3. **Browser Cache**: Static assets

### Debouncing

- Search input: 500ms
- Typeahead: 300ms
- Facet filters: None (instant)

### Code Splitting

```typescript
// Heavy visualizations loaded on demand
const PaperNetwork = dynamic(() => import('@/components/Visualizations/PaperNetwork'), {
  ssr: false,
  loading: () => <Spinner />,
});
```

### Virtualization

For large result lists (100+ items):
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';
```

## Testing

### Search Query Tests

```typescript
import { parseQuery, validateQuery } from '@/query';

describe('Query Parser', () => {
  it('parses basic query', () => {
    const result = parseQuery('black holes');
    expect(result.term).toBe('black holes');
  });

  it('validates complex query', () => {
    expect(validateQuery('author:"Einstein" AND year:[1900 TO 1920]')).toBe(true);
    expect(validateQuery('invalid query [[[')).toBe(false);
  });
});
```

### API Tests

```typescript
import { searchApi } from '@/api/search';

describe('Search API', () => {
  it('fetches results', async () => {
    const result = await searchApi.query({ q: 'test', rows: 10 });
    expect(result.response.docs).toHaveLength(10);
  });
});
```

## Troubleshooting

### Common Issues

1. **No Results**
   - Check query syntax
   - Try broader terms
   - Remove filters

2. **Slow Search**
   - Reduce result count (`rows`)
   - Simplify query
   - Check network

3. **Unexpected Results**
   - Check active filters (facets)
   - Verify sort order
   - Review query syntax

---

**Last Updated**: 2025-11-17

**Related Documentation**:
- [API](API.md)
- [Components](COMPONENTS.md)
- [State Management](STATE_MANAGEMENT.md)
