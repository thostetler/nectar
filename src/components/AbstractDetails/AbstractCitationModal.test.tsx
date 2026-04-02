import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AbstractCitationModal } from './AbstractCitationModal';

vi.mock('@/lib/useSettings', () => ({
  useSettings: vi.fn(),
}));

vi.mock('@/lib/useExportFormats', () => ({
  useExportFormats: vi.fn(),
}));

vi.mock('@/api/export/export', () => ({
  useGetExportCitation: vi.fn(() => ({ data: { export: '@article{test}' }, isLoading: false, isError: false })),
}));

import { useSettings } from '@/lib/useSettings';
import { useExportFormats } from '@/lib/useExportFormats';

const bibtexOption = {
  id: 'bibtex',
  label: 'BibTeX',
  value: 'bibtex',
  type: 'TEXT' as const,
  ext: '.bib',
  route: '/bibtex',
};
const aguOption = { id: 'agu', label: 'AGU', value: 'agu', type: 'TEXT' as const, ext: '.txt', route: '/agu' };
const formatOptions = [bibtexOption, aguOption];

beforeEach(() => {
  vi.mocked(useExportFormats).mockReturnValue({
    formatOptions,
    formatOptionsNoCustom: formatOptions,
    getFormatOptionById: (id: string) => formatOptions.find((o) => o.id === id),
    getFormatOptionByLabel: (label: string) => formatOptions.find((o) => o.label === label),
    isValidFormat: (id: string) => formatOptions.some((o) => o.id === id),
    isValidFormatLabel: (label: string) => formatOptions.some((o) => o.label === label),
    isValidCitationFormatId: (id: string) => ['bibtex', 'agu'].includes(id),
    getFormatById: vi.fn(),
    format: [],
  } as ReturnType<typeof useExportFormats>);
});

describe('AbstractCitationModal', () => {
  it('opens with the format from the saved defaultCitationFormat setting', () => {
    vi.mocked(useSettings).mockReturnValue({
      settings: { defaultCitationFormat: 'bibtex' } as ReturnType<typeof useSettings>['settings'],
      updateSettings: vi.fn(),
      updateSettingsState: {} as ReturnType<typeof useSettings>['updateSettingsState'],
      getSettingsState: {} as ReturnType<typeof useSettings>['getSettingsState'],
    });

    render(<AbstractCitationModal isOpen={true} onClose={vi.fn()} bibcode="2020ApJ...123..456A" />);

    expect(screen.getByText('BibTeX')).toBeInTheDocument();
  });

  it('resets to the saved format when reopened', () => {
    vi.mocked(useSettings).mockReturnValue({
      settings: { defaultCitationFormat: 'bibtex' } as ReturnType<typeof useSettings>['settings'],
      updateSettings: vi.fn(),
      updateSettingsState: {} as ReturnType<typeof useSettings>['updateSettingsState'],
      getSettingsState: {} as ReturnType<typeof useSettings>['getSettingsState'],
    });

    const { rerender } = render(
      <AbstractCitationModal isOpen={false} onClose={vi.fn()} bibcode="2020ApJ...123..456A" />,
    );

    act(() => {
      rerender(<AbstractCitationModal isOpen={true} onClose={vi.fn()} bibcode="2020ApJ...123..456A" />);
    });

    expect(screen.getByText('BibTeX')).toBeInTheDocument();
  });
});
