import api, { IBootstrapPayload } from '@/api';
import { ApiRequestConfig } from '@/api/api';
import { APP_STORAGE_KEY } from '@/store';
import { createServerListenerMocks } from '@/test-utils';
import { rest } from 'msw';
import { map, path, pipe, repeat } from 'ramda';
import { beforeEach, expect, Mock, test, TestContext, vi } from 'vitest';
import { IApiUserResponse } from '@/pages/api/user';

global.alert = vi.fn();

const API_USER = '/api/user';

const mockUserData: Pick<IBootstrapPayload, 'username' | 'access_token' | 'anonymous' | 'expire_in'> = {
  username: 'anonymous@ads',
  access_token: 'yDCIgkpQjCrNWUqTfVbrrmBYImY6bJHWlHON45eq',
  anonymous: true,
  expire_in: '2099-03-22T14:50:07.712037',
};
const invalidMockUserData: Pick<IBootstrapPayload, 'username' | 'access_token' | 'anonymous' | 'expire_in'> = {
  username: 'anonymous@ads',
  access_token: '',
  anonymous: true,
  expire_in: '',
};

const testHandler = rest.get('*test', (req, res, ctx) => {
  return res(ctx.status(200), ctx.json({ ok: true }));
});

const unAuthorizedHandler = rest.get('*test', (req, res, ctx) =>
  res(ctx.status(401), ctx.json({ message: 'User unauthorized' })),
);

const unAuthorizedRequest = () => api.request({ method: 'GET', url: '/test' });

const testRequest = (params?: Record<string, string>, config: Partial<ApiRequestConfig> = {}) =>
  api.request({
    method: 'GET',
    params,
    url: '/test',
    ...config,
  });

const urls = pipe<[Mock], Record<string, unknown>[], string[]>(
  path(['mock', 'calls']),
  map(path(['0', 'url', 'pathname'])),
);

beforeEach(() => api.reset());

test('basic request calls bootstrap and adds auth', async ({ server }: TestContext) => {
  const { onRequest: onReq, onResponse: onRes } = createServerListenerMocks(server);
  server.use(testHandler);

  await testRequest();

  expect(onReq).toBeCalledTimes(2);

  // first request was intercepted and bootstrapped
  expect(urls(onReq)[0]).toEqual(API_USER);
  // the refresh header was added to force a new session
  expect(onReq.mock.calls[0][0].headers.get('X-Refresh-Token')).toEqual('1');

  const expectedToken = (JSON.parse(onRes.mock.calls[0][0].body) as IApiUserResponse).user.access_token;

  expect(onReq.mock.calls[1][0].headers.get('authorization')).toEqual(`Bearer ${expectedToken}`);
  expect(onReq.mock.calls[1][0].headers.get('cookie')).toEqual('session=test-session');
});

test('passing token initially skips bootstrap', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);
  server.use(testHandler);
  api.setUserData(mockUserData);
  await testRequest();

  // only a single call since bootstrapping was unnecessary
  expect(onReq).toBeCalledTimes(1);
  expect(onReq.mock.calls[0][0].headers.get('authorization')).toEqual(`Bearer ${mockUserData.access_token}`);
  expect(onReq.mock.calls[0][0].headers.get('cookie')).toEqual('session=test-session');
});

test('expired userdata causes bootstrap', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);
  server.use(testHandler);
  api.setUserData({ ...mockUserData, expire_in: '1977-03-22T14:50:07.712037' });
  await testRequest();

  expect(onReq).toBeCalledTimes(2);
  expect(urls(onReq)[0]).toEqual(API_USER);
});

test('bootstrap is not retried after a single failure', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);
  server.use(testHandler);
  server.use(
    rest.get(`*${API_USER}`, (_, res, ctx) => {
      return res(ctx.status(500, 'Server Error'));
    }),
  );

  await expect(testRequest).rejects.toThrowError('Unrecoverable Error, unable to refresh token');

  expect(onReq).toBeCalledTimes(3);
  expect(urls(onReq)).toEqual(repeat(API_USER, 3));
});

test('if user data set in local storage, it is used instead of bootstrapping', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);
  server.use(testHandler);
  global.localStorage.setItem(
    APP_STORAGE_KEY,
    JSON.stringify({ state: { user: { ...mockUserData, access_token: 'from-local-storage' } } }),
  );

  await testRequest();
  expect(onReq).toBeCalledTimes(1);
  expect(onReq.mock.calls[0][0].headers.get('authorization')).toEqual(`Bearer from-local-storage`);
  global.localStorage.clear();
});

