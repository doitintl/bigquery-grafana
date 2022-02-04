import { SelectableValue, toOption } from '@grafana/data';
import { Select } from '@grafana/ui';
import React from 'react';
import { useAsync } from 'react-use';
import { ResourceSelectorProps } from '../types';

interface TableSelectorProps extends ResourceSelectorProps {
  dataset?: string;
  value?: string;
  onChange: (v: SelectableValue) => void;
}

export const TableSelector: React.FC<TableSelectorProps> = ({
  apiClient,
  location,
  value,
  dataset,
  className,
  onChange,
}) => {
  const state = useAsync(async () => {
    if (!dataset) {
      return [];
    }
    const tables = await apiClient.getTables(location, dataset);
    return tables.map(toOption);
  }, [location, dataset]);

  return (
    <Select
      className={className}
      aria-label="Table selector"
      value={value}
      options={state.value}
      onChange={onChange}
      isLoading={state.loading}
      menuShouldPortal={true}
    />
  );
};
