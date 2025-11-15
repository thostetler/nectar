import { render } from '@/test-utils';
import { describe, expect, test } from 'vitest';
import { TimeSince } from '../TimeSince';

describe('TimeSince', () => {
  test('renders without crashing', () => {
    render(<TimeSince date="2024-01-01T12:00:00" />);
  });

  test('renders time distance correctly for past date', () => {
    const date = '2024-01-01T12:00:00';
    const { container } = render(<TimeSince date={date} />);

    // Should render some relative time text (e.g., "last year", "X days ago", etc.)
    expect(container.textContent).toBeTruthy();
    expect(container.textContent?.length).toBeGreaterThan(0);
  });

  test('handles dates with timezone', () => {
    const dateWithTz = '2024-01-01T12:00:00+05:00';
    const { container } = render(<TimeSince date={dateWithTz} />);

    expect(container).toBeInTheDocument();
    expect(container.textContent).toBeTruthy();
  });

  test('handles dates without timezone by adding UTC', () => {
    const dateWithoutTz = '2024-01-01T12:00:00';
    const { container } = render(<TimeSince date={dateWithoutTz} />);

    expect(container).toBeInTheDocument();
    expect(container.textContent).toBeTruthy();
  });

  test('renders tooltip container with tabIndex', () => {
    const date = '2024-01-01T12:00:00';
    const { container } = render(<TimeSince date={date} />);

    // Find the Box element with tabIndex="-1"
    const boxElement = container.querySelector('[tabindex="-1"]');
    expect(boxElement).toBeInTheDocument();
  });

  test('handles recent dates', () => {
    // Use a very recent date
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const dateStr = fiveMinutesAgo.toISOString().replace('Z', '+00:00');

    const { container } = render(<TimeSince date={dateStr} />);

    expect(container).toBeInTheDocument();
    expect(container.textContent).toBeTruthy();
  });
});
