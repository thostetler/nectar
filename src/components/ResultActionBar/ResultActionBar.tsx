import { IDocsEntity } from '@api';
import { Box, Button, Stack } from '@chakra-ui/react';
import { Sort } from '@components';
import { useStore } from '@store';
import { useGetHighlights } from '@_api/search';
import PT from 'prop-types';
import { FC, HTMLAttributes, ReactChild, ReactElement } from 'react';

export interface IResultActionBarProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactChild;
  docs: IDocsEntity[];
}

const propTypes = {
  children: PT.element,
};

export const ResultActionBar: FC<IResultActionBarProps> = ({ children, docs }) => {
  return (
    <Box mb={1}>
      <Stack direction={'column'} spacing={1}>
        <Stack direction={{ base: 'column', sm: 'row' }} spacing={1} width="min-content">
          <Highlights />
          <Sort />
        </Stack>
      </Stack>
    </Box>
  );
};

ResultActionBar.propTypes = propTypes;

const Highlights = (): ReactElement => {
  const toggle = useStore((state) => state.toggleHighlights);
  const show = useStore((state) => state.docs.showHighlights);
  const query = useStore((state) => state.latestQuery);

  console.log({ query });

  useGetHighlights(
    { ...query },
    {
      enabled: show,
    },
  );

  const variant = show ? 'solid' : 'outline';
  return (
    <Button variant={variant} onClick={toggle} size="md" borderRadius="2px" borderWidth={1}>
      Show Highlights
    </Button>
  );
};
