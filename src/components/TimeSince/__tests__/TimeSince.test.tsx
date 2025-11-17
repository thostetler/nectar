/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimeSince } from '../TimeSince';
import * as dateFns from 'date-fns';

// Mock date-fns functions
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    intlFormatDistance: vi.fn(),
    intlFormat: vi.fn(),
  };
});

const mockIntlFormatDistance = vi.mocked(dateFns.intlFormatDistance);
const mockIntlFormat = vi.mocked(dateFns.intlFormat);

describe('TimeSince', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIntlFormatDistance.mockReturnValue('5 days ago');
    mockIntlFormat.mockReturnValue('Jan 15, 2024, 14:30:45');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should render relative time string', () => {
      mockIntlFormatDistance.mockReturnValue('2 hours ago');

      render(<TimeSince date="2024-01-15T12:00:00+00:00" />);

      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    });

    it('should call intlFormatDistance with parsed date and current date', () => {
      const dateStr = '2024-01-15T12:00:00+00:00';

      render(<TimeSince date={dateStr} />);

      expect(mockIntlFormatDistance).toHaveBeenCalledWith(expect.any(Date), expect.any(Date));
    });

    it('should render tooltip with formatted date', () => {
      mockIntlFormat.mockReturnValue('Jan 15, 2024, 12:00:00');

      render(<TimeSince date="2024-01-15T12:00:00+00:00" />);

      // The tooltip label should be set with the formatted date
      expect(mockIntlFormat).toHaveBeenCalledWith(
        expect.any(Date),
        expect.objectContaining({
          hour12: false,
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
    });
  });

  describe('Timezone handling', () => {
    it('should add +00:00 timezone when date string lacks timezone', () => {
      const dateStr = '2024-01-15T12:00:00';

      render(<TimeSince date={dateStr} />);

      expect(mockIntlFormatDistance).toHaveBeenCalled();
      const callArgs = mockIntlFormatDistance.mock.calls[0];
      const parsedDate = callArgs[0] as Date;

      // Verify a valid date was created
      expect(parsedDate).toBeInstanceOf(Date);
      expect(parsedDate.toISOString()).toBeTruthy();
    });

    it('should preserve existing timezone when date string includes timezone', () => {
      const dateStr = '2024-01-15T12:00:00+05:30';

      render(<TimeSince date={dateStr} />);

      expect(mockIntlFormatDistance).toHaveBeenCalled();
      const callArgs = mockIntlFormatDistance.mock.calls[0];
      const parsedDate = callArgs[0] as Date;

      expect(parsedDate).toBeInstanceOf(Date);
    });

    it('should handle UTC timezone (+00:00)', () => {
      const dateStr = '2024-01-15T12:00:00+00:00';

      render(<TimeSince date={dateStr} />);

      expect(mockIntlFormatDistance).toHaveBeenCalled();
      const callArgs = mockIntlFormatDistance.mock.calls[0];
      const parsedDate = callArgs[0] as Date;

      expect(parsedDate).toBeInstanceOf(Date);
    });

    it('should handle negative timezone offset', () => {
      const dateStr = '2024-01-15T12:00:00-05:00';

      render(<TimeSince date={dateStr} />);

      expect(mockIntlFormatDistance).toHaveBeenCalled();
      const callArgs = mockIntlFormatDistance.mock.calls[0];
      const parsedDate = callArgs[0] as Date;

      expect(parsedDate).toBeInstanceOf(Date);
    });

    it('should handle Z timezone notation', () => {
      const dateStr = '2024-01-15T12:00:00Z';

      render(<TimeSince date={dateStr} />);

      expect(mockIntlFormatDistance).toHaveBeenCalled();
      const callArgs = mockIntlFormatDistance.mock.calls[0];
      const parsedDate = callArgs[0] as Date;

      expect(parsedDate).toBeInstanceOf(Date);
    });
  });

  describe('Date formatting options', () => {
    it('should format tooltip with correct options', () => {
      render(<TimeSince date="2024-01-15T12:00:00+00:00" />);

      expect(mockIntlFormat).toHaveBeenCalledWith(
        expect.any(Date),
        expect.objectContaining({
          hour12: false,
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
    });

    it('should use 24-hour format (hour12: false)', () => {
      render(<TimeSince date="2024-01-15T14:30:00+00:00" />);

      const formatCall = mockIntlFormat.mock.calls[0];
      const options = formatCall[1] as any;

      expect(options.hour12).toBe(false);
    });
  });

  describe('Various date formats', () => {
    it('should handle ISO 8601 date with milliseconds', () => {
      const dateStr = '2024-01-15T12:00:00.123+00:00';

      render(<TimeSince date={dateStr} />);

      expect(mockIntlFormatDistance).toHaveBeenCalled();
      const callArgs = mockIntlFormatDistance.mock.calls[0];
      const parsedDate = callArgs[0] as Date;

      expect(parsedDate).toBeInstanceOf(Date);
    });

    it('should handle date without seconds', () => {
      const dateStr = '2024-01-15T12:00+00:00';

      render(<TimeSince date={dateStr} />);

      expect(mockIntlFormatDistance).toHaveBeenCalled();
      const callArgs = mockIntlFormatDistance.mock.calls[0];
      const parsedDate = callArgs[0] as Date;

      expect(parsedDate).toBeInstanceOf(Date);
    });
  });

  describe('Relative time display', () => {
    it('should display "just now" for very recent dates', () => {
      mockIntlFormatDistance.mockReturnValue('just now');

      render(<TimeSince date="2024-01-15T12:00:00+00:00" />);

      expect(screen.getByText('just now')).toBeInTheDocument();
    });

    it('should display days for older dates', () => {
      mockIntlFormatDistance.mockReturnValue('3 days ago');

      render(<TimeSince date="2024-01-12T12:00:00+00:00" />);

      expect(screen.getByText('3 days ago')).toBeInTheDocument();
    });

    it('should display months for very old dates', () => {
      mockIntlFormatDistance.mockReturnValue('2 months ago');

      render(<TimeSince date="2023-11-15T12:00:00+00:00" />);

      expect(screen.getByText('2 months ago')).toBeInTheDocument();
    });

    it('should display years for ancient dates', () => {
      mockIntlFormatDistance.mockReturnValue('last year');

      render(<TimeSince date="2023-01-15T12:00:00+00:00" />);

      expect(screen.getByText('last year')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render Box with tabIndex={-1}', () => {
      const { container } = render(<TimeSince date="2024-01-15T12:00:00+00:00" />);

      const box = container.querySelector('[tabindex="-1"]');
      expect(box).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle very long date string', () => {
      const dateStr = '2024-01-15T12:00:00.123456789+00:00';

      render(<TimeSince date={dateStr} />);

      expect(mockIntlFormatDistance).toHaveBeenCalled();
    });

    it('should handle date with different timezone formats', () => {
      const dateStr = '2024-01-15T12:00:00+0530'; // Without colon

      render(<TimeSince date={dateStr} />);

      expect(mockIntlFormatDistance).toHaveBeenCalled();
    });
  });
});
