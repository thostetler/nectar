import { FC } from 'react';
import { StoreProvider, useCreateStore } from '@/store';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { MathJaxProvider } from '@/mathjax';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from '@/theme';
import { Hydrate, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useCreateQueryClient } from '@/lib';
import { AppPageProps } from '@/pages/_app';

export const Providers: FC<{ pageProps: AppPageProps }> = ({ children, pageProps }) => {
  const createStore = useCreateStore(pageProps.dehydratedAppState ?? {});

  return (
    <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ''}>
      <MathJaxProvider>
        <ChakraProvider theme={theme}>
          <StoreProvider createStore={createStore}>
            <QCProvider>
              <Hydrate state={pageProps.dehydratedState}>{children}</Hydrate>
              <ReactQueryDevtools />
            </QCProvider>
          </StoreProvider>
        </ChakraProvider>
      </MathJaxProvider>
    </GoogleReCaptchaProvider>
  );
};

const QCProvider: FC = ({ children }) => {
  const queryClient = useCreateQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
