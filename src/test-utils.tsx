import { AppState, StoreProvider, useCreateStore } from '@/store';
import { render, renderHook, RenderOptions } from '@testing-library/react';
import { SetupServerApi } from 'msw/node';
import { AnyFunction, map, path, pipe } from 'ramda';
import { ReactElement, ReactNode } from 'react';
import { Mock, vi } from 'vitest';
import { Container, ThemeProvider } from '@chakra-ui/react';
import { isObject } from 'ramda-adjunct';
import mockOrcidUser from '@/mocks/responses/orcid/exchangeOAuthCode.json';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MathJaxProvider } from '@/mathjax';
import { GoogleTagManager } from '@next/third-parties/google';
import { theme } from '@/theme';

/**
 * Attach listeners and return the mocks (MSW v2 compatible)
 */
export const createServerListenerMocks = (server: SetupServerApi) => {
  const onRequest = vi.fn<[Request]>();
  const onMatch = vi.fn<[Request]>();
  const onUnhandled = vi.fn<[Request]>();
  const onRequestEnd = vi.fn<[Request]>();
  const onResponse = vi.fn<[response: unknown, requestId: string]>();
  const onResponseBypass = vi.fn<[response: unknown, requestId: string]>();
  const onUnhandleException = vi.fn<[error: Error, request: Request]>();

  // MSW v2 events receive { request, requestId } objects
  server.events.on('request:start', ({ request }) => onRequest(request));
  server.events.on('request:match', ({ request }) => onMatch(request));
  server.events.on('request:unhandled', ({ request }) => onUnhandled(request));
  server.events.on('request:end', ({ request }) => onRequestEnd(request));
  server.events.on('response:mocked', onResponse);
  server.events.on('response:bypass', onResponseBypass);
  server.events.on('unhandledException', onUnhandleException);

  return { onRequest, onResponse, onMatch, onUnhandled, onRequestEnd, onResponseBypass, onUnhandleException };
};

export const urls = pipe<[Mock], Request[], string[]>(
  path(['mock', 'calls']),
  map((call: [Request]) => new URL(call[0].url).pathname),
);

interface IProviderOptions {
  initialStore?: Partial<AppState>;
  storePreset?: 'orcid-authenticated';
}

export const DefaultProviders = ({
  children,
  options,
}: {
  children: ReactElement | ReactNode;
  options: IProviderOptions;
}) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0, staleTime: 0 } } });

  const store = isObject(options?.initialStore)
    ? options.initialStore
    : options?.storePreset
    ? getStateFromPreset(options.storePreset)
    : {};

  return (
    <ThemeProvider theme={theme}>
      <MathJaxProvider>
        <QueryClientProvider client={queryClient}>
          <StoreProvider createStore={useCreateStore(store)}>
            <Container maxW="container.lg">
              {children}
              <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
            </Container>
          </StoreProvider>
        </QueryClientProvider>
      </MathJaxProvider>
    </ThemeProvider>
  );
};

const getStateFromPreset = (preset: IProviderOptions['storePreset']): Partial<AppState> => {
  switch (preset) {
    case 'orcid-authenticated':
      return {
        orcid: {
          active: true,
          isAuthenticated: true,
          user: mockOrcidUser,
        },
      };
  }
};

const renderComponent = (
  ui: ReactElement,
  providerOptions?: IProviderOptions,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  const result = render(ui, {
    wrapper: ({ children }) => <DefaultProviders options={providerOptions}>{children}</DefaultProviders>,
    ...options,
  });
  const user = userEvent.setup();
  return { user, ...result };
};

const renderHookComponent = <T extends AnyFunction, TResult = ReturnType<T>, TProps = Parameters<T>>(
  hook: Parameters<typeof renderHook<TResult, TProps>>[0],
  providerOptions?: IProviderOptions,
  options?: Omit<Parameters<typeof renderHook<TResult, TProps>>[1], 'wrapper'>,
) => {
  return renderHook<TResult, TProps>(hook, {
    wrapper: ({ children }) => <DefaultProviders options={providerOptions}>{children}</DefaultProviders>,
    ...options,
  });
};

export * from '@testing-library/react';
export { renderComponent as render };
export { renderHookComponent as renderHook };
