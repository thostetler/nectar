'use client';

import { NavBar } from '@/components/NavBar';
import { Providers } from "./providers";
import { Footer } from '@/components/Footer';
import { ReactNode } from 'react';
import { Container, Stack } from '@chakra-ui/react';
import { SkipNavLink } from '@chakra-ui/skip-nav';
import { LandingTabs } from '@/components/LandingTabs';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <Stack gap="0">
        <SkipNavLink id="main-content">Skip to content</SkipNavLink>
        <NavBar/>
        <main>
          <LandingTabs/>
          <Container maxW="container.md" id="main-content" my="4">
            {children}
          </Container>
        </main>
        <Footer/>
      </Stack>
    </Providers>
  );
}
