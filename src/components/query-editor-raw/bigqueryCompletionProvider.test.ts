import { SQLEditorTestUtils } from '@grafana/experimental';
import { CustomStatementPlacement, customStatementPlacement, getTablePath } from './bigqueryCompletionProvider';
import { simpleBigQueryQuery } from './testData/simpleBigQueryQuery';

describe('Custom statement position resolvers', () => {
  SQLEditorTestUtils.testStatementPosition(
    CustomStatementPlacement.AfterDataset,
    [
      {
        query: simpleBigQueryQuery,
        position: { line: 1, column: 34 },
      },
      {
        query: simpleBigQueryQuery,
        position: { line: 1, column: 53 },
      },
    ],
    customStatementPlacement
  );
});

describe('getTablePath function', () => {
  it('should not add whitespace to the end of the path', () => {
    const token: any = {
      value: ' ',
      type: 'white.sql',
      next: null,
      previous: {
        value: '`',
        type: '',
        isWhiteSpace: () => false,
        previous: {
          type: 'identifier.sql',
          value: 'tableName',
          isWhiteSpace: () => false,
          previous: { value: '`', type: '', isWhiteSpace: () => false },
        },
      },
      isWhiteSpace: () => true,
    };
    expect(getTablePath(token)).toBe('tableName');
  });

  it('should handle number at the end of the token', () => {
    const token: any = {
      value: '286017.',
      type: 'number.sql',
      next: null,
      isWhiteSpace: () => false,
      previous: {
        value: '-',
        type: 'operator.sql',
        isWhiteSpace: () => false,
        previous: {
          type: 'identifier.sql',
          value: 'dataset',
          isWhiteSpace: () => false,
          previous: { value: '`', type: '', isWhiteSpace: () => false },
        },
      },
    };
    expect(getTablePath(token)).toBe('dataset-286017.');
  });
});
