import { ChakraProvider } from '@chakra-ui/react';
import { Layout } from '@/components';
import { useIsClient } from 'src/lib';
import { useCreateQueryClient } from '@/lib/useCreateQueryClient';
import { MathJaxProvider } from '@/mathjax';
import { AppState, StoreProvider, useCreateStore, useStore } from '@/store';
import { theme } from '@/theme';
import { AppMode } from '@/types';
import { AppProps, NextWebVitalsMetric } from 'next/app';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import 'nprogress/nprogress.css';
import { FC, memo, ReactElement, useEffect, useMemo } from 'react';
import { DehydratedState, Hydrate, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import '../styles/styles.css';
import '../styles/page-loader.css';
import { logger } from '@/logger';
import { GoogleTagManager, sendGTMEvent } from '@next/third-parties/google';
import Head from 'next/head';
import { BRAND_NAME_FULL } from '@/config';

if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled' && process.env.NODE_ENV !== 'production') {
  require('../mocks');
}

const TopProgressBar = dynamic<Record<string, never>>(
  () => import('@/components/TopProgressBar').then((mod) => mod.TopProgressBar),
  {
    ssr: false,
  },
);

export type AppPageProps = {
  dehydratedState: DehydratedState;
  dehydratedAppState: AppState;
  [key: string]: unknown;
};

const NectarApp = memo(({ Component, pageProps }: AppProps): ReactElement => {
  logger.debug({ props: pageProps as unknown }, 'App');
  const router = useRouter();

  useMemo(() => {
    router.prefetch = () => new Promise((res) => res());
  }, [router]);

  return (
    <>
      <Head>
        <DefaultMeta />
        <title>{`${BRAND_NAME_FULL}`}</title>
      </Head>
      <Providers pageProps={pageProps as AppPageProps}>
        <AppModeRouter />
        <TopProgressBar />
        <Layout>
          <Component {...pageProps} />
          <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
        </Layout>
      </Providers>
    </>
  );
});

const Providers: FC<{ pageProps: AppPageProps }> = ({ children, pageProps }) => {
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

const AppModeRouter = (): ReactElement => {
  const mode = useStore((state) => state.mode);
  const router = useRouter();
  const isClient = useIsClient();

  useEffect(() => {
    // redirect to main form if path is not valid
    if (isClient) {
      if (mode !== AppMode.ASTROPHYSICS && /^\/(classic|paper)-form.*$/.test(router.asPath)) {
        void router.replace('/');
      }
    }
  }, [mode, router.asPath]);

  return <></>;
};

export const reportWebVitals = (metric: NextWebVitalsMetric) => {
  logger.debug('Web Vitals', { metric });

  sendGTMEvent({
    event: 'web_vitals',
    web_vitals_name: metric.name,
    web_vitals_value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    web_vitals_label: metric.id,
    non_interaction: true,
  });
};

const DefaultMeta = () => {
  return (
    <>
      <meta name="google-site-verification" content="2K2Hn5eIn2hgc1C9qiHwQQa46piB4bcYshJK5BzPMq0" />
      <meta name="title" content="Science Explorer" />
      <meta
        name="description"
        content="Science Explorer is a digital library for astronomy, physics, and earth science, providing access to 20+ million records and advanced research tools."
      />
      <meta
        name="keywords"
        content="Science Explorer, Digital library, Astronomy research, Physics research, Earth science research, Bibliographic collections, Scientific publications, Refereed literature, Preprints, Research tools, Citation tracking, Interdisciplinary studies, Open science, FAIR principles, Data catalogs, Advanced discovery tools, Scientific knowledge access, Scholarly articles, Bibliometrics, Information science"
      />
      <meta name="robots" content="index, follow" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
    </>
  );
};

export default NectarApp;
