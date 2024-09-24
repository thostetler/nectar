import { ReactNode } from 'react';
import { SearchLayout } from '@/app/layouts/search';

const SearchPageLayout = ({ children }: { children: ReactNode }) => {
  return <SearchLayout>{children}</SearchLayout>;
};

export default SearchPageLayout;
