import { SelectableValue } from '@grafana/data';
import { Select } from '@grafana/ui';
import React from 'react';
import { useAsync } from 'react-use';
import { ResourceSelectorProps } from '../types';

interface TableSelectorProps extends ResourceSelectorProps {
  dataset?: string;
  value?: string;
  onChange: (v: SelectableValue) => void;
  disabled?: boolean;
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
    return tables.map<SelectableValue<string>>((d) => ({ label: d, value: d }));
  }, [location, dataset]);

  return (
    <Select
      className={className}
      value={value}
      options={state.value}
      onChange={onChange}
      disabled={!Boolean(dataset) || state.loading}
      isLoading={state.loading}
    />
  );
};
