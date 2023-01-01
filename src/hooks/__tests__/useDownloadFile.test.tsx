import { useDownloadFile } from '@hooks/useDownloadFile';
import { renderHook } from '@testing-library/react';
import { saveAs } from 'file-saver';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

test('Default works', () => {
  const { result } = renderHook((props: Parameters<typeof useDownloadFile>) => useDownloadFile(...props), {
    initialProps: [''],
  });

  expect(result.current).toMatchObject({
    hasDownloaded: false,
    isDownloading: false,
    value: '',
    filename: 'download.txt',
    linkHref: '',
  });

  result.current.onDownload();
  expect(saveAs).toHaveBeenCalledWith('', 'download.txt');
});

test('Browser type creates a link', () => {
  const { result } = renderHook((props: Parameters<typeof useDownloadFile>) => useDownloadFile(...props), {
    initialProps: ['test', { type: 'BROWSER' }],
  });
  console.log(result.current);
  expect(result.current).toMatchObject({});
});
