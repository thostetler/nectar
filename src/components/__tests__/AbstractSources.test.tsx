import { render } from '@/test-utils';
import { test, vi } from 'vitest';
import { AbstractSources } from '@/components';
import { doc } from '@/components/__mocks__/data';
import { noop } from '@/utils';

// chakra's accordion calls the scrollTo global, jsdom doesn't support it so stub it here
vi.stubGlobal('scrollTo', noop);

test('renders menu without crashing', () => {
  render(<AbstractSources doc={doc} style="menu" />);
});

test('renders accordion without crashing', () => {
  render(<AbstractSources doc={doc} style="accordion" />);
});
