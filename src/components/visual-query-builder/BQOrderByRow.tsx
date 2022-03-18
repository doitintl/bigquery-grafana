import { SelectableValue } from '@grafana/data';
import React from 'react';
import { BigQueryQueryNG, QueryWithDefaults } from 'types';
import { useColumns } from 'utils/useColumns';
import { useSqlChange } from 'utils/useSqlChange';
import { SQLOrderByRow } from './SQLOrderByRow';

type BQOrderByRowProps = {
  query: QueryWithDefaults;
  onQueryChange: (query: BigQueryQueryNG) => void;
};

export function BQOrderByRow({ query, onQueryChange }: BQOrderByRowProps) {
  const columns = useColumns({ query, isOrderable: true });
  const { onSqlChange } = useSqlChange({ query, onQueryChange });
  let columnsWithIndices: SelectableValue[] = [];

  if (columns.value) {
    columnsWithIndices = [
      {
        value: '',
        label: 'Selected columns',
        options: query.sql.columns?.map((c, i) => ({
          value: i + 1,
          label: c.name
            ? `${i + 1} - ${c.name}(${c.parameters?.map((p) => `${p.name}`)})`
            : c.parameters?.map((p) => `${i + 1} - ${p.name}`),
        })),
        expanded: true,
      },
      ...columns.value,
    ];
  }

  return <SQLOrderByRow sql={query.sql} onSqlChange={onSqlChange} columns={columnsWithIndices} />;
}
