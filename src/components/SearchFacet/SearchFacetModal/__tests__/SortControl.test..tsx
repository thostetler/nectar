import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { FacetStoreProvider } from '@/components/SearchFacet/store/FacetStore';
import { test, vi } from 'vitest';
import { DefaultProviders } from '@/test-utils';
import { ISortControlProps, SortControl } from '@/components/SearchFacet/SearchFacetModal/SortControl';

const setup = (props: ISortControlProps) => {
  const user = userEvent.setup();
  const result = render(<SortControl {...props} />, {
    wrapper: ({ children }) => (
      <DefaultProviders options={{}}>
        <FacetStoreProvider facetId={'author'}>{children}</FacetStoreProvider>
      </DefaultProviders>
    ),
  });
  return { ...result, user };
};

test('Calls onSortChange when sort value changes', async () => {
  const props: ISortControlProps = {
    onSortChange: vi.fn(),
    sort: ['count', 'asc'],
    onlyCount: false,
  };
  const { getByTestId, user } = setup(props);
  const select = getByTestId('search-facet-sort-control');

  await user.selectOptions(select, 'index');
  expect(props.onSortChange).toHaveBeenCalledWith(['index', 'asc']);
});

test('Toggles sort direction when button is clicked', async () => {
  const props: ISortControlProps = {
    onSortChange: vi.fn(),
    sort: ['count', 'asc'],
    onlyCount: false,
  };
  const { getByRole, user } = setup(props);
  const toggleButton = getByRole('button', { name: /sort asc/i });

  await user.click(toggleButton);
  expect(props.onSortChange).toHaveBeenCalledWith(['count', 'desc']);
});

test('Displays correct sort value and direction', () => {
  const props: ISortControlProps = {
    onSortChange: vi.fn(),
    sort: ['index', 'desc'],
    onlyCount: false,
  };
  const { getByTestId, getByRole } = setup(props);
  const select = getByTestId('search-facet-sort-control') as HTMLSelectElement;
  const toggleButton = getByRole('button', { name: /sort desc/i });

  expect(select.value).toBe('index');
  expect(toggleButton).toBeInTheDocument();
});

test('Displays only count option when onlyCount is true', () => {
  const props: ISortControlProps = {
    onSortChange: vi.fn(),
    sort: ['count', 'asc'],
    onlyCount: true,
  };
  const { getByTestId } = setup(props);
  const select = getByTestId('search-facet-sort-control') as HTMLSelectElement;

  expect(select.options.length).toBe(1);
  expect(select.options[0].value).toBe('count');
});
