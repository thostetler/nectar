import { render } from '@/test-utils';
import { describe, expect, test } from 'vitest';
import { NumFound } from '../NumFound';

describe('NumFound', () => {
  test('renders without crashing', () => {
    render(<NumFound count={0} />);
  });

  test('displays loading skeleton when isLoading is true', () => {
    const { container } = render(<NumFound count={100} isLoading={true} />);

    // Should render skeleton instead of count
    const skeleton = container.querySelector('.chakra-skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  test('displays count when not loading', () => {
    const { getByText } = render(<NumFound count={42} isLoading={false} />);

    // Should display the count
    expect(getByText('42')).toBeInTheDocument();
    expect(getByText(/Your search returned/i)).toBeInTheDocument();
  });

  test('formats count with locale string', () => {
    const { getByText } = render(<NumFound count={1234567} />);

    // Should format with commas (or locale-appropriate separators)
    expect(getByText('1,234,567')).toBeInTheDocument();
  });

  test('handles zero count', () => {
    const { getByText } = render(<NumFound count={0} />);

    expect(getByText('0')).toBeInTheDocument();
    expect(getByText(/Your search returned/i)).toBeInTheDocument();
  });

  test('handles negative count by showing 0', () => {
    const { getByText } = render(<NumFound count={-10} />);

    // Negative counts should be sanitized to 0
    expect(getByText('0')).toBeInTheDocument();
  });

  test('uses default count of 0 when not provided', () => {
    const { getByText } = render(<NumFound />);

    expect(getByText('0')).toBeInTheDocument();
  });

  test('renders with role="status" for accessibility', () => {
    const { getByRole } = render(<NumFound count={100} />);

    const status = getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent('100');
  });

  test('displays correct text structure', () => {
    const { getByText } = render(<NumFound count={50} />);

    expect(getByText(/Your search returned/i)).toBeInTheDocument();
    expect(getByText('50')).toBeInTheDocument();
    expect(getByText(/results/i)).toBeInTheDocument();
  });
});
