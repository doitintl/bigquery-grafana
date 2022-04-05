import { QueryEditorProps } from '@grafana/data';
import { EditorMode, Space } from '@grafana/experimental';
import { RawEditor } from 'components/query-editor-raw/RawEditor';
import React, { useCallback, useEffect, useState } from 'react';
import { useAsync } from 'react-use';
import { applyQueryDefaults, isQueryValid, setDatasourceId } from 'utils';
import { haveColumns } from 'utils/sql.utils';
import { getApiClient } from '../api';
import { QueryHeader } from '../components/QueryHeader';
import { BigQueryDatasource } from '../datasource';
import { BigQueryOptions, BigQueryQueryNG, QueryRowFilter } from '../types';
import { VisualEditor } from './visual-query-builder/VisualEditor';

type Props = QueryEditorProps<BigQueryDatasource, BigQueryQueryNG, BigQueryOptions>;

export function QueryEditor({ datasource, query, onChange, onRunQuery, range }: Props) {
  setDatasourceId(datasource.id);
  const [isQueryRunnable, setIsQueryRunnable] = useState(true);
  const { loading: apiLoading, error: apiError, value: apiClient } = useAsync(
    async () => await getApiClient(datasource.id),
    [datasource]
  );
  const queryWithDefaults = applyQueryDefaults(query, datasource);
  const [queryRowFilter, setQueryRowFilter] = useState<QueryRowFilter>({
    filter: !!queryWithDefaults.sql.whereString,
    group: !!queryWithDefaults.sql.groupBy?.[0]?.property.name,
    order: !!queryWithDefaults.sql.orderBy?.property.name,
    preview: true,
  });
  const [queryToValidate, setQueryToValidate] = useState(queryWithDefaults);

  useEffect(() => {
    return () => {
      getApiClient(datasource.id).then((client) => client.dispose());
    };
  }, [datasource.id]);

  const processQuery = useCallback(
    (q: BigQueryQueryNG) => {
      if (isQueryValid(q) && onRunQuery) {
        onRunQuery();
      }
    },
    [onRunQuery]
  );

  const onQueryChange = (q: BigQueryQueryNG, process = true) => {
    setQueryToValidate(q as any);
    onChange(q);

    if (haveColumns(q.sql?.columns) && q.sql?.columns.some((c) => c.name) && !queryRowFilter.group) {
      setQueryRowFilter({ ...queryRowFilter, group: true });
    }

    if (process) {
      processQuery(q);
    }
  };

  if (apiLoading || apiError || !apiClient) {
    return null;
  }

  return (
    <>
      <QueryHeader
        onChange={onChange}
        onRunQuery={onRunQuery}
        onQueryRowChange={setQueryRowFilter}
        queryRowFilter={queryRowFilter}
        query={queryWithDefaults}
        apiClient={apiClient}
        isQueryRunnable={isQueryRunnable}
      />

      <Space v={0.5} />

      {queryWithDefaults.editorMode !== EditorMode.Code && (
        <VisualEditor
          apiClient={apiClient}
          query={queryWithDefaults}
          onChange={(q) => onQueryChange(q, false)}
          queryRowFilter={queryRowFilter}
          onValidate={setIsQueryRunnable}
          range={range}
        />
      )}

      {queryWithDefaults.editorMode === EditorMode.Code && (
        <RawEditor
          apiClient={apiClient}
          query={queryWithDefaults}
          queryToValidate={queryToValidate}
          onChange={onQueryChange}
          onRunQuery={onRunQuery}
          onValidate={setIsQueryRunnable}
          range={range}
        />
      )}
    </>
  );
}
