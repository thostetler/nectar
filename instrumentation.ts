import * as Sentry from '@sentry/nextjs';

export async function register() {
  console.log('[instrumentation] Register function called, runtime:', process.env.NEXT_RUNTIME);

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[instrumentation] Initializing server resources...');

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'true',
    });
    console.log('[instrumentation] Sentry initialized for server');

    console.log('[instrumentation] Initializing Redis connection...');
    try {
      void (await import('./src/lib/redis'));
      console.log('[instrumentation] Redis module imported and connection initiated');
    } catch (err) {
      console.error('[instrumentation] Failed to import Redis module:', err);
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    console.log('[instrumentation] Initializing edge runtime resources...');

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'true',
    });
    console.log('[instrumentation] Sentry initialized for edge');
  }
}

export async function onRequestError(
  err: Error & { digest?: string },
  request: {
    path: string;
    method: string;
    headers: Headers;
  },
  context: {
    routerKind: 'Pages Router' | 'App Router';
    routePath: string;
    routeType: 'render' | 'route' | 'action' | 'middleware';
    renderSource: 'react-server-components' | 'react-server-components-payload' | 'server-rendering';
    revalidateReason: 'on-demand' | 'stale' | undefined;
  }
) {
  Sentry.captureException(err, {
    contexts: {
      nextjs: {
        request_path: request.path,
        request_method: request.method,
        router_kind: context.routerKind,
        route_path: context.routePath,
        route_type: context.routeType,
        render_source: context.renderSource,
        revalidate_reason: context.revalidateReason,
      },
    },
  });
}
