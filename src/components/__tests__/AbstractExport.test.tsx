import React from 'react';
import { render } from '@testing-library/react';
import { Default as AbstractExport } from '../__stories__/AbstractExport.stories';

describe('AbstractExport', () => {
  it('renders without crashing', () => {
    render(<AbstractExport />);
  });
});
