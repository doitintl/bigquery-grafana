import { SelectableValue } from '@grafana/data';
import { EditorField } from '@grafana/experimental';
import { Select, useTheme2 } from '@grafana/ui';
import React, { useEffect } from 'react';
import { css } from '@emotion/css';
import { useAsync } from 'react-use';
import { ResourceSelectorProps } from 'types';

interface ProjectSelectorProps extends Omit<ResourceSelectorProps, 'location'> {
  value?: string;
  applyDefault?: boolean;
  onChange: (v: SelectableValue) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ apiClient, value, onChange, applyDefault }) => {
  const theme = useTheme2();
  const state = useAsync(async () => {
    const projects = await apiClient.getProjects();
    return projects.map((project) => ({ label: project.displayName, value: project.projectId }));
  }, []);

  useEffect(() => {
    if (!applyDefault) {
      return;
    }
    // Set default project when values are fetched
    if (!value) {
      if (state.value && state.value[0]) {
        onChange(state.value[0]);
      }
    } else {
      if (state.value && state.value.find((v) => v.value === value) === undefined) {
        // if value is set and newly fetched values does not contain selected value
        if (state.value.length > 0) {
          onChange(state.value[0]);
        }
      }
    }
  }, [state.value, value, applyDefault, onChange]);

  const getErrorMessage = () => {
    const errorData = (state.error as any)?.data;
    if (errorData?.message) {
      const url = errorData.message.match(/(https?:\/\/[^ ]*)/g)?.[0];
      return (
        <>
          {errorData.message.split('.')[0]}{' '}
          {url ? (
            <a target="_blank" rel="noreferrer" href={url}>
              Click here to enable it
            </a>
          ) : (
            ''
          )}
        </>
      );
    }
    return state.error?.message;
  };

  return (
    <div className={css({ width: theme.spacing(25) })}>
      <EditorField label="Project" width={25} error={getErrorMessage()} invalid={!!state.error}>
        <Select
          aria-label="Project selector"
          value={value}
          options={state.value || [{ label: value, value }]}
          onChange={onChange}
          isLoading={state.loading}
          menuShouldPortal={true}
        />
      </EditorField>
    </div>
  );
};
