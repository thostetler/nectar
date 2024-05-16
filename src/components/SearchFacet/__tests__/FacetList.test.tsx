import { SearchFacetID } from '@/components/SearchFacet/types';
import userEvent from '@testing-library/user-event';
import { FacetStoreProvider } from '@/components/SearchFacet/store/FacetStore';
import { test, vi } from 'vitest';
import { FacetList } from '@/components/SearchFacet/FacetList';
import { DefaultProviders } from '@/test-utils';
import { render } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import { ISearchFacetModalProps } from '@/components/SearchFacet/SearchFacetModal';

const setup = (id?: SearchFacetID) => {
  const user = userEvent.setup();
  const result = render(<FacetList />, {
    wrapper: ({ children }) => (
      <DefaultProviders options={{}}>
        <FacetStoreProvider facetId={id ?? 'author'}>{children}</FacetStoreProvider>
      </DefaultProviders>
    ),
  });
  return { ...result, user };
};

// mock the modal, so we don't have to deal with portals
vi.mock('@/components/SearchFacet/SearchFacetModal/SearchFacetModal', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import('@/components/SearchFacet/SearchFacetModal/SearchFacetModal')>()),
    SearchFacetModal: ({ children }: ISearchFacetModalProps) => <>{children}</>,
  };
});

test('lksdjf', async () => {
  const { debug, user, findByTestId } = setup('author');
  await waitFor(() => findByTestId('search-facet-root-list'));
  await user.click(await findByTestId('search-facet-load-more-btn'));
  debug();
});
