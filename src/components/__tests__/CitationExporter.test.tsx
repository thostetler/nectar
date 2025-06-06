import { APP_DEFAULTS } from '@/config';
import { render, waitFor } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { ReactElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { ExportApiFormatKey, IExportApiParams } from '@/api/export/types';
import { CitationExporter } from '@/components/CitationExporter';

const NoRecords = () => <CitationExporter records={[]} />;
const SingleMode = () => <CitationExporter records={['2021APS..APRA01003G']} singleMode />;
const MultiRecord = () => (
  <CitationExporter
    initialFormat={ExportApiFormatKey.bibtex}
    totalRecords={100}
    records={[
      '2021APS..APRA01003G',
      '2018cosp...42E1191G',
      '2017koa..prop..257G',
      '2015koa..prop..493G',
      '2015koa..prop..393G',
      '2015IAUGA..2258598G',
      '2015IAUGA..2258584G',
      '2014koa..prop..669G',
      '2014koa..prop..579G',
      '2014ATel.6110....1G',
    ]}
  />
);

const router = {
  pathname: '/',
  push: vi.fn(),
  asPath: '/',
  query: {
    sort: '',
  },
  beforePopState: vi.fn(),
};
vi.mock('next/router', () => ({
  useRouter: () => router,
}));

const checkOutput = (
  el: HTMLTextAreaElement,
  params: Partial<Omit<IExportApiParams, 'bibcode'> & { numRecords: number }> = {},
) => {
  const defaultParams: Omit<IExportApiParams, 'bibcode'> & { numRecords: number } = {
    numRecords: 1,
    format: ExportApiFormatKey.bibtex,
    sort: APP_DEFAULTS.SORT,
    keyformat: ['%R'],
    authorcutoff: [200],
    journalformat: [1],
    maxauthor: [10],
  };
  const expected = { ...defaultParams, ...params };
  expect(el).toHaveValue(JSON.stringify(expected, Object.keys(expected).sort(), 2));
};

const setup = (component: ReactElement) => {
  return {
    user: userEvent.setup(),
    ...render(component),
  };
};

describe('single mode', () => {
  test('renders without error', () => {
    setup(<SingleMode />);
  });
  test.skip('has proper output', async () => {
    const { getByTestId } = setup(<SingleMode />);
    await waitFor(() => checkOutput(getByTestId('export-output') as HTMLTextAreaElement));
  });
});

describe('multi-record mode', () => {
  test('renders without error', () => {
    setup(<MultiRecord />);
  });
  test.skip('has proper output', async () => {
    const { getByTestId } = setup(<MultiRecord />);

    await waitFor(() => checkOutput(getByTestId('export-output') as HTMLTextAreaElement, { numRecords: 10 }));
  });
});

describe('no records view', () => {
  test('renders without error', () => {
    const { getByTestId } = render(<NoRecords />);
    expect(getByTestId('export-heading')).toHaveTextContent('No Records');
  });
});
