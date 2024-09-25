'use client';

import { ReactNode } from 'react';
import { Metadata } from 'next';
import { Container } from '@chakra-ui/react';

export const metadata: Metadata = {
  title: 'TEST',
  description: 'this is a description',
};

export const SearchLayout = ({ children }: { children: ReactNode }) => {
  return <Container as="main" maxW="container.xl" id="main-content">
      {children}
    </Container>;
};
