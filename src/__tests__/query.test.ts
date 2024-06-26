import * as Q from '@/query';
import { describe, expect, it } from 'vitest';

describe('Query Utilities', () => {
  it('can join conditions with an operator', () => {
    expect(Q.joinConditions('AND', ['foo', 'bar', 'baz'])).toEqual('foo AND bar AND baz');
  });

  /**
   * Escaping
   */
  it.concurrent.each<[string, Parameters<typeof Q.escape>, ReturnType<typeof Q.escape>]>([
    ['\\ is properly escaped', ['f\\oooooo'], 'f\\\\oooooo'],
    ['+ is properly escaped', ['foo+oooo'], 'foo\\+oooo'],
    ['- is properly escaped', ['f-oooooo'], 'f\\-oooooo'],
    ['! is properly escaped', ['foo!oooo'], 'foo\\!oooo'],
    ['( is properly escaped', ['fooo(ooo'], 'fooo\\(ooo'],
    [') is properly escaped', ['f)oooooo'], 'f\\)oooooo'],
    [': is properly escaped', ['fo:ooooo'], 'fo\\:ooooo'],
    ['^ is properly escaped', ['foo^oooo'], 'foo\\^oooo'],
    ['[ is properly escaped', ['f[oooooo'], 'f\\[oooooo'],
    ['] is properly escaped', ['fo]ooooo'], 'fo\\]ooooo'],
    ['" is properly escaped', ['f"oooooo'], 'f\\"oooooo'],
    ['{ is properly escaped', ['fooo{ooo'], 'fooo\\{ooo'],
    ['} is properly escaped', ['foo}oooo'], 'foo\\}oooo'],
    ['~ is properly escaped', ['foo~oooo'], 'foo\\~oooo'],
    ['* is properly escaped', ['foo*oooo'], 'foo\\*oooo'],
    ['? is properly escaped', ['foo?oooo'], 'foo\\?oooo'],
    ['| is properly escaped', ['f|oooooo'], 'f\\|oooooo'],
    ['& is properly escaped', ['foo&oooo'], 'foo\\&oooo'],
    ['/ is properly escaped', ['f/oooooo'], 'f\\/oooooo'],
  ])('%s', (_, args, expected) => {
    expect(Q.escape(...args)).toEqual(expected);
    return Promise.resolve();
  });

  it.concurrent.each<[string, Parameters<typeof Q.splitQuery>, ReturnType<typeof Q.splitQuery>]>([
    ['simple case', ['(1 AND 2)'], ['(1 AND 2)']],
    ['2 clauses', ['(1 AND 2) AND (3 OR 4)'], ['(1 AND 2)', '(3 OR 4)']],
    ['single clauses', ['(1) AND (2) AND (3)'], ['(1)', '(2)', '(3)']],
    [
      'harder case',
      ['(1 OR 2 OR 3 OR 4 OR 5 OR 6 OR 7 OR 8 OR 9) AND (10 11 12 13 14 15 16 17)'],
      ['(1 OR 2 OR 3 OR 4 OR 5 OR 6 OR 7 OR 8 OR 9)', '(10 11 12 13 14 15 16 17)'],
    ],
    [
      'tons of clauses',
      [
        '(1 OR 2) AND (3 AND 4) AND (5 OR 6 OR 7) AND (8 OR 9 OR 10) AND (11 AND 12 AND 13 AND 14 AND 15 AND 16) AND (17) AND (*:* NOT 18 NOT 19 NOT 20)',
      ],
      [
        '(1 OR 2)',
        '(3 AND 4)',
        '(5 OR 6 OR 7)',
        '(8 OR 9 OR 10)',
        '(11 AND 12 AND 13 AND 14 AND 15 AND 16)',
        '(17)',
        '(*:* NOT 18 NOT 19 NOT 20)',
      ],
    ],
  ])('%s', (_, args, expected) => {
    expect(Q.splitQuery(...args)).toEqual(expected);
    return Promise.resolve();
  });
});
