'use client';
import { ReactNode } from 'react';
import { LandingTabs } from '@components/LandingTabs';
import { Container } from '@chakra-ui/layout';

export const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <nav>
        <LandingTabs />
      </nav>
      <Container as="main" maxW="container.xl" id="main-content">
        {children}
      </Container>
    </>
  );
};
