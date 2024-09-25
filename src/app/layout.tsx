import { ReactNode } from 'react';
import { Root } from '@/app/layouts/root';
import { SessionProvider } from 'next-auth/react';
import { auth } from '@/auth';

export default async function RootLayout({
  children,
}: {
  children: ReactNode,
}) {
  return (
    <html lang="en">
    <body>
    <SessionProvider session={await auth()}>
      <Root>
        {children}
      </Root>
    </SessionProvider>
    </body>
    </html>
  );
}
