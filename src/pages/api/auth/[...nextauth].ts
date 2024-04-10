import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { logger } from '@/logger';
import { loginAnonymousUser, loginUser, tokenIsExpired } from '@/auth';

const log = logger.child({}, { msgPrefix: '[auth] ' });

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {},
      id: 'anonymous',
      name: 'anonymous',
      async authorize(_, req) {
        try {
          const user = await loginAnonymousUser(req);

          return { id: user.username, apiToken: user.access_token, expires: user.expire_in };
        } catch (error) {
          log.error({ msg: 'Failed to authorize anonymous user', error });
          return null;
        }
      },
    }),
    CredentialsProvider({
      id: 'login',
      name: 'login',
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials, req) {
        try {
          const user = await loginUser(credentials, req);
          return { id: user.username, apiToken: user.access_token, expires: user.expire_in };
        } catch (error) {}
      },
    }),
  ],
  callbacks: {
    async session({ session, token, ...rest }) {
      log.debug({ msg: 'session', session, token, ...rest });
      session.user.apiToken = token.apiToken;
      session.user.isLoggedIn = token.sub !== 'anonymous@ads';
      session.error = token.error;
      return Promise.resolve(session);
    },
    async redirect({ url, baseUrl }) {
      log.debug({ msg: 'redirect', url, baseUrl });
      return url.startsWith(baseUrl) ? Promise.resolve(url) : Promise.resolve(baseUrl);
    },
    async jwt({ token, account, user, ...rest }) {
      log.debug({ msg: 'JWT', token, account, user, ...rest });
      token.error = undefined;

      if (account && user) {
        token.apiToken = user.apiToken;
        token.expires = user.expires;
      }

      if (tokenIsExpired(token.expires)) {
        log.debug({ msg: 'Token expired' });
        token.error = 'TokenExpired';
        return Promise.resolve(token);
      }
      return Promise.resolve(token);
    },
  },
  pages: {
    signIn: '/user/account/login',
  },
  logger: {
    error(code, metadata) {
      log.error({ code, metadata });
    },
    warn(code) {
      log.warn({ code });
    },
    debug(code, metadata) {
      log.debug({ code, metadata });
    },
  },
};

export default NextAuth(authOptions);
