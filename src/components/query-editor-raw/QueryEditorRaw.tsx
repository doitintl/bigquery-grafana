import { ColumnDefinition, SQLEditor, TableDefinition } from '@grafana/experimental';
import { TableSchema } from 'api';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { BigQueryQueryNG } from '../../types';
import { formatSQL } from '../../utils/formatSQL';
import { getBigQueryCompletionProvider } from './bigqueryCompletionProvider';

type Props = {
  query: BigQueryQueryNG;
  getTables: (d?: string) => Promise<TableDefinition[]>;
  getColumns: (t: string) => Promise<ColumnDefinition[]>;
  getTableSchema: (p: string, d: string, t: string) => Promise<TableSchema | null>;
  onChange: (value: BigQueryQueryNG, processQuery: boolean) => void;
  children?: (props: { formatQuery: () => void }) => React.ReactNode;
  width?: number;
  height?: number;
};

export function QueryEditorRaw({
  children,
  getColumns: apiGetColumns,
  getTables: apiGetTables,
  getTableSchema: apiGetTableSchema,
  onChange,
  query,
  width,
  height,
}: Props) {
  const getColumns = useRef<Props['getColumns']>(apiGetColumns);
  const getTables = useRef<Props['getTables']>(apiGetTables);
  const getTableSchema = useRef<Props['getTableSchema']>(apiGetTableSchema);

  const completionProvider = useMemo(
    () => getBigQueryCompletionProvider({ getColumns, getTables, getTableSchema }),
    []
  );

  // We need to pass query via ref to SQLEditor as onChange is executed via monacoEditor.onDidChangeModelContent callback, not onChange property
  const queryRef = useRef<BigQueryQueryNG>(query);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    getColumns.current = apiGetColumns;
    getTables.current = apiGetTables;
  }, [apiGetColumns, apiGetTables]);

  const onRawQueryChange = useCallback(
    (rawSql: string, processQuery: boolean) => {
      const newQuery = {
        ...queryRef.current,
        rawQuery: true,
        rawSql,
      };
      onChange(newQuery, processQuery);
    },
    [onChange]
  );

  return (
    <SQLEditor
      width={width}
      height={height}
      query={query.rawSql}
      onChange={onRawQueryChange}
      language={{ id: 'bigquery', completionProvider, formatter: formatSQL }}
    >
      {children}
    </SQLEditor>
  );
}
