import { RequestInternal } from 'next-auth';
import axios, { AxiosResponse } from 'axios';
import { IBootstrapPayload, ICSRFResponse } from '@/api/user';
import { ApiTargets } from '@/api/models';
import { defaultRequestConfig } from '@/api/config';
import { ApiRequestConfig } from '@/api/api';
import { z } from 'zod';
import {
  AccountNotVerifiedError,
  AccountValidationError,
  InvalidCredentialsError,
  InvalidCSRFError,
  MethodNotAllowedError,
  UserNotFoundError,
} from '@/Error';
import { logger } from '@/logger';
import { isPast, parseISO } from 'date-fns';

const HEADERS_TO_FORWARD = [
  'X-Original-Url',
  'X-Original-Forwarded-For',
  'X-Forwarded-For',
  'X-Amzn-Trace-Id'
];

const getForwardedHeaders = <T extends Record<string, unknown>>(headers: T): T => {
  const out = {} as T;
  for (const key in headers) {
    if(HEADERS_TO_FORWARD.includes(key)) {
      out[key] = headers[key];
    }
  }
  return out;
}

const log = logger.child({}, { msgPrefix: '[auth] ' });

type LoginCreds = {
  email: string;
  password: string;
};
const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(4),
  })
  .required() as z.ZodSchema<LoginCreds>;

type NextAuthRequest = Pick<RequestInternal, 'body' | 'query' | 'headers' | 'method'>;
type AccountsResponse = { message?: string; error?: string }

export const loginAnonymousUser = async (req: NextAuthRequest) => {
  log.debug({ msg: 'logging in anonymous user'});
  return await bootstrap(req);
}

export const loginUser = async (creds: LoginCreds, req: NextAuthRequest) => {
  log.debug({ msg: 'logging in user', creds });

  if (req.method !== 'POST') {
    throw new MethodNotAllowedError();
  }

  if (!loginSchema.safeParse(creds).success) {
    throw new InvalidCredentialsError();
  }
  const config = await configWithCSRF({
    ...defaultRequestConfig,
    method: 'post',
    url: ApiTargets.USER,
    data: {
      username: creds.email,
      password: creds.password,
    },
    headers: {
      ...defaultRequestConfig.headers,
      ...getForwardedHeaders(req.headers)
    },
  }, req.headers);

  try {
    const { status, headers } = await axios.request<AccountsResponse>(config);

    if (status === 200) {
      log.debug('Login successful');
      return await bootstrap({ headers })
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 403) {
        throw new AccountNotVerifiedError({ error });
      }
      if (error.response?.status === 400) {
        throw new InvalidCredentialsError({ error });
      }
    }
    throw error;
  }
};


const fetchCSRF = async (req: NextAuthRequest) => {
  log.debug({ msg: 'Fetching CSRF token' });
  try {
    return await axios.get<ICSRFResponse, AxiosResponse<ICSRFResponse>>(ApiTargets.CSRF, {
      ...defaultRequestConfig,
      headers: {
        ...defaultRequestConfig.headers,
        ...getForwardedHeaders(req.headers)
      },
    });
  } catch (error) {
    throw new InvalidCSRFError({ error });
  }
};

export const configWithCSRF = async (config: ApiRequestConfig, req: NextAuthRequest): Promise<ApiRequestConfig> => {
  const { data, headers } = await fetchCSRF(req);
  return {
    ...config,
    xsrfHeaderName: 'X-CSRFToken',
    headers: {
      ...config.headers,
      ...getForwardedHeaders(req.headers),
      'X-CSRFToken': data.csrf,
      Cookie: headers['set-cookie'],
    },
  } satisfies ApiRequestConfig;
};

const bootstrap = async (req: NextAuthRequest): Promise<IBootstrapPayload> => {
  const config: ApiRequestConfig = {
    ...defaultRequestConfig,
    headers: {
      ...defaultRequestConfig.headers,
      ...getForwardedHeaders(req.headers)
    },
    method: 'GET',
    url: ApiTargets.BOOTSTRAP,
  };

  try {
    const { data } = await axios.request<IBootstrapPayload>(config);

    if (data) {
      log.debug({ msg: 'Bootstrap successful', data });
      return data;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 403) {
        throw new AccountNotVerifiedError({ error });
      } else if (error.response?.status === 401) {
        throw new UserNotFoundError({ error });
      } else if(error.response?.status === 400) {
        throw new AccountValidationError({ error });
      }
    }
    throw error;
  }
};


export const tokenIsExpired = (expires: string) => {
  log.debug({ msg: 'Checking token expiry', expires });
  return typeof expires !== 'string' || isPast(parseISO(expires));
};
