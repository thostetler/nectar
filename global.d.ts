import { SetupServerApi } from 'msw/node';
import { DefaultSession } from 'next-auth';

declare module 'vitest' {
  export interface TestContext {
    server?: SetupServerApi;
  }
}

declare module 'iron-session' {
  interface IronSessionData {
    token?: {
      access_token: string;
      anonymous: boolean;
      expire_in: string;
      username: string;
    };
    isAuthenticated?: boolean;
    apiCookieHash?: string;
    bot?: boolean;
  }
}

declare module 'next-auth' {
  interface User {
    id: string;
    sessionCookie: string;
  }

  interface Session {
    user: {
      apiToken: string;
      isLoggedIn: boolean;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    access_token?: string;
    expire_in?: string;
    id: string;
  }
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
      BASE_CANONICAL_URL: string;
      API_HOST_CLIENT: string;
      API_HOST_SERVER: string;
      NEXT_PUBLIC_API_HOST_CLIENT: string;
      COOKIE_SECRET: string;
      ADS_SESSION_COOKIE_NAME: string;
      SCIX_SESSION_COOKIE_NAME: string;
      NEXT_PUBLIC_ORCID_CLIENT_ID: string;
      NEXT_PUBLIC_ORCID_API_URL: string;
      NEXT_PUBLIC_ORCID_REDIRECT_URI: string;
      REDIS_HOST: string;
      REDIS_PORT: string;
      REDIS_PASSWORD: string;
      REDIS_MAX_AGE: string;
      VERIFIED_BOTS_ACCESS_TOKEN: string;
      UNVERIFIABLE_BOTS_ACCESS_TOKEN: string;
      MALICIOUS_BOTS_ACCESS_TOKEN: string;
      NEXT_PUBLIC_GTM_ID: string;
      NEXT_PUBLIC_RECAPTCHA_SITE_KEY: string;
      NEXT_PUBLIC_API_MOCKING: string;
      NEXT_PUBLIC_SENTRY_DSN: string;
      NEXT_PUBLIC_SENTRY_PROJECT_ID: string;
      GIT_SHA: string;
      CSP_REPORT_URI: string;
      CSP_REPORT_ONLY: string;
      MAILSLURP_API_KEY: string;
      NEXT_PUBLIC_SEARCH_API_TIMEOUT_MS: string;
      NEXT_PUBLIC_SEARCH_SSR_API_TIMEOUT_MS: string;
    }
  }
}
