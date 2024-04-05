import { Preview } from '@storybook/react';
import { GoogleTagManager } from '@next/third-parties/google';
import { QueryClientProvider } from '@tanstack/react-query';
import { StoreProvider, useCreateStore } from '@/store';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { handlers } from '@/mocks/handlers';
import { theme } from '@/theme';
import { MathJaxProvider } from '@/mathjax';
import { useCreateQueryClient } from '@/lib';

export const parameters = {
  chakra: { theme },
  msw: { handlers },
};

// start msw server
initialize();

const preview: Preview = {
  decorators: [
    (Story) => {
      const qc = useCreateQueryClient();
      qc.setDefaultOptions({
        queries: {
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          refetchOnMount: false,
          retry: false,
        },
      });
      return (
        <MathJaxProvider>
          <QueryClientProvider client={qc}>
            <StoreProvider createStore={useCreateStore({})}>
              <Story />
              <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
            </StoreProvider>
          </QueryClientProvider>
        </MathJaxProvider>
      );
    },
  ],
  loaders: [mswLoader],
};

export default preview;
