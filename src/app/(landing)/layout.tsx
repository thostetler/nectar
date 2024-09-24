import { ReactNode } from 'react';
import { LandingLayout } from '@/app/layouts/landing';

const LandingPageLayout = ({ children }: { children: ReactNode }) => {
  return <LandingLayout>{children}</LandingLayout>;
};

export default LandingPageLayout;
