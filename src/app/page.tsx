'use client';

import { ChangeEventHandler, useEffect, useRef, useState } from 'react';
import { SearchBar } from '@components/SearchBar';
import { useStore, useStoreApi } from '@store';
import { Box, Flex } from '@chakra-ui/layout';
import { Text } from '@chakra-ui/react';
import { makeSearchParams } from '@utils';
import { SearchExamples } from '@components/SearchExamples';
import { useRouter } from 'next/router';

export default function Page() {
  const store = useStoreApi();
  const resetQuery = useStore((state) => state.resetQuery);
  const submitQuery = useStore((state) => state.submitQuery);
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // clear search on mount
  useEffect(() => resetQuery(), []);

  /**
   * update route and start searching
   */
  const handleOnSubmit: ChangeEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const { q, sort } = store.getState().query;
    if (q && q.trim().length > 0) {
      setIsLoading(true);
      submitQuery();
      void router.push({ pathname: '/search', search: makeSearchParams({ q, sort, p: 1 }) });
    }
  };

  const handleExampleSelect = () => {
    // on example selection, move focus to input
    if (input.current && 'focus' in input.current) {
      input.current.focus();
    }
  };

  return (
    <Box aria-labelledby="form-title" my={8}>
      <form method="get" action="/search" onSubmit={handleOnSubmit}>
        <Text as="h2" className="sr-only" id="form-title">
          Modern Search Form
        </Text>
        <Flex direction="column">
          <Box my={2}>
            <SearchBar ref={input} isLoading={isLoading} />
          </Box>
          <Box mb={2} mt={5}>
            <SearchExamples onSelect={handleExampleSelect} />
          </Box>
        </Flex>
      </form>
    </Box>
  );
}
