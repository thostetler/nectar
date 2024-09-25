'use client';

import { ReactNode } from 'react';
import { Flex } from '@chakra-ui/react';
import { Metadata } from 'next';
import { SkipNavLink } from '@chakra-ui/skip-nav';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { Providers } from '@/app/providers';

export const metadata: Metadata = {
  title: 'TEST',
  description: 'this is a description',
};

export const Root = ({ children }: { children: ReactNode }) => {
  return <Providers>
    <Flex direction="column" w="full">
      <SkipNavLink id="main-content">Skip to content</SkipNavLink>
      <NavBar />
      {children}
      <Footer />
    </Flex>
  </Providers>;
};
