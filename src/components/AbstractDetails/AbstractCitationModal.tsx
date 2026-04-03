import { useGetExportCitation } from '@/api/export/export';
import { ExportApiFormatKey, MostUsedExportFormats } from '@/api/export/types';
import { useExportFormats } from '@/lib/useExportFormats';
import { useSettings } from '@/lib/useSettings';
import { parseAPIError } from '@/utils/common/parseAPIError';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Flex,
  Textarea,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { SimpleCopyButton } from '../CopyButton';
import { LoadingMessage } from '../Feedbacks';
import { Select } from '../Select';
import { SimpleLink } from '../SimpleLink';

export const AbstractCitationModal = ({
  isOpen,
  onClose,
  bibcode,
}: {
  isOpen: boolean;
  onClose: () => void;
  bibcode: string;
}) => {
  const { settings } = useSettings();

  const { formatOptions, getFormatOptionById } = useExportFormats();

  const options = useMemo(() => formatOptions.filter((o) => MostUsedExportFormats.includes(o.id)), [formatOptions]);

  const [selectedOption, setSelectedOption] = useState(
    () =>
      (settings.defaultCitationFormat ? getFormatOptionById(settings.defaultCitationFormat) : undefined) ??
      getFormatOptionById(ExportApiFormatKey.agu),
  );

  // Sync to the saved default each time the modal opens so stale useState
  // initial values (from React Query placeholder data) don't persist.
  // Intentionally omits settings/format deps — only fire on open, not on
  // background refetches, to avoid resetting an in-session format selection.
  useEffect(() => {
    if (isOpen) {
      const saved = settings.defaultCitationFormat ? getFormatOptionById(settings.defaultCitationFormat) : undefined;
      setSelectedOption(saved ?? getFormatOptionById(ExportApiFormatKey.agu));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const { data, isLoading, isError, error } = useGetExportCitation(
    {
      format: selectedOption.id,
      bibcode: [bibcode],
    },
    { enabled: !!bibcode && isOpen },
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Citation</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Select
            name="format"
            label="Citation Format"
            hideLabel
            id="citation-format-selector"
            options={options}
            value={selectedOption}
            onChange={(o) => setSelectedOption(o)}
            stylesTheme="default.sm"
          />
          <Flex justifyContent="end" my={1}>
            <SimpleLink href={`/abs/${bibcode}/exportcitation/bibtex`} fontSize="sm" fontWeight="bold">
              Advanced options
            </SimpleLink>
          </Flex>
          <Box my={6}>
            {isLoading ? (
              <LoadingMessage message="Loading" />
            ) : isError ? (
              <Alert status="error">
                <AlertIcon />
                <AlertTitle>Error fetching citation!</AlertTitle>
                <AlertDescription>{parseAPIError(error)}</AlertDescription>
              </Alert>
            ) : (
              <>
                {selectedOption.type === 'HTML' ? (
                  <>
                    <Box fontSize="sm" fontWeight="medium" dangerouslySetInnerHTML={{ __html: data.export }} />
                    <Flex justifyContent="end">
                      <SimpleCopyButton text={data.export} variant="outline" size="xs" asHtml />
                    </Flex>
                  </>
                ) : (
                  <>
                    <Textarea value={data.export} fontSize="sm" fontWeight="medium" mb={2} h={150} />
                    <Flex justifyContent="end">
                      <SimpleCopyButton text={data.export} variant="outline" size="xs" />
                    </Flex>
                  </>
                )}
              </>
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
