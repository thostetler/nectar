import { IADSApiSearchResponse, IDocsEntity } from '@api';
import { Flex } from '@chakra-ui/layout';
import { Box, Collapse, Text } from '@chakra-ui/react';
import { useStore } from '@store';
import { searchKeys } from '@_api/search';
import { ReactElement, useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';

export interface IResultHighlightsProps {
  id: IDocsEntity['id'];
}

export const ResultHighlights = ({ id }: IResultHighlightsProps): ReactElement => {
  const show = useStore((state) => state.docs.showHighlights);
  const queryClient = useQueryClient();
  const [highlights, setHighlights] = useState<Record<string, string[]>>(null);

  useEffect(() => {
    if (show) {
      const res = queryClient.getQueryData<IADSApiSearchResponse>(searchKeys.highlights(null)[0], { exact: false });
      setHighlights(res?.highlighting?.[id] ?? null);
    }
  }, [id, queryClient, show]);

  console.log({ highlights });

  // const { data } = useGetHighlights({ bibcode }, {
  //   enabled: show,
  //   keepPreviousData: true
  // });

  if (highlights === null) {
    return null;
  }

  return (
    <Flex direction="column" justifyContent="center" alignContent="center">
      <Collapse in={show} animateOpacity>
        <Text fontSize="md" mt={1}>
          {Object.keys(highlights).map((key) => (
            <Box dangerouslySetInnerHTML={{ __html: highlights[key].map((entry) => `<p>${entry}</p>`).join('') }}></Box>
          ))}
        </Text>
      </Collapse>
    </Flex>
  );
};
