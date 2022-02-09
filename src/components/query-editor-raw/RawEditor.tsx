import { QueryEditorRaw } from './QueryEditorRaw';
import React, { useCallback } from 'react';
import { getColumnInfoFromSchema } from 'utils/getColumnInfoFromSchema';
import { QueryEditorProps } from 'types';

interface RawEditorProps extends QueryEditorProps {
  onRunQuery: () => void;
}

export function RawEditor({ apiClient, query, onChange, onRunQuery }: RawEditorProps) {
  const getColumns = useCallback(
    // expects fully qualified table name: <project-id>.<dataset-id>.<table-id>
    async (t: string) => {
      if (!apiClient) {
        return [];
      }
      let cols;
      const tablePath = t.split('.');

      if (tablePath.length === 3) {
        cols = await apiClient.getColumns(query.location, tablePath[1], tablePath[2]);
      } else {
        if (!query.dataset) {
          return [];
        }
        cols = await apiClient.getColumns(query.location, query.dataset, t!);
      }

      if (cols.length > 0) {
        const schema = await apiClient.getTableSchema(query.location, tablePath[1], tablePath[2]);
        return cols.map((c) => {
          const cInfo = schema.schema ? getColumnInfoFromSchema(c, schema.schema) : null;
          return { name: c, ...cInfo };
        });
      } else {
        return [];
      }
    },
    [apiClient, query.location, query.dataset]
  );

  const getTables = useCallback(
    async (d?: string) => {
      if (!apiClient) {
        return [];
      }

      let datasets = [];
      if (!d) {
        datasets = await apiClient.getDatasets(query.location);
        return datasets.map((d) => ({ name: d, completion: `\`${apiClient.getDefaultProject()}.${d}.` }));
      } else {
        const path = d.split('.').filter((s) => s);
        if (path.length > 2) {
          return [];
        }
        if (path[0] && path[1]) {
          const tables = await apiClient.getTables(query.location, path[1]);
          return tables.map((t) => ({ name: t, completion: `${t}\`` }));
        } else if (path[0]) {
          datasets = await apiClient.getDatasets(query.location);
          return datasets.map((d) => ({ name: d, completion: `${d}` }));
        } else {
          return [];
        }
      }
    },
    [apiClient, query.location]
  );

  const getTableSchema = useCallback(
    async (location: string, dataset: string, table: string) => {
      if (!apiClient) {
        return null;
      }

      return apiClient.getTableSchema(location, dataset, table);
    },
    [apiClient]
  );
  return (
    <>
      <QueryEditorRaw
        getTables={getTables}
        getColumns={getColumns}
        getTableSchema={getTableSchema}
        query={query}
        onChange={onChange}
        onRunQuery={onRunQuery}
      />
    </>
  );
}
