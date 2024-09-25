import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { TRACING_HEADERS } from '@/config';
import { logger } from '@/logger';
import { ApiTargets } from '@/api/models';

export interface IBootstrapPayload {
  username: string;
  scopes: string[];
  client_id: string;
  access_token: string;
  client_name: string;
  token_type: string;
  ratelimit: number;
  anonymous: boolean;
  client_secret: string;
  expire_in: string;
  refresh_token: string;
  message?: string;
}

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface User {
    username: string;
    anonymous: boolean;
    token: string;
    expires: string;
  }

  interface Session {
    user: {
      username: string;
      token: string;
    }
  }
}

const getHeaders = (req: Request) => {
  const headers = new Headers();
  TRACING_HEADERS.forEach((key) => {
    if (req.headers.has(key)) {
      headers.set(key, req.headers.get(key));
    }
  });
  headers.set('Cookie', req.headers.get('cookie'));
  return headers;
};

const bootstrap = async (req: Request) => {
  logger.debug('Bootstrapping');
  try {
    const res = await fetch(
      `${process.env.API_HOST_SERVER}${ApiTargets.BOOTSTRAP}`,
      {
        method: 'GET',
        headers: getHeaders(req),
        cache: 'no-cache',
      },
    );

    const json = await res.json() as IBootstrapPayload;
    logger.debug({ json }, 'Bootstrap Successful');

    return json;
  } catch (err) {
    logger.error({ err }, 'Bootstrap failed');
    return null;
  }
};


export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: 'anonymous',
      credentials: {
        username: {},
      },
      authorize: async (_, request) => {
        logger.debug('anon');
        const res = await bootstrap(request);
        logger.debug({ res }, 'bootstrappping?');
        return {
          username: res.username,
          anonymous: res.anonymous,
          token: res.access_token,
          expires: res.expire_in,
        };
      },
    }),
    Credentials({
      credentials: {
        email: {},
        password: {}
      },
      authorize: async (credentials) => {

        const user = {
          "username": "anonymous@ads",
          "scopes": [
            "api",
            "execute-query",
            "store-query"
          ],
          "client_id": "Z636RiJG5oU2mrmukf5AI6ior326NDHqWzP5gOP7",
          "access_token": "1V0a0Co8vDCOrn0U2h8Qx47EAPaXFCfk9huNb02k",
          "client_name": "BB client",
          "token_type": "Bearer",
          "ratelimit": 1.0,
          "anonymous": true,
          "client_secret": "0vnegyIit7AI1DjsuKXufkoI8RJQ9egEJux48ycBaCNZB8zqeNTH9lAgT1El",
          "expire_in": "2024-09-25T04:07:51.287158",
          "refresh_token": "KcGEBDwjH3ck6Ft8kv6AhFGgqFknfXhPKZ4BBtvm"
        }

        return Promise.resolve({
          username: user.username,
          anonymous: user.anonymous,
          token: user.access_token,
          expires: user.expire_in
        });
      },
    })
  ],
  callbacks: {
    async authorized({}) {

    },
    session({ session, token, user }) {
      console.log('session callback', {
        session, token, user,
      });
      return {
        ...session,
        user: {
          ...session.user,
          ...user,
        },
      };
    },
  },
  logger: {
    error: (...args) =>
  },
})
