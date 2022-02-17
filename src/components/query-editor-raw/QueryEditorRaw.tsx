import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { BigQueryQueryNG } from '../../types';
import { TableSchema } from 'api';
import { getBigQueryCompletionProvider } from './bigqueryCompletionProvider';
import { ColumnDefinition, SQLEditor, TableDefinition } from '@grafana/experimental';
import sqlFormatter from 'sql-formatter-plus';

type Props = {
  query: BigQueryQueryNG;
  getTables: (d?: string) => Promise<TableDefinition[]>;
  getColumns: (t: string) => Promise<ColumnDefinition[]>;
  getTableSchema: (l: string, d: string, t: string) => Promise<TableSchema | null>;
  onChange: (value: BigQueryQueryNG, processQuery: boolean) => void;
  children?: (props: { formatQuery: () => void }) => React.ReactNode;
};

export function QueryEditorRaw({
  children,
  getColumns: apiGetColumns,
  getTables: apiGetTables,
  getTableSchema: apiGetTableSchema,
  onChange,
  query,
}: Props) {
  const getColumns = useRef<Props['getColumns']>(apiGetColumns);
  const getTables = useRef<Props['getTables']>(apiGetTables);
  const getTableSchema = useRef<Props['getTableSchema']>(apiGetTableSchema);
  const completionProvider = useMemo(
    () => getBigQueryCompletionProvider({ getColumns, getTables, getTableSchema }),
    []
  );

  useEffect(() => {
    getColumns.current = apiGetColumns;
    getTables.current = apiGetTables;
  }, [apiGetColumns, apiGetTables]);

  const onRawQueryChange = useCallback(
    (rawSql: string, processQuery: boolean) => {
      const newQuery = {
        ...query,
        rawQuery: true,
        rawSql,
      };
      onChange(newQuery, processQuery);
    },
    [onChange, query]
  );

  return (
    <SQLEditor
      query={query.rawSql}
      onChange={onRawQueryChange}
      language={{ id: 'bigquery', completionProvider, formatter: sqlFormatter.format }}
    >
      {children}
    </SQLEditor>
  );
}
