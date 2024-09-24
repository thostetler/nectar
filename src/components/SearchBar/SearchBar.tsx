import { forwardRef } from 'react';
import { VStack } from '@chakra-ui/react';
import { ISearchInputProps, SearchInput } from '@/components/SearchBar/SearchInput';
import { QuickFields } from '@/components/SearchBar/QuickFields';

export const SearchBar = forwardRef<HTMLInputElement, ISearchInputProps>((props, ref) => {
  return (
    <VStack as="section" direction="column" spacing={2} align="stretch">
      <QuickFields isLoading={props.isLoading} />
      <SearchInput ref={ref} {...props} />
    </VStack>
  );
});
