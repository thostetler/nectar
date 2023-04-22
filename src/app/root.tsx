'use client';
import { ChakraProvider, Flex } from '@chakra-ui/react';
import { theme } from '@theme';
import { SkipNavLink } from '@chakra-ui/skip-nav';
import { Container } from '@chakra-ui/layout';
import { NavBar } from '@components/NavBar';
import { Footer } from '@components/Footer';
import { FC, ReactNode } from 'react';
import { AppState, StoreProvider, useCreateStore } from '@store';
import { MathJaxProvider } from '@mathjax';
import { Hydrate, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { useCreateQueryClient } from '@hooks/useCreateQueryClient';
import { TopProgressBar } from '@components/TopProgressBar';
import { CacheProvider } from '@chakra-ui/next-js';

export const Root = ({ children }: { children: ReactNode }) => {
  return (
    <Providers>
      <SkipNavLink id="main-content">Skip to content</SkipNavLink>
      <Flex direction="column">
        <NavBar />
        <TopProgressBar />
        <Container maxW="container.xl" id="main-content">
          {children}
        </Container>
        <Footer />
      </Flex>
    </Providers>
  );
};

type AppPageProps = { dehydratedState?: unknown; dehydratedAppState?: AppState; [key: string]: unknown };
const Providers: FC<{ pageProps?: AppPageProps }> = ({ children, pageProps }) => {
  const createStore = useCreateStore(pageProps?.dehydratedAppState ?? {});
  const queryClient = useCreateQueryClient();
  const reactQueryState = pageProps?.dehydratedState ?? {};

  return (
    <MathJaxProvider>
      <CacheProvider>
        <ChakraProvider theme={theme}>
          <StoreProvider createStore={createStore}>
            <QueryClientProvider client={queryClient}>
              <Hydrate state={reactQueryState}>{children}</Hydrate>
              <ReactQueryDevtools />
            </QueryClientProvider>
          </StoreProvider>
        </ChakraProvider>
      </CacheProvider>
    </MathJaxProvider>
  );
};
