import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AbstractCitationModal } from './AbstractCitationModal';
import { ExportApiFormatKey } from '@/api/export/types';

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
  id: ExportApiFormatKey.bibtex,
  label: 'BibTeX',
  value: ExportApiFormatKey.bibtex,
  type: 'text' as const,
  ext: '.bib',
  route: '/bibtex',
};
const aguOption = {
  id: ExportApiFormatKey.agu,
  label: 'AGU',
  value: ExportApiFormatKey.agu,
  type: 'text' as const,
  ext: '.txt',
  route: '/agu',
};
const formatOptions = [bibtexOption, aguOption];

const mockSettings = (citationFormat: string) =>
  vi.mocked(useSettings).mockReturnValue({
    settings: { defaultCitationFormat: citationFormat } as ReturnType<typeof useSettings>['settings'],
    updateSettings: vi.fn(),
    updateSettingsState: {} as ReturnType<typeof useSettings>['updateSettingsState'],
    getSettingsState: {} as ReturnType<typeof useSettings>['getSettingsState'],
  });

beforeEach(() => {
  vi.mocked(useExportFormats).mockReturnValue({
    formatOptions,
    formatOptionsNoCustom: formatOptions,
    getFormatOptionById: (id: string) => formatOptions.find((o) => o.id === id),
    getFormatOptionByLabel: (label: string) => formatOptions.find((o) => o.label === label),
    isValidFormat: (id: string) => formatOptions.some((o) => o.id === id),
    isValidFormatLabel: (label: string) => formatOptions.some((o) => o.label === label),
    isValidCitationFormatId: (id: string) =>
      [ExportApiFormatKey.bibtex, ExportApiFormatKey.agu].includes(id as ExportApiFormatKey),
    getFormatById: vi.fn(),
    format: [],
  } as ReturnType<typeof useExportFormats>);
});

describe('AbstractCitationModal', () => {
  it('opens with the format from the saved defaultCitationFormat setting', () => {
    mockSettings(ExportApiFormatKey.bibtex);

    render(<AbstractCitationModal isOpen={true} onClose={vi.fn()} bibcode="2020ApJ...123..456A" />);

    expect(screen.getByText('BibTeX')).toBeInTheDocument();
  });

  it('resets to the saved format when modal opens after settings load', () => {
    // Simulate the bug: component mounts with placeholder data (agu),
    // then real settings load (bibtex), then the modal opens.
    mockSettings(ExportApiFormatKey.agu);

    const { rerender } = render(
      <AbstractCitationModal isOpen={false} onClose={vi.fn()} bibcode="2020ApJ...123..456A" />,
    );

    mockSettings(ExportApiFormatKey.bibtex);

    // Open the modal — the useEffect should pick up the current saved setting
    act(() => {
      rerender(<AbstractCitationModal isOpen={true} onClose={vi.fn()} bibcode="2020ApJ...123..456A" />);
    });

    // Should show BibTeX (user's saved preference), not AGU (the stale placeholder)
    expect(screen.getByText('BibTeX')).toBeInTheDocument();
    expect(screen.queryByText('AGU')).not.toBeInTheDocument();
  });
});
