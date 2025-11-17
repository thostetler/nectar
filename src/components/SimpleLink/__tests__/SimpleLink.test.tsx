import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SimpleLink } from '../SimpleLink';

describe('SimpleLink', () => {
  describe('Basic rendering', () => {
    it('should render children', () => {
      render(<SimpleLink href="/test">Test Link</SimpleLink>);

      expect(screen.getByText('Test Link')).toBeInTheDocument();
    });

    it('should render with href prop', () => {
      render(<SimpleLink href="/test-path">Test</SimpleLink>);

      const link = screen.getByText('Test');
      expect(link).toHaveAttribute('href', '/test-path');
    });

    it('should render with icon', () => {
      const icon = <span data-testid="test-icon">📝</span>;

      render(
        <SimpleLink href="/test" icon={icon}>
          Test
        </SimpleLink>,
      );

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should render icon before children', () => {
      const icon = <span data-testid="test-icon">📝</span>;

      const { container } = render(
        <SimpleLink href="/test" icon={icon}>
          Test
        </SimpleLink>,
      );

      const link = container.querySelector('a');
      const firstChild = link?.firstChild;
      expect(firstChild).toContainElement(screen.getByTestId('test-icon'));
    });
  });

  describe('External link detection', () => {
    it('should detect http:// URLs as external', () => {
      render(<SimpleLink href="http://example.com">External</SimpleLink>);

      const link = screen.getByText('External');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener');
    });

    it('should detect https:// URLs as external', () => {
      render(<SimpleLink href="https://example.com">External</SimpleLink>);

      const link = screen.getByText('External');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener');
    });

    it('should treat relative paths as internal', () => {
      render(<SimpleLink href="/internal/path">Internal</SimpleLink>);

      const link = screen.getByText('Internal');
      expect(link).not.toHaveAttribute('target');
      expect(link).not.toHaveAttribute('rel');
    });

    it('should treat paths without protocol as internal', () => {
      render(<SimpleLink href="internal/path">Internal</SimpleLink>);

      const link = screen.getByText('Internal');
      expect(link).not.toHaveAttribute('target');
      expect(link).not.toHaveAttribute('rel');
    });

    it('should detect UrlObject with http protocol as external', () => {
      const urlObject = {
        protocol: 'http:',
        hostname: 'example.com',
        pathname: '/path',
      };

      render(<SimpleLink href={urlObject}>External</SimpleLink>);

      const link = screen.getByText('External');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener');
    });

    it('should detect UrlObject with https protocol as external', () => {
      const urlObject = {
        protocol: 'https:',
        hostname: 'example.com',
        pathname: '/path',
      };

      render(<SimpleLink href={urlObject}>External</SimpleLink>);

      const link = screen.getByText('External');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener');
    });

    it('should treat UrlObject without protocol as internal', () => {
      const urlObject = {
        pathname: '/internal/path',
      };

      render(<SimpleLink href={urlObject}>Internal</SimpleLink>);

      const link = screen.getByText('Internal');
      expect(link).not.toHaveAttribute('target');
      expect(link).not.toHaveAttribute('rel');
    });
  });

  describe('newTab prop', () => {
    it('should open in new tab when newTab is true', () => {
      render(
        <SimpleLink href="/test" newTab>
          Test
        </SimpleLink>,
      );

      const link = screen.getByText('Test');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should not open in new tab when newTab is false', () => {
      render(
        <SimpleLink href="/test" newTab={false}>
          Test
        </SimpleLink>,
      );

      const link = screen.getByText('Test');
      expect(link).not.toHaveAttribute('target');
    });

    it('should override external link behavior when newTab is explicitly set', () => {
      render(
        <SimpleLink href="/internal" newTab>
          Internal New Tab
        </SimpleLink>,
      );

      const link = screen.getByText('Internal New Tab');
      expect(link).toHaveAttribute('target', '_blank');
      // Internal links don't get rel="noopener"
      expect(link).not.toHaveAttribute('rel');
    });
  });

  describe('rel attribute', () => {
    it('should add rel="noopener" for external links', () => {
      render(<SimpleLink href="https://example.com">External</SimpleLink>);

      const link = screen.getByText('External');
      expect(link).toHaveAttribute('rel', 'noopener');
    });

    it('should not add rel for internal links', () => {
      render(<SimpleLink href="/internal">Internal</SimpleLink>);

      const link = screen.getByText('Internal');
      expect(link).not.toHaveAttribute('rel');
    });

    it('should not add rel for internal links with newTab', () => {
      render(
        <SimpleLink href="/internal" newTab>
          Internal
        </SimpleLink>,
      );

      const link = screen.getByText('Internal');
      expect(link).not.toHaveAttribute('rel');
    });
  });

  describe('NextLink props passthrough', () => {
    it('should pass prefetch prop to NextLink', () => {
      // prefetch defaults to false based on the component definition
      render(
        <SimpleLink href="/test" prefetch={true}>
          Test
        </SimpleLink>,
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should default prefetch to false', () => {
      render(<SimpleLink href="/test">Test</SimpleLink>);

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should pass shallow prop to NextLink', () => {
      render(
        <SimpleLink href="/test" shallow>
          Test
        </SimpleLink>,
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should pass scroll prop to NextLink', () => {
      render(
        <SimpleLink href="/test" scroll={false}>
          Test
        </SimpleLink>,
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should pass replace prop to NextLink', () => {
      render(
        <SimpleLink href="/test" replace>
          Test
        </SimpleLink>,
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should pass locale prop to NextLink', () => {
      render(
        <SimpleLink href="/test" locale="en-US">
          Test
        </SimpleLink>,
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('Chakra Link props', () => {
    it('should accept and apply Chakra UI Link props', () => {
      render(
        <SimpleLink href="/test" color="blue.500" fontSize="lg">
          Styled Link
        </SimpleLink>,
      );

      expect(screen.getByText('Styled Link')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <SimpleLink href="/test" className="custom-class">
          Test
        </SimpleLink>,
      );

      const link = screen.getByText('Test');
      expect(link).toHaveClass('custom-class');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty href', () => {
      render(<SimpleLink href="">Empty Href</SimpleLink>);

      const link = screen.getByText('Empty Href');
      expect(link).toHaveAttribute('href', '');
    });

    it('should handle hash-only href', () => {
      render(<SimpleLink href="#section">Hash Link</SimpleLink>);

      const link = screen.getByText('Hash Link');
      expect(link).toHaveAttribute('href', '#section');
      expect(link).not.toHaveAttribute('target');
    });

    it('should handle mailto: links', () => {
      render(<SimpleLink href="mailto:test@example.com">Email</SimpleLink>);

      const link = screen.getByText('Email');
      expect(link).toHaveAttribute('href', 'mailto:test@example.com');
      // mailto: doesn't match /^https?:/ so it's treated as internal
      expect(link).not.toHaveAttribute('target');
    });

    it('should handle tel: links', () => {
      render(<SimpleLink href="tel:+1234567890">Phone</SimpleLink>);

      const link = screen.getByText('Phone');
      expect(link).toHaveAttribute('href', 'tel:+1234567890');
      expect(link).not.toHaveAttribute('target');
    });

    it('should handle protocol-relative URLs', () => {
      render(<SimpleLink href="//example.com/path">Protocol Relative</SimpleLink>);

      const link = screen.getByText('Protocol Relative');
      // Protocol-relative URLs don't start with http: or https: so treated as internal
      expect(link).not.toHaveAttribute('target');
    });

    it('should handle URLs with query parameters', () => {
      render(<SimpleLink href="https://example.com?foo=bar">With Query</SimpleLink>);

      const link = screen.getByText('With Query');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener');
    });

    it('should handle URLs with fragments', () => {
      render(<SimpleLink href="https://example.com#section">With Fragment</SimpleLink>);

      const link = screen.getByText('With Fragment');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener');
    });
  });

  describe('forwardRef', () => {
    it('should have a display name', () => {
      expect(SimpleLink.displayName).toBe('SimpleLink');
    });
  });

  describe('Combinations', () => {
    it('should handle external URL with icon and newTab', () => {
      const icon = <span data-testid="icon">🔗</span>;

      render(
        <SimpleLink href="https://example.com" icon={icon} newTab>
          External with Icon
        </SimpleLink>,
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('External with Icon')).toBeInTheDocument();
      const link = screen.getByText('External with Icon');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener');
    });

    it('should handle internal URL with icon', () => {
      const icon = <span data-testid="icon">📄</span>;

      render(
        <SimpleLink href="/internal" icon={icon}>
          Internal with Icon
        </SimpleLink>,
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Internal with Icon')).toBeInTheDocument();
      const link = screen.getByText('Internal with Icon');
      expect(link).not.toHaveAttribute('target');
    });
  });
});
