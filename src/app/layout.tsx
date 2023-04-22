import { ReactNode } from 'react';

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html>
    <head></head>
    <body>{children}</body>
    </html>
  );
};

export default RootLayout;
