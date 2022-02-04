import { getApiClient } from 'api';
import { useCallback } from 'react';
import { useAsync } from 'react-use';
import { BigQueryQueryNG, SQLExpression } from '../types';
import { getDatasourceId } from '../utils';
import { toRawSql } from './sql.utils';

interface UseSqlChange {
  query: BigQueryQueryNG;
  onQueryChange: (query: BigQueryQueryNG) => void;
}

export function useSqlChange({ query, onQueryChange }: UseSqlChange) {
  const datasourceId = getDatasourceId();
  const { value: apiClient } = useAsync(async () => await getApiClient(datasourceId), []);

  const onSqlChange = useCallback(
    (sql: SQLExpression) => {
      if (!apiClient) {
        return;
      }
      const newQuery: BigQueryQueryNG = { ...query, sql };
      newQuery.rawSql = toRawSql(newQuery, apiClient.getDefaultProject());
      onQueryChange(newQuery);
    },
    [apiClient, onQueryChange, query]
  );

  return { onSqlChange };
}
