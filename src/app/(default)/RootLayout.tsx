'use client';
import { ReactNode } from 'react';
import { Container } from '@chakra-ui/layout';

export const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <Container as="main" maxW="container.xl" id="main-content">
        {children}
      </Container>
    </>
  );
};
