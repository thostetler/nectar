import { ReactNode } from 'react';
import { Root } from '@app/root';
import '../styles/styles.css';
import 'nprogress/nprogress.css';

const RootLayout = ({ children, ...otherProps }: { children: ReactNode }) => {
  console.log('other', otherProps);
  return (
    <html lang="en">
      <body>
        <Root>{children}</Root>
      </body>
    </html>
  );
};

export default RootLayout;
