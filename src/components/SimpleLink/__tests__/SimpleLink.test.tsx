import { render } from '@/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { SimpleLink } from '../SimpleLink';
import { Icon } from '@chakra-ui/react';

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

describe('SimpleLink', () => {
  test('renders without crashing', () => {
    render(<SimpleLink href="/test">Test Link</SimpleLink>);
  });

  test('renders children correctly', () => {
    const { getByText } = render(<SimpleLink href="/test">Click Me</SimpleLink>);
    expect(getByText('Click Me')).toBeInTheDocument();
  });

  test('handles internal links', () => {
    const { container } = render(<SimpleLink href="/internal-page">Internal Link</SimpleLink>);
    const linkElement = container.querySelector('a');
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).not.toHaveAttribute('target', '_blank');
  });

  test('handles external links with proper attributes', () => {
    const { container } = render(<SimpleLink href="https://example.com">External Link</SimpleLink>);
    const linkElement = container.querySelector('a');

    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute('target', '_blank');
    expect(linkElement).toHaveAttribute('rel', 'noopener');
  });

  test('opens in new tab when newTab prop is true', () => {
    const { container } = render(
      <SimpleLink href="/test" newTab>
        New Tab Link
      </SimpleLink>,
    );
    const linkElement = container.querySelector('a');

    expect(linkElement).toHaveAttribute('target', '_blank');
  });

  test('renders with icon', () => {
    const TestIcon = () => <Icon data-testid="test-icon" />;
    const { getByTestId } = render(
      <SimpleLink href="/test" icon={<TestIcon />}>
        Link with Icon
      </SimpleLink>,
    );

    expect(getByTestId('test-icon')).toBeInTheDocument();
  });

  test('applies custom className', () => {
    const { container } = render(
      <SimpleLink href="/test" className="custom-class">
        Custom Link
      </SimpleLink>,
    );
    const linkElement = container.querySelector('a');

    expect(linkElement).toHaveClass('custom-class');
  });

  test('handles URL object as href', () => {
    const urlObject = { pathname: '/test', query: { id: '123' } };
    render(<SimpleLink href={urlObject}>URL Object Link</SimpleLink>);
    // If it renders without error, the test passes
  });

  test('detects external https links correctly', () => {
    const { container } = render(<SimpleLink href="https://www.example.com">HTTPS Link</SimpleLink>);
    const linkElement = container.querySelector('a');

    expect(linkElement).toHaveAttribute('target', '_blank');
    expect(linkElement).toHaveAttribute('rel', 'noopener');
  });

  test('detects external http links correctly', () => {
    const { container } = render(<SimpleLink href="http://www.example.com">HTTP Link</SimpleLink>);
    const linkElement = container.querySelector('a');

    expect(linkElement).toHaveAttribute('target', '_blank');
    expect(linkElement).toHaveAttribute('rel', 'noopener');
  });
});
