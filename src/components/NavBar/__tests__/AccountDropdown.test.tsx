import { describe, expect, test, vi } from 'vitest';
import { AccountDropdown } from '../AccountDropdown';
import { ListType } from '../types';
import { render, screen } from '@/test-utils';
import { NextRouter } from 'next/router';

const createMockRouter = (initial: Partial<NextRouter> = {}): NextRouter => {
  const router: Partial<NextRouter> = {
    basePath: '',
    pathname: '/search',
    route: '/search',
    asPath: '/search?q=star',
    query: { q: 'star' },
    isReady: true,
    isLocaleDomain: false,
    isPreview: false,
    isFallback: false,
    push: vi.fn().mockResolvedValue(true),
    replace: vi.fn().mockResolvedValue(true),
    reload: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn().mockResolvedValue(undefined),
    beforePopState: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    ...initial,
  };
  return router as NextRouter;
};

let mockRouter: NextRouter;

vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

const openLoginItem = async (user: ReturnType<typeof render>['user']) => {
  await user.click(screen.getByRole('button', { name: /account/i }));
  await user.click(await screen.findByText('Login'));
};

describe('AccountDropdown', () => {
  test('returns the user to the current path after login', async () => {
    mockRouter = createMockRouter({ asPath: '/search?q=star' });

    const { user } = render(<AccountDropdown type={ListType.DROPDOWN} />);
    await openLoginItem(user);

    expect(mockRouter.push).toHaveBeenCalledWith(`/user/account/login?next=${encodeURIComponent('/search?q=star')}`);
  });

  test('drops a consumed notify param from the next param', async () => {
    mockRouter = createMockRouter({ asPath: '/search?q=star&notify=account-logout-success' });

    const { user } = render(<AccountDropdown type={ListType.DROPDOWN} />);
    await openLoginItem(user);

    expect(mockRouter.push).toHaveBeenCalledWith(`/user/account/login?next=${encodeURIComponent('/search?q=star')}`);
  });

  test('omits the next param on the landing page', async () => {
    mockRouter = createMockRouter({ asPath: '/', pathname: '/', route: '/', query: {} });

    const { user } = render(<AccountDropdown type={ListType.DROPDOWN} />);
    await openLoginItem(user);

    expect(mockRouter.push).toHaveBeenCalledWith('/user/account/login');
  });
});
