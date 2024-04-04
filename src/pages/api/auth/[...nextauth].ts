import NextAuth, { AuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { ApiTargets } from '@api/models';
import { ICSRFResponse, IUserCredentials, IUserData, IUserRegistrationCredentials } from '@api';
import { logger } from '@logger';
import { Agent, fetch } from 'undici';
import { isFuture, parseISO } from 'date-fns';

const ANON = 'anonymous@ads';
const makeAPIURL = (path: string) => `${process.env.API_HOST_SERVER}${path}`;

const fetchADSCSRF = async () => {
  try {
    const res = await fetch(makeAPIURL(ApiTargets.CSRF), {
      method: 'GET',
      dispatcher: new Agent({ connect: { timeout: 30_000 } }),
    });

    const { csrf }: Partial<ICSRFResponse> = await res.json();
    if (res.ok && csrf) {
      return { csrf, sessionCookie: res.headers.get('set-cookie') };
    } else {
      return { csrf: '', setCookie: '' };
    }
  } catch (error) {
    logger.error({ error, msg: 'Failed to fetch the CSRF token for login' });
  }
  return { csrf: '', setCookie: '' };
};

const login = async (credentials: IUserCredentials): Promise<User> => {
  const { csrf, sessionCookie } = await fetchADSCSRF();
  console.log('csrf', csrf, 'sessionCookie', sessionCookie);

  const res = await fetch(makeAPIURL(ApiTargets.USER), {
    method: 'POST',
    headers: {
      'X-CSRFToken': csrf,
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      username: credentials.email,
      password: credentials.password,
    }),
    dispatcher: new Agent({ connect: { timeout: 30_000 } }),
  });
  const user: { message?: string; error?: string } = await res.json();

  logger.debug({ user, msg: 'Login response' });

  if (res.ok && user.message === 'success') {
    return { id: credentials.email, email: credentials.email, sessionCookie: res.headers.get('set-cookie') };
  } else if (user.error) {
    throw new Error(user.error);
  }
  throw new Error('Unable to login');
};

/**
 * Checks if the user data is valid
 * @param userData
 */
export const isUserData = (userData?: Partial<IUserData>): userData is IUserData => {
  return (
    typeof userData !== 'undefined' &&
    typeof userData.access_token === 'string' &&
    typeof userData.expire_in === 'string' &&
    typeof userData.username === 'string' &&
    userData.access_token.length > 0 &&
    userData.expire_in.length > 0 &&
    userData.username.length > 0
  );
};

export const isValidAccessToken = (token: string, expire: string): boolean => {
  return (
    typeof token === 'string' &&
    token.length > 0 &&
    typeof expire === 'string' &&
    expire.length > 0 &&
    isFuture(parseISO(expire))
  );
};

const bootstrap = async (sessionCookie = '') => {
  try {
    const res = await fetch(makeAPIURL(ApiTargets.BOOTSTRAP), {
      method: 'GET',
      headers: {
        Cookie: sessionCookie,
      },
      dispatcher: new Agent({ connect: { timeout: 30_000 } }),
    });

    const data: Partial<IUserData> = await res.json();
    logger.debug({ data, msg: 'Bootstrap response' });

    if (res.ok && isUserData(data)) {
      return { access_token: data.access_token, expire_in: data.expire_in, username: data.username };
    }
  } catch (error) {
    logger.error({ msg: 'Failed to bootstrap user data', error });
  }
  return { access_token: '', expire_in: '', username: '' };
};

const register = async (credentials: IUserRegistrationCredentials): Promise<User> => {
  const { csrf, sessionCookie } = await fetchADSCSRF();
  try {
    const res = await fetch(makeAPIURL(ApiTargets.REGISTER), {
      method: 'POST',
      headers: {
        'X-CSRFToken': csrf,
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        email: credentials.email,
        password1: credentials.password,
        password2: credentials.confirmPassword,
        'g-recaptcha-response': credentials.recaptcha,
      }),
      dispatcher: new Agent({ connect: { timeout: 30_000 } }),
    });

    const registerResult: { message?: string; error?: string } = await res.json();
    logger.debug({ registerResult, msg: 'Register response' });

    if (res.ok && registerResult.message === 'success') {
      return { id: ANON, email: ANON, sessionCookie };
    }
  } catch (error) {
    logger.error({ error, msg: 'Failed to register' });
  }

  return null;
};

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'anon',
      name: 'Anonymous',
      credentials: {},
      async authorize() {
        logger.debug('Anonymous login');
        return Promise.resolve({ id: ANON, email: ANON, sessionCookie: '' });
      },
    }),
    CredentialsProvider({
      id: 'login',
      name: 'Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize(credentials) {
        logger.debug({ msg: 'login', credentials });

        return login(credentials);
      },
    }),
    CredentialsProvider({
      id: 'register',
      name: 'Register',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        confirmPassword: { label: 'Confirm Password', type: 'password' },
        recaptcha: { label: 'ReCAPTCHA', type: 'text' },
      },
      authorize(credentials) {
        logger.debug({ msg: 'register', credentials });
        return register(credentials);
      },
    }),
  ],
  callbacks: {
    async session({ session, token, user }) {
      logger.debug({ msg: 'session', session, token, user });

      // expose the api token to the frontend
      session.user.apiToken = token.access_token;
      session.user.isLoggedIn = token.sub !== ANON;
      return Promise.resolve(session);
    },
    async redirect({ url, baseUrl }) {
      logger.debug({ url, baseUrl, msg: 'redirect' });
      return url.startsWith(baseUrl) ? Promise.resolve(url) : Promise.resolve(baseUrl);
    },
    async signIn({ user, account, profile, email, credentials }) {
      logger.debug({ msg: 'signIn', user, account, profile, email, credentials });
      return Promise.resolve(true);
    },
    async jwt({ token, account, user, ...rest }) {
      logger.debug({
        token,
        account,
        ...rest,
        msg: 'jwt',
        isValid: isValidAccessToken(token.access_token, token.expire_in),
      });

      if (account) {
        if (account.provider === 'anon' && !isValidAccessToken(token.access_token, token.expire_in)) {
          const apiData = await bootstrap();
          token.sub = ANON;
          token.email = ANON;
          token.access_token = apiData.access_token;
          token.expire_in = apiData.expire_in;
        }

        if (account.provider === 'login') {
          const apiData = await bootstrap(user?.sessionCookie);
          token.sub = apiData.username;
          token.access_token = apiData.access_token;
          token.expire_in = apiData.expire_in;
          token.email = apiData.username;
        }
      }

      return token;
    },
  },
  pages: {
    signIn: '/user/account/login',
    newUser: '/user/account/welcome',
  },
  logger: {
    error(code, metadata) {
      logger.error({ code, metadata });
    },
    warn(code) {
      logger.warn({ code });
    },
    debug(code, metadata) {
      logger.debug({ code, metadata });
    },
  },
};

export default NextAuth(authOptions);
