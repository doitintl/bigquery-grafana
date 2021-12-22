import { SQLEditorTestUtils } from '@grafana/experimental';
import { CustomStatementPlacement, customStatementPlacement } from './bigqueryCompletionProvider';
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
