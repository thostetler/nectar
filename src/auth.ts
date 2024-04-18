import axios, { AxiosResponse, HttpStatusCode } from 'axios';
import { IBootstrapPayload, ICSRFResponse } from '@/api/user';
import { ApiTargets } from '@/api/models';
import { defaultRequestConfig } from '@/api/config';
import { ApiRequestConfig } from '@/api/api';
import { z } from 'zod';
import { AccountNotVerified, InvalidCredentials, InvalidCSRF, UnableToValidateAccount, UserNotFound } from '@/error';
import { logger } from '@/logger';
import { isPast, parseISO } from 'date-fns';
import { NextApiRequest, NextApiResponse } from 'next';

const HEADERS_TO_FORWARD = [
  'X-Original-Url',
  'X-Original-Forwarded-For',
  'X-Forwarded-For',
  'X-Amzn-Trace-Id',
] as const;

export const getForwardedHeaders = (headers: NextApiRequest['headers']) => {
  const out = {} as Record<string, string>;
  for (const key in headers) {
    if (HEADERS_TO_FORWARD.includes(key)) {
      out[key] = headers[key] as string;
    }
  }
  return out;
};

const getSetCookieHeader = (headers: AxiosResponse['headers']) => {
  if (!headers) {
    return '';
  }
  const setCookie = headers['set-cookie'];
  if (Array.isArray(setCookie)) {
    return setCookie[0];
  }
  return setCookie;
};

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

type AccountsResponse = { message?: string; error?: string }

export const bootstrapUser = async (req: NextApiRequest, res: NextApiResponse) => {
  const { data, headers } = await bootstrap(req);
  res.appendHeader('set-cookie', getSetCookieHeader(headers));
  return data;
};

export const loginUser = async (creds: LoginCreds, req: NextApiRequest, res: NextApiResponse) => {
  log.debug({ msg: 'logging in user', creds });

  if (!loginSchema.safeParse(creds).success) {
    throw new InvalidCredentials();
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
      ...getForwardedHeaders(req.headers),
    },
  }, req);

  try {
    log.debug('Attempting to authenticate user');
    const { status, headers: resHeaders } = await axios.request<AccountsResponse>(config);

    if (status === HttpStatusCode.Ok) {
      log.debug('Authentication successful');
      const { data, headers } = await bootstrap(req, getSetCookieHeader(resHeaders));
      res.appendHeader('set-cookie', getSetCookieHeader(headers));
      return data;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      switch (error.response?.status) {
        case HttpStatusCode.BadRequest:
        case HttpStatusCode.Unauthorized:
          throw new InvalidCredentials(error);
        case HttpStatusCode.Forbidden:
          throw new AccountNotVerified(error);
      }
    }
    throw error;
  }
};


const fetchCSRF = async (req: NextApiRequest) => {
  log.debug({ msg: 'Fetching CSRF token' });
  try {
    return await axios.get<ICSRFResponse, AxiosResponse<ICSRFResponse>>(ApiTargets.CSRF, {
      ...defaultRequestConfig,
      headers: {
        ...defaultRequestConfig.headers,
        ...getForwardedHeaders(req.headers),
      },
    });
  } catch (error) {
    throw new InvalidCSRF(error);
  }
};

export const configWithCSRF = async (config: ApiRequestConfig, req: NextApiRequest): Promise<ApiRequestConfig> => {
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

const bootstrap = async (req?: NextApiRequest, setCookieHeader?: string): Promise<AxiosResponse<IBootstrapPayload>> => {
  try {
    const config: ApiRequestConfig = {
      ...defaultRequestConfig,
      headers: {
        ...defaultRequestConfig.headers,
        ...getForwardedHeaders(req?.headers),
        ...(typeof setCookieHeader === 'string' ? { Cookie: setCookieHeader } : {}),
      },
      method: 'GET',
      url: ApiTargets.BOOTSTRAP,
    };

    log.debug({ msg: 'Bootstrapping user', config });
    return await axios.request<IBootstrapPayload>(config);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      switch (error.response?.status) {
        case 400:
          throw new UnableToValidateAccount(error);
        case 401:
          throw new UserNotFound(error);
        case 403:
          throw new AccountNotVerified(error);
      }
    }
    throw error;
  }
};

export const refreshToken = async (req?: NextApiRequest) => {
  log.debug('Refreshing token');
  // since no easy way to actually refresh the token, we just bootstrap again
  return await bootstrap(req);
};


export const apiTokenIsExpired = (expires: string) => {
  const isExpired = typeof expires !== 'string' || isPast(parseISO(expires));
  log.debug({ msg: 'Checking token expiry', expires, isExpired });
  return isExpired;
};
