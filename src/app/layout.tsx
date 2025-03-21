import { BRAND_NAME_FULL } from '@/config';
import { Metadata } from 'next';
import { ReactNode } from 'react';
import { Favicons } from '@/components/Favicons/Favicons';
import { LayoutClient } from '@/app/layout.client';

export const metadata: Metadata = {
  title: {
    default: BRAND_NAME_FULL,
    template: `%s | ${BRAND_NAME_FULL}`,
  },
  description: 'SciX Digital Library',
  viewport: 'width=device-width, initial-scale=1.0',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Favicons />
      </head>
      <body>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
