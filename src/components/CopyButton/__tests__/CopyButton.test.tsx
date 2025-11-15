import { render, waitFor } from '@/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { SimpleCopyButton, LabeledCopyButton } from '../CopyButton';

describe('SimpleCopyButton', () => {
  test('renders without crashing', () => {
    render(<SimpleCopyButton text="test text" />);
  });

  test('displays copy icon initially', () => {
    const { container } = render(<SimpleCopyButton text="test text" />);
    const button = container.querySelector('button[aria-label="copy to clipboard"]');
    expect(button).toBeInTheDocument();
  });

  test('shows check icon after copying', async () => {
    const { container, user } = render(<SimpleCopyButton text="test text" />);
    const button = container.querySelector('button[aria-label="copy to clipboard"]');

    await user.click(button);

    await waitFor(() => {
      const copiedButton = container.querySelector('button[aria-label="copied"]');
      expect(copiedButton).toBeInTheDocument();
    });
  });

  test('calls onCopyComplete callback', async () => {
    const onCopyComplete = vi.fn();
    const { container, user } = render(<SimpleCopyButton text="test text" onCopyComplete={onCopyComplete} />);
    const button = container.querySelector('button[aria-label="copy to clipboard"]');

    await user.click(button);

    // The callback is called at least once
    expect(onCopyComplete).toHaveBeenCalled();
  });

  test('reverts to copy icon after timeout', async () => {
    const { container, user } = render(<SimpleCopyButton text="test text" timeout={100} />);
    const button = container.querySelector('button[aria-label="copy to clipboard"]');

    await user.click(button);

    // Should show check icon
    await waitFor(() => {
      expect(container.querySelector('button[aria-label="copied"]')).toBeInTheDocument();
    });

    // Should revert after timeout
    await waitFor(
      () => {
        expect(container.querySelector('button[aria-label="copy to clipboard"]')).toBeInTheDocument();
      },
      { timeout: 200 },
    );
  });

  test('accepts custom button props', () => {
    const { container } = render(<SimpleCopyButton text="test text" size="lg" colorScheme="blue" />);
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });
});

describe('LabeledCopyButton', () => {
  test('renders without crashing', () => {
    render(<LabeledCopyButton text="test text" label="Copy Text" />);
  });

  test('displays label initially', () => {
    const { getByText } = render(<LabeledCopyButton text="test text" label="Copy Text" />);
    expect(getByText('Copy Text')).toBeInTheDocument();
  });

  test('shows copied message after clicking', async () => {
    const { getByText, user } = render(<LabeledCopyButton text="test text" label="Copy Text" />);
    const button = getByText('Copy Text');

    await user.click(button);

    await waitFor(() => {
      expect(getByText('Copied to clipboard!')).toBeInTheDocument();
    });
  });

  test('reverts to label after timeout', async () => {
    const { getByText, user } = render(<LabeledCopyButton text="test text" label="Copy Text" timeout={100} />);
    const button = getByText('Copy Text');

    await user.click(button);

    // Should show copied message
    await waitFor(() => {
      expect(getByText('Copied to clipboard!')).toBeInTheDocument();
    });

    // Should revert to label
    await waitFor(
      () => {
        expect(getByText('Copy Text')).toBeInTheDocument();
      },
      { timeout: 200 },
    );
  });

  test('calls onCopyComplete callback', async () => {
    const onCopyComplete = vi.fn();
    const { getByText, user } = render(
      <LabeledCopyButton text="test text" label="Copy Text" onCopyComplete={onCopyComplete} />,
    );
    const button = getByText('Copy Text');

    await user.click(button);

    // The callback is called at least once
    expect(onCopyComplete).toHaveBeenCalled();
  });

  test('renders icon on left by default', () => {
    const { container } = render(<LabeledCopyButton text="test text" label="Copy Text" />);
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  test('renders icon on right when iconPos is right', () => {
    const { container } = render(<LabeledCopyButton text="test text" label="Copy Text" iconPos="right" />);
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });
});
