import React from 'react';
import { useColumns } from 'utils/useColumns';
import { useSqlChange } from 'utils/useSqlChange';
import { BigQueryQueryNG, QueryWithDefaults } from 'types';
import { SQLOrderByRow } from './SQLOrderByRow';

type BQOrderByRowProps = {
  query: QueryWithDefaults;
  onQueryChange: (query: BigQueryQueryNG) => void;
};

export function BQOrderByRow({ query, onQueryChange }: BQOrderByRowProps) {
  const columns = useColumns({ query, isOrderable: true });
  const { onSqlChange } = useSqlChange({ query, onQueryChange });

  return <SQLOrderByRow sql={query.sql} onSqlChange={onSqlChange} columns={columns.value} />;
}
