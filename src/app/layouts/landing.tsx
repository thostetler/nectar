'use client';

import { ReactNode } from 'react';
import { Metadata } from 'next';
import { Container } from '@chakra-ui/react';
import { LandingTabs } from '@/components/LandingTabs';

export const metadata: Metadata = {
  title: 'TEST',
  description: 'this is a description',
};

export const LandingLayout = ({ children }: { children: ReactNode }) => {
  return <>
    <LandingTabs />
    <Container as="main" maxW="container.lg" id="main-content">
      {children}
    </Container>;
  </>;
};
