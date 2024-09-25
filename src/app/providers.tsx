'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { ReactNode, useEffect } from 'react';
import { theme } from '@/theme';
import { StoreProvider, useCreateStore } from '@/store';
import { QueryClientProvider } from '@tanstack/react-query';
import { useCreateQueryClient } from '@/lib';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { MathJaxProvider } from '@/mathjax';
import { useSession } from 'next-auth/react';
import { logger } from '@/logger';
import { signIn } from '@/auth';

export function Providers({ children }: { children: ReactNode }) {
  const createStore = useCreateStore();

  return <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ''}>
    <MathJaxProvider>
      <ChakraProvider theme={theme}>
        <QueryClientProvider client={useCreateQueryClient()}>
          <StoreProvider createStore={createStore}>
            <AnonymousSessionProvider>
              {children}
            </AnonymousSessionProvider>
          </StoreProvider>
        </QueryClientProvider>
      </ChakraProvider>
    </MathJaxProvider>
  </GoogleReCaptchaProvider>;
}

const AnonymousSessionProvider = ({ children }: { children: ReactNode }) => {
  const { data, status } = useSession();

  logger.debug({ data, status }, 'anonymous provider');

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('anonymous', {}).then(data => {
        logger.debug({ data }, 'sign in worked');
      }).catch((err) => {
        logger.error({ err: err as Error }, 'sign in failed');
      });
    }
  }, [status]);

  return <>{children}</>;
};
