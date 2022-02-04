import React from 'react';
import { useColumns } from 'utils/useColumns';
import { useSqlChange } from 'utils/useSqlChange';
import { BigQueryQueryNG, QueryWithDefaults } from 'types';
import { SQLSelectRow } from './SQLSelectRow';

interface BQSelectRowProps {
  query: QueryWithDefaults;
  onQueryChange: (query: BigQueryQueryNG) => void;
}

export function BQSelectRow({ query, onQueryChange }: BQSelectRowProps) {
  const columns = useColumns({ query });
  const { onSqlChange } = useSqlChange({ query, onQueryChange });

  return <SQLSelectRow columns={columns.value} sql={query.sql} onSqlChange={onSqlChange} />;
}
