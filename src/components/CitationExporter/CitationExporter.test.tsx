import { render, screen } from '@testing-library/react';
import { CitationExporter } from './CitationExporter';
import { mockRouter } from '../../mocks/next-router';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChakraProvider } from '@chakra-ui/react';
import { MathJaxContext } from 'better-react-mathjax';
import * as CitationExporterHooks from './useCitationExporter';
import * as ExportFormatsHooks from '@/lib/useExportFormats';

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

// Mock useExportFormats
vi.mock('@/lib/useExportFormats', () => ({
  useExportFormats: vi.fn(() => ({
    isValidFormat: vi.fn(() => true),
    getFormatById: vi.fn(() => ({ name: 'BibTeX' })),
    getFormatOptionById: vi.fn(() => ({ name: 'BibTeX' })), // Added this mock
  })),
}));

// Mock useCitationExporter
vi.mock('./useCitationExporter', () => ({
  useCitationExporter: vi.fn(() => ({
    data: { export: 'mocked export content' },
    state: {
      matches: vi.fn((state) => state === 'idle'),
      context: {
        params: { format: 'bibtex', authorcutoff: [0], maxauthor: [0] }, // Added maxauthor and authorcutoff
        range: [0, 1],
        records: ['mockBibcode'],
      },
      value: 'idle',
    },
    dispatch: vi.fn(),
  })),
}));

// Mock useUser
vi.mock('@/lib/useUser', () => ({
  useUser: vi.fn(() => ({
    user: null,
    isIdle: true,
  })),
}));

// Mock useSession
vi.mock('@/lib/useSession', () => ({
  useSession: vi.fn(() => ({
    login: vi.fn(),
    logout: vi.fn(),
    reset: vi.fn(),
    user: null,
    isIdle: true,
  })),
}));

// Mock useDownloadFile
vi.mock('@/lib/useDownloadFile', () => ({
  useDownloadFile: vi.fn(() => ({
    downloadFile: vi.fn(),
    isDownloading: false,
    cancelDownload: vi.fn(),
  })),
}));

// Mock useSettings
vi.mock('@/lib/useSettings', () => ({
  useSettings: vi.fn(() => ({
    settings: {
      format: 'bibtex',
      authorcutoff: [0],
      maxauthor: [0],
    },
    setSettings: vi.fn(),
    isValidFormatLabel: vi.fn(() => true),
  })),
}));

describe('CitationExporter', () => {
  const queryClient = new QueryClient();

  beforeEach(() => {
    mockRouter.events.off('beforeHistoryChange');
    mockRouter.push.mockClear();
    vi.clearAllMocks();
    // Reset mock implementation for useCitationExporter for each test
    vi.mocked(CitationExporterHooks.useCitationExporter).mockReturnValue({
      data: { export: 'mocked export content' },
      state: {
        matches: vi.fn((state) => state === 'idle'),
        context: {
          params: { format: 'bibtex', authorcutoff: [0], maxauthor: [0] },
          range: [0, 1],
          records: ['mockBibcode'],
        },
        value: 'idle',
      },
      dispatch: vi.fn(),
    });

    vi.mocked(ExportFormatsHooks.useExportFormats).mockReturnValue({
      isValidFormat: vi.fn(() => true),
      getFormatById: vi.fn(() => ({ name: 'BibTeX' })),
      getFormatOptionById: vi.fn(() => ({ name: 'BibTeX' })),
    });
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider>
        <MathJaxContext>{children}</MathJaxContext>
      </ChakraProvider>
    </QueryClientProvider>
  );

  it('should render correctly with default props', () => {
    render(<CitationExporter records={['123']} />, { wrapper: TestWrapper });
    expect(screen.getByText(/Exporting record.*\(total: 1\)/)).toBeInTheDocument();
  });

  it('should call router.push when format changes', () => {
    mockRouter.query = { format: 'ads' };
    vi.mocked(CitationExporterHooks.useCitationExporter).mockReturnValue({
      data: { export: 'mocked export content' },
      state: {
        matches: vi.fn((state) => state === 'idle'),
        context: {
          params: { format: 'bibtex', authorcutoff: [0], maxauthor: [0] },
          range: [0, 1],
          records: ['mockBibcode'],
        },
        value: 'idle',
      },
      dispatch: vi.fn(),
    });

    render(<CitationExporter records={['123']} />, { wrapper: TestWrapper });

    expect(mockRouter.push).toHaveBeenCalledWith(
      {
        pathname: '/',
        query: { format: 'bibtex' },
      },
      null,
      { shallow: true },
    );
  });

  it('should call dispatch with SET_FORMAT and FORCE_SUBMIT when isValidFormat is true on history change', () => {
    mockRouter.asPath = '/new-url/some-format?param=value';
    const { useCitationExporter } = vi.mocked(CitationExporterHooks.useCitationExporter);
    const mockDispatch = vi.fn();
    useCitationExporter.mockReturnValue({
      data: { export: 'mocked export content' },
      state: {
        matches: vi.fn((state) => state === 'idle'),
        context: {
          params: { format: 'bibtex' },
          range: [0, 1],
          records: ['mockBibcode'],
        },
        value: 'idle',
      },
      dispatch: mockDispatch,
    });

    const { useExportFormats } = vi.mocked(ExportFormatsHooks.useExportFormats);
    useExportFormats.mockReturnValue({
      isValidFormat: vi.fn((format) => format === 'some-format'),
      getFormatById: vi.fn(() => ({ name: 'BibTeX' })),
      getFormatOptionById: vi.fn(() => ({ name: 'BibTeX' })),
    });

    render(<CitationExporter records={['123']} />, { wrapper: TestWrapper });

    const beforePopStateCallback = mockRouter.beforePopState.mock.calls[0][0];
    const result = beforePopStateCallback({ as: '/new-url/some-format' });

    expect(result).toBe(false);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_FORMAT', payload: 'some-format' });
    expect(mockDispatch).toHaveBeenCalledWith('FORCE_SUBMIT');
  });

  it('should call dispatch with default format and FORCE_SUBMIT when isValidFormat is false on history change', () => {
    mockRouter.asPath = '/new-url/invalid-format?param=value';
    const { useCitationExporter } = vi.mocked(CitationExporterHooks.useCitationExporter);
    const mockDispatch = vi.fn();
    useCitationExporter.mockReturnValue({
      data: { export: 'mocked export content' },
      state: {
        matches: vi.fn((state) => state === 'idle'),
        context: {
          params: { format: 'bibtex' },
          range: [0, 1],
          records: ['mockBibcode'],
        },
        value: 'idle',
      },
      dispatch: mockDispatch,
    });

    const { useExportFormats } = vi.mocked(ExportFormatsHooks.useExportFormats);
    useExportFormats.mockReturnValue({
      isValidFormat: vi.fn(() => false),
      getFormatById: vi.fn(() => ({ name: 'BibTeX' })),
      getFormatOptionById: vi.fn(() => ({ name: 'BibTeX' })),
    });

    render(<CitationExporter records={['123']} />, { wrapper: TestWrapper });

    const beforePopStateCallback = mockRouter.beforePopState.mock.calls[0][0];
    const result = beforePopStateCallback({ as: '/new-url/invalid-format' });

    expect(result).toBe(true);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_FORMAT', payload: 'bibtex' });
    expect(mockDispatch).toHaveBeenCalledWith('FORCE_SUBMIT');
  });
});