test('expired user data set in local storage causes bootstrap', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);
  server.use(testHandler);
  global.localStorage.setItem(
    APP_STORAGE_KEY,
    JSON.stringify({
      state: {
        user: { ...mockUserData, access_token: 'from-local-storage', expire_in: '1900-03-22T14:50:07.712037' },
      },
    }),
  );

  await testRequest();
  expect(onReq).toBeCalledTimes(2);
  expect(urls(onReq)[0]).toEqual(API_USER);
  global.localStorage.clear();
});

test('401 response triggers bootstrap to refresh token', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);
  server.use(testHandler);
  server.use(
    rest.get('*test', (req, res, ctx) => {
      return res.once(ctx.status(401), ctx.json({ error: 'Not Authorized' }));
    }),
  );

  const { data } = await testRequest();
  expect(data).toEqual({ ok: true });
  expect(onReq).toBeCalledTimes(4);
  expect(urls(onReq)).toEqual([
    // initial bootstrap because we don't have any userData stored
    API_USER,

    // this request will fail, triggering a refresh
    '/test',

    // refresh and retry original request
    API_USER,
    '/test',
  ]);
});

test('401 does not cause infinite loop if bootstrap repeatedly fails', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);
  server.use(testHandler);
  server.use(
    rest.get('*test', (req, res, ctx) => {
      return res.once(ctx.status(401), ctx.json({ error: 'Not Authorized' }));
    }),
    rest.get(`*${API_USER}`, (_, res, ctx) => {
      return res.once(ctx.status(200), ctx.json({ user: mockUserData, isAuthenticated: false }));
    }),
    rest.get(`*${API_USER}`, (_, res, ctx) => {
      return res(ctx.status(500, 'Server Error'));
    }),
  );

  await expect(testRequest).rejects.toThrowError('Unrecoverable Error, unable to refresh token');

  expect(onReq).toBeCalledTimes(5);
  expect(urls(onReq)).toEqual([
    // initial bootstrap since we don't have userData
    API_USER,

    // this request will fail
    '/test',

    // all bootstrap calls will repeat since the rest fail, initial + 2 retries
    ...repeat(API_USER, 3),
  ]);
});

test('401 with initial bootstrap failure works properly', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);
  server.use(testHandler);
  server.use(
    rest.get('*test', (req, res, ctx) => {
      return res.once(ctx.status(401), ctx.json({ error: 'Not Authorized' }));
    }),
    rest.get(`*${API_USER}`, (_, res, ctx) => {
      return res.once(ctx.status(200), ctx.json({ user: mockUserData, isAuthenticated: false }));
    }),
    rest.get(`*${API_USER}`, (_, res, ctx) => {
      return res.once(ctx.status(500, 'Server Error'));
    }),
  );

  const { data } = await testRequest();
  expect(data).toEqual({ ok: true });

  expect(onReq).toBeCalledTimes(5);
  expect(urls(onReq)).toEqual([
    // initial bootstrap, this one succeeds
    API_USER,

    // 401 response
    '/test',

    // this bootstrap will fail, second succeeds
    ...repeat(API_USER, 2),

    // authenticated request succeeds
    '/test',
  ]);
});

/**
 * This tests the case that a request has a valid token, but for some
 * reason is still giving a 401 after refetching the token
 */
test('repeated 401s do not cause infinite loop', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);
  server.use(unAuthorizedHandler);

  await expect(unAuthorizedRequest).rejects.toThrowError();

  expect(onReq).toBeCalledTimes(4);
  expect(urls(onReq)).toEqual([
    // successful
    API_USER,

    // 401
    '/test',

    // successful
    API_USER,

    // 401 again, this should throw an error and abort re-bootstrapping
    '/test',
  ]);
});

test('request fails without a response body are rejected', async ({ server }: TestContext) => {
  server.use(rest.get('*test', (_req, res, ctx) => res(ctx.delay('infinite'), ctx.status(400, 'error'))));

  // simulates a timeout, by aborting the request after a timeout
  const control = new AbortController();
  setTimeout(() => control.abort(), 50);
  await expect(testRequest({}, { signal: control.signal })).rejects.toThrowError();
});

test('request rejects if the refreshed user data is not valid', async ({ server }: TestContext) => {
  server.use(
    unAuthorizedHandler,
    rest.get(`*${API_USER}`, (_, res, ctx) => {
      return res.once(ctx.status(200), ctx.json({ user: invalidMockUserData, isAuthenticated: false }));
    }),
  );
  global.localStorage.setItem(
    APP_STORAGE_KEY,
    JSON.stringify({ state: { user: { ...mockUserData, access_token: 'from-local-storage' } } }),
  );
  const { onRequest: onReq } = createServerListenerMocks(server);

  api.setUserData(mockUserData);

  await expect(testRequest).rejects.toThrowError();

  // after the 401 from `test` we try to bootstrap, it's invalid so we reject
  expect(onReq).toBeCalledTimes(2);
  expect(urls(onReq)).toEqual(['/test', API_USER]);
});
