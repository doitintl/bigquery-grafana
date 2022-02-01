import { SelectableValue } from '@grafana/data';
import { EditorHeader, EditorMode, FlexItem, InlineSelect } from '@grafana/experimental';
import { Button, ConfirmModal } from '@grafana/ui';
import { BigQueryAPI } from 'api';
import React, { useState } from 'react';
import { DEFAULT_REGION, PROCESSING_LOCATIONS, QUERY_FORMAT_OPTIONS } from '../constants';
import { BigQueryQueryNG, QueryFormat, QueryWithDefaults } from '../types';
// import { DatasetSelector } from './DatasetSelector';
// import { TableSelector } from './TableSelector';

interface QueryHeaderProps {
  query: QueryWithDefaults;
  onChange: (query: BigQueryQueryNG) => void;
  onRunQuery: () => void;
  //   onQueryRowChange: (queryRowFilter: QueryRowFilter) => void;
  //   queryRowFilter: QueryRowFilter;
  sqlCodeEditorIsDirty: boolean;
  apiClient: BigQueryAPI;
}

// const editorModes = [
//   { label: 'Builder', value: EditorMode.Builder },
//   { label: 'Code', value: EditorMode.Code },
// ];

export function QueryHeader({
  query,
  //   sqlCodeEditorIsDirty,
  //   queryRowFilter,
  onChange,
  onRunQuery,
  //   onQueryRowChange,
  apiClient,
}: QueryHeaderProps) {
  const { location, editorMode } = query;
  const [showConfirm, setShowConfirm] = useState(false);

  //   const onEditorModeChange = useCallback(
  //     (newEditorMode: EditorMode) => {
  //       if (sqlCodeEditorIsDirty && editorMode === EditorMode.Code) {
  //         setShowConfirm(true);
  //         return;
  //       }
  //       onChange({ ...query, editorMode: newEditorMode });
  //     },
  //     [sqlCodeEditorIsDirty, editorMode, onChange, query]
  //   );

  const onFormatChange = (e: SelectableValue) => {
    const next = { ...query, format: e.value !== undefined ? e.value : QueryFormat.Table };
    onChange(next);
  };

  //   const onDatasetChange = (e: SelectableValue) => {
  //     const next = {
  //       ...query,
  //       dataset: e.value,
  //       table: undefined,
  //     };

  //     onChange(next);
  //   };

  //   const onTableChange = (e: SelectableValue) => {
  //     const next = {
  //       ...query,
  //       table: e.value,
  //     };
  //     onChange(next);
  //   };

  return (
    <>
      <EditorHeader>
        <InlineSelect
          label="Processing location"
          value={location}
          placeholder="Select location"
          allowCustomValue
          menuShouldPortal
          onChange={({ value }) => value && onChange({ ...query, location: value || DEFAULT_REGION })}
          options={PROCESSING_LOCATIONS}
        />
        <InlineSelect
          label="Format"
          value={query.format}
          placeholder="Select format"
          menuShouldPortal
          onChange={onFormatChange}
          options={QUERY_FORMAT_OPTIONS}
        />

        {/* {editorMode === EditorMode.Builder && (
          <>
            <InlineSwitch
              id="bq-filter"
              label="Filter"
              transparent={true}
              showLabel={true}
              value={queryRowFilter.filter}
              onChange={(ev) =>
                ev.target instanceof HTMLInputElement &&
                onQueryRowChange({ ...queryRowFilter, filter: ev.target.checked })
              }
            />

            <InlineSwitch
              id="bq-group"
              label="Group"
              transparent={true}
              showLabel={true}
              value={queryRowFilter.group}
              onChange={(ev) =>
                ev.target instanceof HTMLInputElement &&
                onQueryRowChange({ ...queryRowFilter, group: ev.target.checked })
              }
            />

            <InlineSwitch
              id="bq-order"
              label="Order"
              transparent={true}
              showLabel={true}
              value={queryRowFilter.order}
              onChange={(ev) =>
                ev.target instanceof HTMLInputElement &&
                onQueryRowChange({ ...queryRowFilter, order: ev.target.checked })
              }
            />

            <InlineSwitch
              id="bq-preview"
              label="Preview"
              transparent={true}
              showLabel={true}
              value={queryRowFilter.preview}
              onChange={(ev) =>
                ev.target instanceof HTMLInputElement &&
                onQueryRowChange({ ...queryRowFilter, preview: ev.target.checked })
              }
            />
          </>
        )} */}

        <FlexItem grow={1} />

        {editorMode === EditorMode.Code && (
          <Button variant="secondary" size="sm" onClick={() => onRunQuery()}>
            Run query
          </Button>
        )}

        {/* <RadioButtonGroup options={editorModes} size="sm" value={editorMode} onChange={onEditorModeChange} /> */}

        <ConfirmModal
          isOpen={showConfirm}
          title="Are you sure?"
          body="You will lose manual changes done to the query if you go back to the visual builder."
          confirmText="Yes, I am sure."
          dismissText="No, continue editing the query manually."
          icon="exclamation-triangle"
          onConfirm={() => {
            setShowConfirm(false);
            onChange({ ...query, editorMode: EditorMode.Builder });
          }}
          onDismiss={() => setShowConfirm(false)}
        />
      </EditorHeader>

      {/* {editorMode === EditorMode.Builder && (
        <>
          <Space v={0.5} />

          <EditorRow>
            <EditorField label="Format" width={25}>
              <Select
                inputId={`bq-format-${query.refId}`}
                options={QUERY_FORMAT_OPTIONS}
                menuShouldPortal
                value={query.format}
                onChange={onFormatChange}
              />
            </EditorField>

            <EditorField label="Dataset" width={25}>
              <DatasetSelector
                apiClient={apiClient}
                location={query.location}
                value={query.dataset}
                onChange={onDatasetChange}
              />
            </EditorField>

            <EditorField label="Table" width={25}>
              <TableSelector
                apiClient={apiClient}
                location={query.location}
                dataset={query.dataset}
                value={query.table}
                onChange={onTableChange}
                applyDefault
              />
            </EditorField>
          </EditorRow>
        </>
      )} */}
    </>
  );
}
