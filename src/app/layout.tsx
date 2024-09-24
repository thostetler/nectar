import { Providers } from './providers';
import { ReactNode } from 'react';
import { Root } from '@/app/layouts/root';

export default function RootLayout({
  children,
}: {
  children: ReactNode,
}) {
  return (
    <html lang="en">
    <body>
    <Providers>
      <Root>
        {children}
      </Root>
    </Providers>
    </body>
    </html>
  );
}
