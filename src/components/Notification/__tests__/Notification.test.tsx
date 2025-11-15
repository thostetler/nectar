import { render } from '@/test-utils';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { Notification } from '../Notification';

// Mock next/router
const mockRouter = {
  route: '/',
  pathname: '/',
  query: {},
  asPath: '/',
  events: {
    on: vi.fn(),
    off: vi.fn(),
  },
};

vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

describe('Notification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<Notification />);
  });

  test('renders empty fragment when no notification', () => {
    const { container } = render(<Notification />);
    // Should render nothing visible
    expect(container.textContent).toBe('');
  });

  test('subscribes to router events on mount', () => {
    render(<Notification />);

    expect(mockRouter.events.on).toHaveBeenCalledWith('routeChangeStart', expect.any(Function));
    expect(mockRouter.events.on).toHaveBeenCalledWith('routeChangeComplete', expect.any(Function));
    expect(mockRouter.events.on).toHaveBeenCalledWith('routeChangeError', expect.any(Function));
  });

  test('unsubscribes from router events on unmount', () => {
    const { unmount } = render(<Notification />);

    unmount();

    expect(mockRouter.events.off).toHaveBeenCalledWith('routeChangeStart', expect.any(Function));
    expect(mockRouter.events.off).toHaveBeenCalledWith('routeChangeComplete', expect.any(Function));
    expect(mockRouter.events.off).toHaveBeenCalledWith('routeChangeError', expect.any(Function));
  });

  test('component structure is correct', () => {
    const { container } = render(<Notification />);
    // Component renders an empty fragment, so container should have minimal content
    expect(container.textContent).toBe('');
  });
});
