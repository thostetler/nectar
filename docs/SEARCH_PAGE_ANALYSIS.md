# Search Results Page (`/search`) - Analysis & Specification

## 1. Current Page Functionality Overview

### 1.1 Core Purpose
The search results page displays results from the ADS Solr search API, allowing users to:
- Execute and refine searches
- Apply faceted filters (year range, authors, collections, etc.)
- Sort and paginate results
- Select documents for bulk operations
- Export citations and explore visualizations

### 1.2 Component Hierarchy

```
SearchPage
├── <Head> (title)
├── HideOnPrint
│   ├── <form>
│   │   ├── SearchBar (search input)
│   │   ├── NumFound (result count)
│   │   └── FacetFilters (applied filters display)
│   └── histogramContainerRef (portal target)
├── Flex (main layout)
│   ├── SearchFacetFilters (sidebar - conditionally shown)
│   │   ├── YearHistogramSlider (dynamic, has error boundary)
│   │   └── SearchFacets (dynamic, NO error boundary)
│   └── Box (results container)
│       ├── ListActions (sort, bulk actions, explore)
│       ├── ItemsSkeleton (loading state)
│       ├── PartialResultsWarning
│       ├── SimpleResultList
│       │   └── Item[] (individual results)
│       └── Pagination
├── SearchErrorAlert (error state - outside main flow)
└── AddToLibraryModal
```

### 1.3 Data Flow

| Data Source | Hook | Purpose |
|-------------|------|---------|
| Main search results | `useSearch(searchParams)` | Primary query results |
| Facet counts | `useGetSearchFacetCounts()` | Filter options (in child components) |
| Search stats | `useGetSearchStats()` | Citation stats (in child components) |
| Highlights | `useGetHighlights()` | Keyword highlighting (in SimpleResultList) |
| Export citations | `useGetExportCitation()` | Default citation format (in SimpleResultList) |

### 1.4 State Management

| Store Slice | Purpose |
|-------------|---------|
| `query` / `latestQuery` | Current and submitted search parameters |
| `numPerPage` | Results per page (persisted) |
| `docs.selected` | Selected bibcodes for bulk operations |
| `settings.searchFacets` | Facet visibility, order, expansion states |
| `showHighlights` | Toggle keyword highlighting |

---

## 2. Areas for Improvement

### 2.1 Error Handling Issues

#### 2.1.1 Error Position/Visibility (HIGH)
**Location:** `src/pages/search/index.tsx:287-291`

```tsx
{isError ? (
  <Center aria-labelledby="search-form-title" mt={4}>
    <SearchErrorAlert error={error} />
  </Center>
) : null}
```

**Issues:**
- Error alert is rendered **after** the entire page content, making it easy to miss
- When search fails, the user sees the skeleton loader stop and an empty results area with no obvious error indication
- The error message appears at the bottom of a potentially long page

**Recommendation:** Position error prominently (replace results area when in error state), not appended at bottom.

---

#### 2.1.2 Missing Error Boundaries on Key Components (HIGH)

| Component | Has Error Boundary | Risk Level |
|-----------|-------------------|------------|
| `YearHistogramSlider` | Yes | Low |
| `SearchFacets` | No | **High** |
| `SimpleResultList` | No | **High** |
| `ListActions` | No | Medium |
| `Pagination` | No | Low |
| `SearchBar` | No | Medium |

**Critical Gaps:**
- `SearchFacets` contains complex DnD logic and multiple data fetches - a crash here breaks the entire page
- `SimpleResultList` iterates over potentially malformed API data - a single bad record crashes all results
- `ListActions` has multiple side-effect hooks (`useVaultBigQuerySearch`) that could throw

---

#### 2.1.3 Inconsistent Error Patterns in Subcomponents (MEDIUM)

**`FacetList.tsx:152-158`** - Error handling via callback:
```tsx
if (isError) {
  return (
    <Center data-testid="search-facet-error">
      <Text>Error loading results</Text>
    </Center>
  );
}
```

