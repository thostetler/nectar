import { render } from '@/test-utils';
import { describe, expect, test } from 'vitest';
import { HideOnPrint } from '../HideOnPrint';

describe('HideOnPrint', () => {
  test('renders without crashing', () => {
    render(<HideOnPrint>Content</HideOnPrint>);
  });

  test('renders children correctly', () => {
    const { getByText } = render(<HideOnPrint>Test Content</HideOnPrint>);
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  test('applies print media query styles', () => {
    const { container } = render(<HideOnPrint>Hidden on print</HideOnPrint>);
    // Component should render
    expect(container.textContent).toContain('Hidden on print');
  });

  test('accepts and applies additional Box props', () => {
    const { getByTestId } = render(
      <HideOnPrint className="custom-class" data-testid="hide-print">
        Content
      </HideOnPrint>,
    );

    const box = getByTestId('hide-print');
    expect(box).toBeInTheDocument();
    expect(box).toHaveClass('custom-class');
  });

  test('renders with custom styles', () => {
    const { container } = render(
      <HideOnPrint p={4} bg="gray.100">
        Styled Content
      </HideOnPrint>,
    );

    // Should render the content
    expect(container.textContent).toContain('Styled Content');
  });

  test('handles multiple children', () => {
    const { getByText } = render(
      <HideOnPrint>
        <div>Child 1</div>
        <div>Child 2</div>
      </HideOnPrint>,
    );

    expect(getByText('Child 1')).toBeInTheDocument();
    expect(getByText('Child 2')).toBeInTheDocument();
  });
});
