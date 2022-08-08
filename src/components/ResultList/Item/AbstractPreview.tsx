import { IDocsEntity, useGetAbstractPreview } from '@api';
import { IconButton } from '@chakra-ui/button';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { Flex, Text, VStack } from '@chakra-ui/layout';
import { useToast } from '@chakra-ui/react';
import { Collapse } from '@chakra-ui/transition';
import { MathJax } from 'better-react-mathjax';
import { ReactElement, useState } from 'react';

export interface IAbstractPreviewProps {
  bibcode: IDocsEntity['bibcode'];
}

const text = {
  error: 'Problem loading abstract preview' as const,
  noAbstract: 'No Abstract' as const,
  hideAbstract: 'Hide Abstract Preview' as const,
  showAbstract: 'Show Abstract Preview' as const,
  seeFullAbstract: 'See full abstract' as const,
};

export const AbstractPreview = ({ bibcode }: IAbstractPreviewProps): ReactElement => {
  const [show, setShow] = useState(false);
  const toast = useToast();
  const { data, isFetching, isSuccess } = useGetAbstractPreview(
    { bibcode },
    {
      enabled: show,
      keepPreviousData: true,
      onError: () => {
        // show toast notification on error, and close drawer
        toast({ status: 'error', description: text.error });
        setShow(false);
      },
    },
  );

  return (
    <Flex direction="column" justifyContent="center" alignContent="center">
      {isSuccess && (
        <Collapse in={show} animateOpacity>
          <Text
            as={MathJax}
            fontSize="md"
            mt={1}
            dangerouslySetInnerHTML={{ __html: data.docs[0]?.abstract ?? text.noAbstract }}
          />
        </Collapse>
      )}
      <VStack>
        <IconButton
          aria-label={show ? 'hide abstract' : 'show abstract'}
          onClick={() => setShow(!show)}
          disabled={false}
          variant="unstyled"
          width="fit-content"
          display="flex"
          fontSize="md"
          isLoading={isFetching}
          icon={show ? <ChevronUpIcon /> : <ChevronDownIcon />}
        />
      </VStack>
    </Flex>
  );
};
