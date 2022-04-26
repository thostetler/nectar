import { Button, HStack, Stack, Textarea, useClipboard } from '@chakra-ui/react';
import { useDownloadFile } from '@hooks/useDownloadFile';
import { useIsClient } from '@hooks/useIsClient';
import { ExportApiFormatKey } from '@_api/export';
import { exportFormats } from '../models';

export const ResultArea = ({
  result = '',
  format = ExportApiFormatKey.bibtex,
  isLoading,
}: {
  result: string;
  format: ExportApiFormatKey;
  isLoading?: boolean;
}) => {
  const { onCopy, hasCopied } = useClipboard(result);
  const { onDownload, hasDownloaded } = useDownloadFile(result, {
    filename: () => `export-${format}.${exportFormats[format].ext}`,
  });
  const isClient = useIsClient();
  return (
    <Stack flexGrow={[1, 1, 2]}>
      {isClient && (
        <HStack justifyContent={['center', 'start']}>
          <Button onClick={onDownload} data-testid="export-download" disabled={isLoading}>
            {hasDownloaded ? 'Downloaded!' : 'Download to file'}
          </Button>
          <Button onClick={onCopy} data-testid="export-copy" disabled={isLoading}>
            {hasCopied ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
        </HStack>
      )}
      <Textarea
        readOnly
        fontSize={['xs', 'sm']}
        resize="none"
        minH={['xs', 'sm']}
        bgColor="gray.100"
        fontFamily="monospace"
        fontWeight="semibold"
        value={result}
        data-testid="export-output"
      />
    </Stack>
  );
};
