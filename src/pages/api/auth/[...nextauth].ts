import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { logger } from '@/logger';
import { fetchUserData, isValidApiToken } from '@/auth-utils';

const Anon = 'anonymous' as const;
const log = logger.child({}, { msgPrefix: '[auth] ' });

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {},
      id: Anon,
      name: Anon,
      async authorize() {
        return Promise.resolve({ id: Anon, sessionCookie: '' });
      },
    }),
  ],
  callbacks: {
    async session({ session, token, ...rest }) {
      log.debug({ msg: 'session', session, token, ...rest });
      session.user.apiToken = token.access_token;
      session.user.isLoggedIn = token.sub !== Anon;
      return Promise.resolve(session);
    },
    async redirect({ url, baseUrl }) {
      log.debug({ msg: 'redirect', url, baseUrl });
      return url.startsWith(baseUrl) ? Promise.resolve(url) : Promise.resolve(baseUrl);
    },
    async signIn(...args) {
      log.debug({ msg: 'SignIn', ...args });
      return Promise.resolve(true);
    },
    async jwt({ token, account, user, ...rest }) {
      log.debug({ msg: 'JWT', token, account, user, ...rest });

      if (account) {
        if (account.provider === Anon && !isValidApiToken(token.access_token, token.expire_in)) {
          const { data: api } = await fetchUserData();
          token.sub = Anon;
          token.id = Anon;
          token.access_token = api.access_token;
          token.expire_in = api.expire_in;
        }
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
