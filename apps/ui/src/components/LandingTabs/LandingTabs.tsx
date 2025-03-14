import { Box, Center, Flex, HStack, Icon, Show, VisuallyHidden } from '@chakra-ui/react';
import { useStore } from '@/store';
import { AppMode } from '@/types';
import { CSSProperties, memo, ReactElement } from 'react';
import { ScixAndNasaLogo_H_beta } from '@/components/images/ScixAndNasaLogo-H_beta';

import { SimpleLink } from '@/components/SimpleLink/SimpleLink';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { usePathname } from 'next/navigation';


const Tabs = ({ show }: { show: boolean }) => {
  const pathname = usePathname();
  if (!show) {
    return null;
  }

  return (
    <HStack justifyContent="center" spacing={2} zIndex={5} fontSize={{ base: 'md', sm: 'xl' }}>
      <Tab href="/classic-form" label="Classic Form" active={pathname === '/classic-form'} />
      <Tab href="/" label="Modern Form" active={pathname === '/'} />
      <Tab href="/paper-form" label="Paper Form" active={pathname === '/paper-form'} />
    </HStack>
  );
};

const TitleLogo = memo(() => {
  return (
    <Center>
      <Show above="sm">
        <Icon as={ScixAndNasaLogo_H_beta} height="4em" width="25em" aria-hidden />
      </Show>
      <VisuallyHidden>Science Explorer</VisuallyHidden>
    </Center>
  );
});
TitleLogo.displayName = 'TitleLogo';

const flexStyle: CSSProperties = {
  position: 'relative',
  backgroundColor: 'black',
  overflow: 'hidden',
  height: '100vh'
};

const backgroundImageStyle: CSSProperties = {
  content: '""',
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  opacity: 0.5,
  zIndex: 0,
};

export const LandingTabs = (): ReactElement => {
  const mode = useStore((state) => state.mode);

  const getBackgroundImage = () => {
    switch (mode) {
      case AppMode.ASTROPHYSICS:
        return '/images/bg-astro.webp';
      case AppMode.GENERAL:
        return '/images/bg-general.webp';
      case AppMode.BIO_PHYSICAL:
        return '/images/bg-bio.webp';
      case AppMode.EARTH_SCIENCE:
        return '/images/bg-earth.webp';
      case AppMode.HELIOPHYSICS:
        return '/images/bg-helio.webp';
      case AppMode.PLANET_SCIENCE:
        return '/images/bg-planet.webp';
      default:
        return '';
    }
  };

  return (
    <Flex direction="column" justifyContent="center" alignItems="center" style={flexStyle}>
      <Box style={{ ...backgroundImageStyle, backgroundImage: `url(${getBackgroundImage()})` }} />
      <Box padding={6} zIndex={1}>
        <TitleLogo />
      </Box>
      <Tabs show={mode === AppMode.ASTROPHYSICS} />
    </Flex>
  );
};

interface ITabProps {
  href: string;
  label: string;
  active: boolean;
}

const Tab = ({ href, label, active }: ITabProps) => {
  const { background, highlightForeground } = useColorModeColors();
  return (
    <SimpleLink
      href={href}
      backgroundColor={active ? background : 'transparent'}
      color={active ? highlightForeground : 'gray.50'}
      px={4}
      py={2}
      borderTopRadius={3}
      fontWeight="semibold"
    >
      {label}
    </SimpleLink>
  );
};
