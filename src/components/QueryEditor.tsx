import React, { useEffect, useCallback } from 'react';
import { QueryEditorProps } from '@grafana/data';
import { BigQueryDatasource } from '../datasource';
import { QueryEditorRaw } from './query-editor-raw/QueryEditorRaw';
import { BigQueryOptions, BigQueryQueryNG } from '../types';
import { getApiClient } from '../api';
import { getColumnInfoFromSchema } from 'utils/getColumnInfoFromSchema';
import { useAsync } from 'react-use';
import { applyQueryDefaults } from 'utils';
import { QueryHeader } from './QueryHeader';
import { Space } from '@grafana/experimental';

type Props = QueryEditorProps<BigQueryDatasource, BigQueryQueryNG, BigQueryOptions>;

export function QueryEditor(props: Props) {
  const { onRunQuery, onChange } = props;
  const { loading: apiLoading, error: apiError, value: apiClient } = useAsync(
    async () => await getApiClient(props.datasource.id),
    [props.datasource]
  );

  const queryWithDefaults = applyQueryDefaults(props.query, props.datasource);

  useEffect(() => {
    return () => {
      getApiClient(props.datasource.id).then((client) => client.dispose());
    };
  }, [props.datasource.id]);

  const getColumns = useCallback(
    // excpects fully qualified table name: <project-id>.<dataset-id>.<table-id>
    async (t: string) => {
      if (!apiClient || !queryWithDefaults.location) {
        return [];
      }
      let cols;
      const tablePath = t.split('.');

      if (tablePath.length === 3) {
        cols = await apiClient.getColumns(queryWithDefaults.location, tablePath[1], tablePath[2]);
      } else {
        if (!queryWithDefaults.dataset) {
          return [];
        }
        cols = await apiClient.getColumns(queryWithDefaults.location, queryWithDefaults.dataset, t!);
      }

      if (cols.length > 0) {
        const schema = await apiClient.getTableSchema(queryWithDefaults.location, tablePath[1], tablePath[2]);
        return cols.map((c) => {
          const cInfo = schema.schema ? getColumnInfoFromSchema(c, schema.schema) : null;
          return { name: c, ...cInfo };
        });
      } else {
        return [];
      }
    },
    [apiClient, queryWithDefaults.location, queryWithDefaults.dataset]
  );

  const getTables = useCallback(
    async (d?: string) => {
      if (!queryWithDefaults.location || !apiClient) {
        return [];
      }

      let datasets = [];
      if (!d) {
        datasets = await apiClient.getDatasets(queryWithDefaults.location);
        return datasets.map((d) => ({ name: d, completion: `\`${apiClient.getDefaultProject()}.${d}.` }));
      } else {
        const path = d.split('.').filter((s) => s);
        if (path.length > 2) {
          return [];
        }
        if (path[0] && path[1]) {
          const tables = await apiClient.getTables(queryWithDefaults.location, path[1]);
          return tables.map((t) => ({ name: t, completion: `${t}\`` }));
        } else if (path[0]) {
          datasets = await apiClient.getDatasets(queryWithDefaults.location);
          return datasets.map((d) => ({ name: d, completion: `${d}` }));
        } else {
          return [];
        }
      }
    },
    [apiClient, queryWithDefaults.location]
  );

  if (apiLoading || apiError || !apiClient) {
    return null;
  }

  return (
    <>
      <QueryHeader
        onChange={onChange}
        onRunQuery={onRunQuery}
        // onQueryRowChange={setQueryRowFilter}
        // queryRowFilter={queryRowFilter}
        query={queryWithDefaults}
        // TODO: add proper dirty check
        sqlCodeEditorIsDirty={false}
        apiClient={apiClient}
      />

      <Space v={0.5} />

      <QueryEditorRaw
        getTables={getTables}
        getColumns={getColumns}
        query={queryWithDefaults}
        onChange={onChange}
        onRunQuery={props.onRunQuery}
      />
    </>
  );
}
