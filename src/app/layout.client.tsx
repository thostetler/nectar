'use client';
import { Flex, useMediaQuery } from '@chakra-ui/react';
import { SkipNavLink } from '@chakra-ui/skip-nav';
import { ReactNode } from 'react';
import { Providers } from '@/providers';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { Notification } from '@/components/Notification';

export const LayoutClient = ({ children }: { children: ReactNode }) => {
  const [isPrint] = useMediaQuery('print');

  return (
    <Providers>
      <Flex direction="column">
        <SkipNavLink id="main-content">Skip to content</SkipNavLink>
        {isPrint ? null : <NavBar />}
        {isPrint ? null : <Notification />}
        <main>
          {/*<Container maxW={isLandingPage ? 'container.md' : 'container.xl'} id="main-content">*/}
          {children}
          {/*</Container>*/}
        </main>
        {isPrint ? null : <Footer />}
      </Flex>
    </Providers>
  );
};
