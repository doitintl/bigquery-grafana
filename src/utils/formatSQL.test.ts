import { formatSQL } from './formatSQL';

describe('formatSQL', () => {
  it.each`
    input                                                                     | output
    ${'SELECT $column FROM users'}                                            | ${'SELECT\n  $column\nFROM\n  users'}
    ${'SELECT ${column} FROM users'}                                          | ${'SELECT\n  ${column}\nFROM\n  users'}
    ${'SELECT ${variable:format} FROM users'}                                 | ${'SELECT\n  ${variable:format}\nFROM\n  users'}
    ${'SELECT column FROM users where $__timeFilter(columnTime)'}             | ${'SELECT\n  column\nFROM\n  users\nwhere\n  $__timeFilter(columnTime)'}
    ${'SELECT ${column}, $column FROM users where $__timeFilter(columnTime)'} | ${'SELECT\n  ${column},\n  $column\nFROM\n  users\nwhere\n  $__timeFilter(columnTime)'}
  `('should format query $input to $output', ({ input, output }) => {
    expect(formatSQL(input)).toEqual(output);
  });
});
