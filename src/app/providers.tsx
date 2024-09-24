'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { theme } from '@/app/theme';
import { StoreProvider, useCreateStore } from '@/store';
import { QueryClientProvider } from '@tanstack/react-query';
import { useCreateQueryClient } from '@/lib';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { MathJaxProvider } from '@/mathjax';

export function Providers({ children }: { children: ReactNode }) {
  const createStore = useCreateStore();

  return <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ''}>
    <MathJaxProvider>
      <ChakraProvider theme={theme}>
        <QueryClientProvider client={useCreateQueryClient()}>
          <StoreProvider createStore={createStore}>
            {children}
          </StoreProvider>
        </QueryClientProvider>
      </ChakraProvider>
    </MathJaxProvider>
  </GoogleReCaptchaProvider>;

}
