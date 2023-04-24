import { ReactNode } from 'react';
import '../styles/styles.css';
import 'nprogress/nprogress.css';
import { DefaultLayout } from '@app/DefaultLayout';

const RootLayout = ({ children, ...otherProps }: { children: ReactNode }) => {
  console.log('other', otherProps);
  return (
    <html lang="en">
      <body>
        <DefaultLayout>{children}</DefaultLayout>
      </body>
    </html>
  );
};

export default RootLayout;
