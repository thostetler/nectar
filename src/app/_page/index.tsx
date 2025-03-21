'use client';

import { Box, Center, Container, Flex, Heading, Text, useMediaQuery } from '@chakra-ui/react';
import { Carousel } from './_components/Carousel';
import { SearchExamples } from '@/app/_page/_components/SearchExamples';
import { LandingTabs } from '@/components/LandingTabs';
import { SearchBar } from '@/components/SearchBar';

export default function RootPage() {
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  return (
    <>
      <LandingTabs />
      <Container maxW="container.md">
        <Box my={8}>
          <form method="get" action="/search">
            <Flex direction="column">
              <Box my={2}>
                <SearchBar />
              </Box>
              {isMobile ? (
                <>
                  <Heading as="h3" my={5}>
                    <Center>
                      <Text fontWeight="thin">Search Examples</Text>
                    </Center>
                  </Heading>
                  <SearchExamples />
                </>
              ) : (
                <Box mb={2} mt={5} minW="md">
                  <Carousel />
                </Box>
              )}
            </Flex>
          </form>
        </Box>
      </Container>
    </>
  );
}
