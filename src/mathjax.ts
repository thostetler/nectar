import { MathJax3Config, MathJaxContext } from 'better-react-mathjax';
import { createElement, FC, ReactElement } from 'react';

const config: MathJax3Config = {
  loader: { load: ['[tex]/html'] },
  tex: {
    packages: { '[+]': ['html'] },
    inlineMath: [
      ['$', '$'],
      ['\\(', '\\)'],
    ],
    displayMath: [
      ['$$', '$$'],
      ['\\[', '\\]'],
    ],
    processEscapes: true,
  },
};

export const MathJaxProvider: FC = ({ children }): ReactElement => {
  return createElement(MathJaxContext, { version: 3, config }, children);
};