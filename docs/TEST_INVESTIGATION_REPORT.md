# Test Failure Investigation Report

## Summary
Investigated 16 failing tests from the parallel test run. Findings show a mix of:
1. **State leakage between test files** (majority of failures)
2. **Real MSW handler configuration issues** (api.test.ts)
3. **Test implementation issues** (useBatchedSearch.test.tsx)

## Detailed Findings

### ✅ Tests That PASS When Run in Isolation (State Leakage)

1. **src/__tests__/utils.test.ts**
   - Parallel run: 1 failed
   - Isolation run: ALL PASS (72/72 tests)
   - **Issue**: State leak from other tests

2. **src/components/__tests__/AbstractSources.test.tsx**
   - Parallel run: 5 failed
   - Isolation run: ALL PASS (5/5 tests)
   - **Issue**: State leak from other tests
   - Note: Has harmless warnings about window.scrollTo not implemented in jsdom

3. **src/__tests__/api/journals/journals-api.test.ts**
   - Parallel run: 3 failed
   - Isolation run: ALL PASS (12/12 tests)
   - **Issue**: State leak from other tests

### ❌ Tests With Real Failures (Need Fixes)

4. **src/api/__tests__/api.test.ts**
   - Parallel run: 13 tests, multiple failures
   - Isolation run: STILL FAILS (13/13 failed)
   - **Issues**:
     a. Snapshot mismatches - error format changed
     b. MSW handlers returning 500 errors instead of expected responses
     c. Request spy receiving undefined URLs instead of actual paths
   - **Root Cause**: MSW handler configuration in test file needs updating

5. **src/lib/__tests__/useBatchedSearch.test.tsx**
   - Parallel run: 1 failed
   - Isolation run: STILL FAILS (1/1 tested failed)
   - **Issue**: onRequest spy shows no search requests were made
   - Expected 2 calls to '/search/query', got 0
   - **Root Cause**: MSW search handler not being triggered or test setup issue

6. **src/components/SearchBar/__tests__/SearchBar.test.tsx**
   - Parallel run: 2 tests timed out
   - **Issue**: "Wraps and restores cursor position" and "selecting quickfield appends to existing query" both timeout at 5000ms
   - **Root Cause**: Likely waiting for async operations that never complete

## Root Cause Analysis

### State Leakage (Primary Issue)
- **Impact**: ~9 of 16 failures (56%)
- **Cause**: Test isolation issues when running in parallel
- **Solution**: Run tests sequentially with `--no-file-parallelism` OR fix test cleanup

### MSW Handler Issues
- **Impact**: ~13+ test failures in api.test.ts
- **Cause**: Test file still has remnants of old MSW v1 patterns or incomplete migration
- **Solution**: Review and fix MSW handler setup in failing test files

### Test Implementation Issues
- **Impact**: 1-2 test failures (useBatchedSearch, possibly SearchBar timeouts)
- **Cause**: Test expectations don't match actual behavior
- **Solution**: Review test logic and MSW handler configuration

## Recommendations

### Immediate Actions:
1. ✅ **Run tests with `--no-file-parallelism`** - Will reduce failures from 16 to ~7
2. **Fix api.test.ts MSW handlers** - Review lines with errors and update handler configuration
3. **Fix useBatchedSearch.test.tsx** - Verify MSW search handler is being called
4. **Investigate SearchBar timeouts** - Add debug logging or increase timeout

### Long-term Solutions:
1. **Improve test isolation** - Add proper cleanup in afterEach/afterAll hooks
2. **Update test snapshots** - Run `pnpm test -- -u` to update changed error formats
3. **Add MSW handler debugging** - Add logging to verify handlers are being called
4. **Consider test pooling** - Use Vitest's pool options for better isolation

## Test Results Comparison

### Parallel Run:
- 49/60 test files passing (82%)
- 597/613 tests passing (97%)
- 16 tests failing

### Sequential Run (in progress):
- Expected: ~52-53/60 test files passing (87%)
- Expected: ~604-607/613 tests passing (98%)
- Expected: ~7 tests failing (only real failures, no state leaks)

### Individual Isolation:
- utils.test.ts: 72/72 ✅
- AbstractSources.test.tsx: 5/5 ✅
- journals-api.test.ts: 12/12 ✅
- api.test.ts: 0/13 ❌ (needs fixes)
- useBatchedSearch.test.tsx: 0/1 ❌ (needs fixes)