**Issues:**
- Error message is minimal ("Error loading results") - no context, no retry option
- Error propagates via `onError` callback which only sets `hasError` state to show an icon
- No centralized error tracking (the global error handler isn't invoked)

---

#### 2.1.4 Silent Failures (MEDIUM)

**`SimpleResultList.tsx:61-70`** - Citation data processing:
```tsx
try {
  if (!!citationData) {
    citationData.export.split('\n').forEach((c, index) => {
      citationSet.set(bibcodes[index], c);
    });
  }
} catch (err) {
  logger.error({ err }, 'Error processing citation data');
}
```

- Errors are logged but swallowed - user gets no feedback
- If citation data is malformed, the feature silently fails

**`ListActions.tsx:103-110`** - Vault query error:
```tsx
if (error) {
  toast({
    status: 'error',
    title: 'Error!',
    description: 'Error fetching selected papers',
  });
  setPath(null);
}
```
- Uses toast which may not be visible if user scrolled
- No retry mechanism offered

---

### 2.2 Efficiency Issues

#### 2.2.1 Multiple Redundant Data Fetches (MEDIUM)

The page triggers several API calls that could be consolidated:

1. Main search: `useSearch(searchParams)`
2. Partial results check: `useSearch(params, { select: partialResults })` - **Same query, different selector**
3. Facet counts: `useGetSearchFacetCounts()` (in `YearHistogramSlider`)
4. Facet counts again: Multiple `useGetFacetData()` calls in `SearchFacets` children

**`PartialResultsWarning` component (`index.tsx:477-496`):**
```tsx
const { data: isPartialResults, isError } = useSearch(params, {
  select: (data) => data.responseHeader?.partialResults,
});
```
This is redundant - the parent `useSearch` already has this data. Could simply pass prop from parent.

---

#### 2.2.2 Store Selector Inefficiencies (LOW)

**`index.tsx:81-93`:**
```tsx
const selectors = {
  setQuery: (state: AppState) => state.setQuery,
  // ... many selectors
};

// Each triggers separate subscription
const setQuery = useStore(selectors.setQuery);
const updateQuery = useStore(selectors.updateQuery);
const submitQuery = useStore(selectors.submitQuery);
// ... 8 more useStore calls
```

- 11 separate `useStore` calls on the main page component
- Each creates a separate subscription, triggering re-render checks on every store change

---

#### 2.2.3 Unnecessary Re-renders (MEDIUM)

**`SearchFacets.tsx:392-406`** - Items rebuilt on every render:
```tsx
const visibleItems = useMemo(() => {
  return facetsList.visible.map((facetId) => {
    const facetProps = facetConfig[facetId];
    return (
      <FacetStoreProvider facetId={facetProps.storeId} key={facetProps.storeId}>
        <SearchFacet {...facetProps} onQueryUpdate={onQueryUpdate} ... />
      </FacetStoreProvider>
    );
  });
}, [facetsList.visible, onQueryUpdate, handleVisibilityChange]);
```

- `handleVisibilityChange` is recreated on every render (no `useCallback`)
- This invalidates the memoization, causing all facet items to re-render

---

### 2.3 Robustness Issues

#### 2.3.1 Missing Null/Undefined Guards (HIGH)

**`index.tsx:113`:**
```tsx
const numFound = queries.length > 1 ? path<number>(['1', 'response', 'numFound'], last(queries)) : null;
```
- Uses `last(queries)` which can return `undefined`
- `path()` can return `undefined` even when array has items

**`index.tsx:195-199`:**
```tsx
useEffect(() => {
  if (data?.docs.length > 0) {
    setDocs(data.docs.map((d) => d.bibcode));
    // ...
  }
}, [data]);
```
- Missing dependency array items (`setDocs`, `setQuery`, `submitQuery`, `searchParams`)
- Could cause stale closures

---

#### 2.3.2 Race Conditions (MEDIUM)

**`ListActions.tsx:88-111`:**
```tsx
const [path, setPath] = useState<{ path?: string; operator?: Operator }>(null);
const { data, error } = useVaultBigQuerySearch(selected, { enabled: !!path });

useEffect(() => {
  if (data && path) {
    void router.push(...);
    clearSelected();
    setPath(null);
  }
  // ...
}, [data, error, path]);
```

- State is set to `null` after navigation, but React Query cache persists
- If user quickly clicks another action, stale `data` could trigger unintended navigation

---

#### 2.3.3 No Timeout/Retry UI for Long Operations (LOW)

- No indication when searches are taking unusually long
- `PartialResultsWarning` only appears after the fact
- Users may think the app is frozen

---

### 2.4 Component Isolation Issues

#### 2.4.1 Tight Coupling to Global State (MEDIUM)

Components like `ListActions` directly access multiple store slices:
```tsx
const selected = useStore((state) => state.docs.selected ?? []);
const clearSelected = useStore((state) => state.clearSelected);
const { settings } = useSettings({ suspense: false });
// ... more
```

Makes testing difficult and creates hidden dependencies.

---

#### 2.4.2 Portal Usage Without Cleanup (LOW)

**`SearchFacetFilters` (`index.tsx:314-328`):**
```tsx
<Portal appendToParentPortal>
  <Button position="fixed" ... />
</Portal>
```

- Portal renders outside component tree
- No cleanup mechanism if component unmounts unexpectedly

---

## 3. Recommendations Summary

### Priority 1: Error Handling
1. **Wrap `SearchFacets` and `SimpleResultList` with error boundaries** using existing `withErrorBoundary` HOC
2. **Reposition error display** - show prominently in results area, not at bottom
3. **Add recovery actions** - "Retry" buttons on all error states
4. **Integrate global error handler** in FacetList error callbacks

### Priority 2: Component Isolation
1. **Add error boundaries to:**
   - `SearchFacetFilters` (sidebar wrapper)
   - `SimpleResultList` (results container)
   - Individual `Item` components (prevent one bad record from crashing all)
   - `ListActions` (bulk operations)

2. **Create fallback UIs for each boundary** with:
   - Clear error message
   - Retry capability
   - Ability to continue using unaffected parts of page

### Priority 3: Efficiency
1. **Remove redundant `PartialResultsWarning` query** - pass data from parent
2. **Consolidate store selectors** using `useShallow` or single selector returning object
3. **Memoize callbacks** in `SearchFacets` (`handleVisibilityChange`)
4. **Consider virtualization** for large result sets in `SimpleResultList`

### Priority 4: Robustness
1. **Add defensive null checks** especially around API response parsing
2. **Fix exhaustive deps** in useEffect hooks
3. **Add loading timeout indicator** for long-running searches

---

## 4. Questions for Clarification

1. **Error boundary granularity:** Would you prefer one boundary around the entire facets sidebar, or individual boundaries per facet? (Trade-off: isolation vs. complexity)

2. **Error recovery UX:** For search API errors, should we show a full-page error state, or keep the search bar functional so users can modify their query?

3. **Partial results handling:** The current `PartialResultsWarning` is passive. Should we offer an action like "Retry with timeout extension" or "Show first N results"?

4. **Facet error behavior:** When a single facet fails to load, should it collapse and show inline error, or should it be hidden entirely?

5. **Performance targets:** Are there specific performance budgets (e.g., max time to interactive, re-render frequency) you want to optimize toward?
