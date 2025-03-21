import { render } from '@/test-utils';
import { beforeEach, describe, test, vi } from 'vitest';
import PaperForm_bak from '../pages/paper-form_bak';

const router = {
  pathname: '/',
  push: vi.fn(),
  asPath: '/',
};
vi.mock('next/compat/router', () => ({
  useRouter: () => router,
}));

describe('Paper Form', () => {
  beforeEach(() => router.push.mockReset());

  test('renders without error', () => {
    render(<PaperForm_bak />);
  });

  test.todo('journal search works');
  test.todo('reference form works');
  test.todo('bibcode query form works');
  test.todo('error messages show up properly');
});
