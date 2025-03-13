'use client';

import { NavBar } from '@/components/NavBar';
import { Providers } from "./providers";
import { Footer } from '@/components/Footer';
import { ReactNode } from 'react';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <NavBar/>
      <main>{children}</main>
      <Footer/>
    </Providers>
  );
}
