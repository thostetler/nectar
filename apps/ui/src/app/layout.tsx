import {Footer} from '@/components/Footer';
import {Providers} from '@/app/providers';
import {NavBar} from '@/components/NavBar';
import ClientLayout from '@/app/client-layout';
import { ReactNode } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
      <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
