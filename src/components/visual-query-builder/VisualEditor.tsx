import React from 'react';
import { EditorField, EditorRow, EditorRows } from '@grafana/experimental';
import { QueryEditorProps, QueryRowFilter } from 'types';
import { BQOrderByRow } from './BQOrderByRow';
import { BQSelectRow } from './BQSelectRow';
import { BQWhereRow } from './BQWhereRow';
import { Preview } from './Preview';
import { BQGroupByRow } from './BQGroupByRow';
import { QueryValidator } from 'components/query-editor-raw/QueryValidator';

interface VisualEditorProps extends QueryEditorProps {
  queryRowFilter: QueryRowFilter;
  onValidate: (isValid: boolean) => void;
}
export const VisualEditor: React.FC<VisualEditorProps> = ({
  query,
  apiClient,
  queryRowFilter,
  onChange,
  onValidate,
  range,
}) => {
  return (
    <>
      <EditorRows>
        <EditorRow>
          <BQSelectRow query={query} onQueryChange={onChange} />
        </EditorRow>
        {queryRowFilter.filter && (
          <EditorRow>
            <EditorField label="Filter by column value" optional>
              <BQWhereRow apiClient={apiClient} query={query} onQueryChange={onChange} />
            </EditorField>
          </EditorRow>
        )}
        {queryRowFilter.group && (
          <EditorRow>
            <EditorField label="Group by column">
              <BQGroupByRow query={query} onQueryChange={onChange} />
            </EditorField>
          </EditorRow>
        )}
        {queryRowFilter.order && (
          <EditorRow>
            <BQOrderByRow query={query} onQueryChange={onChange} />
          </EditorRow>
        )}
        {queryRowFilter.preview && query.rawSql && (
          <EditorRow>
            <Preview rawSql={query.rawSql} />
          </EditorRow>
        )}
      </EditorRows>
      <QueryValidator apiClient={apiClient} query={query} onValidate={onValidate} range={range} />
    </>
  );
};
