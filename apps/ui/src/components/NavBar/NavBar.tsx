import { Box, Flex, Heading, HStack, Icon } from '@chakra-ui/react';
import { ScixAndTextLogo_H_beta } from '@/components/images/ScixAndTextLogo-H_beta';
import { FC } from 'react';
import { SimpleLink } from '@/components/SimpleLink';
import { AppModeDropdown } from '@/components/NavBar/AppModeDropdown';
import { NavMenus } from '@/components/NavBar/NavMenus';

export const NavBar: FC = () => {
  return (
    <Box as="nav" backgroundColor="gray.900">
      <Flex direction="row" alignItems="center" justifyContent="space-between" mx={4} my={2}>
        <HStack spacing={3}>
          <SimpleLink href="/" _hover={{ textDecoration: 'none' }}>
            <HStack cursor="pointer" spacing={1}>
              <Heading as="h1" size="sm">
                <Icon as={ScixAndTextLogo_H_beta} width="6em" height="3em" color="gray.50" aria-label="Scix Home" />
              </Heading>
            </HStack>
          </SimpleLink>
          <AppModeDropdown />
        </HStack>
        {/*<NavMenus />*/}
      </Flex>
    </Box>
  );
};
