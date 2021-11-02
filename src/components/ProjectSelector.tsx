import { SelectableValue } from '@grafana/data';
import { Select } from '@grafana/ui';
import React from 'react';
import { ResourceSelectorProps } from '../types';

interface ProjectSelectorProps extends ResourceSelectorProps {
  onChange?: (v: SelectableValue) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ projectId, onChange, className }) => {
  return (
    <Select
      className={className}
      value={projectId}
      options={[{ label: projectId, value: projectId }]}
      onChange={() => {}}
    />
  );
};
