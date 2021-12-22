import { TestQueryModel } from '@grafana/experimental';

export const simpleBigQueryQuery: TestQueryModel = {
  query: 'SELECT block_id FROM raintank-dev.bitcoin_blockchain.blocks LIMIT 10;',
  tokens: [
    [
      {
        offset: 0,
        type: 'keyword.sql',
        language: 'sql',
      },
      {
        offset: 6,
        type: 'white.sql',
        language: 'sql',
      },
      {
        offset: 7,
        type: 'identifier.sql',
        language: 'sql',
      },
      {
        offset: 15,
        type: 'white.sql',
        language: 'sql',
      },
      {
        offset: 16,
        type: 'keyword.sql',
        language: 'sql',
      },
      {
        offset: 20,
        type: 'white.sql',
        language: 'sql',
      },
      {
        offset: 21,
        type: 'identifier.sql',
        language: 'sql',
      },
      {
        offset: 29,
        type: 'operator.sql',
        language: 'sql',
      },
      {
        offset: 30,
        type: 'identifier.sql',
        language: 'sql',
      },
      {
        offset: 33,
        type: 'delimiter.sql',
        language: 'sql',
      },
      {
        offset: 34,
        type: 'identifier.sql',
        language: 'sql',
      },
      {
        offset: 52,
        type: 'delimiter.sql',
        language: 'sql',
      },
      {
        offset: 53,
        type: 'identifier.sql',
        language: 'sql',
      },
      {
        offset: 59,
        type: 'white.sql',
        language: 'sql',
      },
      {
        offset: 60,
        type: 'keyword.sql',
        language: 'sql',
      },
      {
        offset: 65,
        type: 'white.sql',
        language: 'sql',
      },
      {
        offset: 66,
        type: 'number.sql',
        language: 'sql',
      },
      {
        offset: 68,
        type: 'delimiter.sql',
        language: 'sql',
      },
    ],
  ],
};
