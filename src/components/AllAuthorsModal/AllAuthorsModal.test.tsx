import { render, screen, fireEvent } from '@testing-library/react';
import { AllAuthorsModal } from './AllAuthorsModal';
import { mockRouter } from '../../mocks/next-router';
import { ReactNode } from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MathJaxContext } from 'better-react-mathjax';

let isOpen = false;
const onClose = vi.fn(() => {
  isOpen = false;
});
const onOpen = vi.fn(() => {
  isOpen = true;
});

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

// Mock @chakra-ui/react
vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useDisclosure: () => ({
      isOpen,
      onOpen,
      onClose,
    }),
  };
});

// Mock the sendGTMEvent function
vi.mock('@next/third-parties/google', () => ({
  sendGTMEvent: vi.fn(),
}));

// Mock the useGetAffiliations hook
vi.mock('@/api/search/search', () => ({
  useGetAffiliations: vi.fn(() => ({
    data: {
      docs: [
        {
          title: ['Test Title'],
          author: ['Author One', 'Author Two'],
          aff: ['Affiliation One', 'Affiliation Two'],
          orcid_pub: ['orcid1', 'orcid2'],
        },
      ],
    },
    isSuccess: true,
    isFetching: false,
  })),
}));

describe('AllAuthorsModal', () => {
  beforeEach(() => {
    mockRouter.events.off('beforeHistoryChange');
    isOpen = false;
    onClose.mockClear();
    onOpen.mockClear();
  });

  const TestComponent = ({ children }: { children: ReactNode }) => <MathJaxContext>{children}</MathJaxContext>;
  it('should render the modal when the button is clicked', () => {
    render(
      <TestComponent>
        <AllAuthorsModal bibcode="2021arXiv210713586A" label="Show Authors" />
      </TestComponent>,
    );

    const button = screen.getByText('Show Authors');
    fireEvent.click(button);

    expect(onOpen).toHaveBeenCalled();
  });

  it('should close the modal on history change', () => {
    isOpen = true;
    render(
      <TestComponent>
        <AllAuthorsModal bibcode="2021arXiv210713586A" label="Show Authors" />
      </TestComponent>,
    );

    // Simulate history change
    mockRouter.events.emit('beforeHistoryChange', '/new-url');

    expect(onClose).toHaveBeenCalled();
  });
});
