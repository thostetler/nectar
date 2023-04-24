import { ReactNode } from 'react';
import { RootLayout } from './RootLayout';

const LandingLayout = ({ children }: { children: ReactNode }) => {
  return <RootLayout>{children}</RootLayout>;
};

export default LandingLayout;
