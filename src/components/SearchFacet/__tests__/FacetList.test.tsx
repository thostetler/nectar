import { SearchFacetID } from '@/components/SearchFacet/types';
import userEvent from '@testing-library/user-event';
import { FacetStoreProvider } from '@/components/SearchFacet/store/FacetStore';
import { expect, test, vi } from 'vitest';
import { FacetList } from '@/components/SearchFacet/FacetList';
import { DefaultProviders } from '@/test-utils';
import { render } from '@testing-library/react';
import { ModalBodyProps, ModalContentProps, ModalFooterProps, ModalHeaderProps, ModalProps } from '@chakra-ui/react';

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

// mock out the Modal* components from Chakra so we don't have to deal with them
vi.mock('@chakra-ui/react', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import('@chakra-ui/react')>()),
    Modal: ({ children }: ModalProps) => <div data-testid="facet-modal">{children}</div>,
    ModalBody: ({ children }: ModalBodyProps) => <div data-testid="facet-modal-body">{children}</div>,
    ModalCloseButton: () => <div data-testid="facet-modal-close-btn" />,
    ModalContent: ({ children }: ModalContentProps) => <div data-testid="facet-modal-content">{children}</div>,
    ModalFooter: ({ children }: ModalFooterProps) => <div data-testid="facet-modal-footer">{children}</div>,
    ModalHeader: ({ children }: ModalHeaderProps) => <div data-testid="facet-modal-header">{children}</div>,
    ModalOverlay: () => <div data-testid="facet-modal-overlay" />,
  };
});

test('FacetList sections all render properly', async () => {
  const { user, findByTestId, getByRole } = setup('author');

  // check the header
  expect(await findByTestId('search-facet-search')).toBeVisible();

  // sort control should be visible
  const sortControl = await findByTestId('search-facet-sort-control');
  expect(sortControl).toBeVisible();

  // change to A-Z sort and confirm the alpha sorter is visible
  await user.selectOptions(sortControl, getByRole('option', { name: 'A-Z' }));
  expect(await findByTestId('search-facet-alpha-sorter')).toBeVisible();
});
