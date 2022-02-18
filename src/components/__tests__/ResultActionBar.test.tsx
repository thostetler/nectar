import { render } from '@testing-library/react';
import { Default as ResultActionBar } from '../__stories__/ResultActionBar.stories';

describe('ResultActionBar', () => {
  it('renders without crashing', () => {
    render(<ResultActionBar />);
  });
});
