import { QueryEditorRaw } from './QueryEditorRaw';
import React, { useCallback, useState } from 'react';
import { getColumnInfoFromSchema } from 'utils/getColumnInfoFromSchema';
import { BigQueryQueryNG, QueryEditorProps } from 'types';
import { QueryToolbox } from './QueryToolbox';
import { Modal, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useMeasure } from 'react-use';
import { GrafanaTheme2 } from '@grafana/data';

interface RawEditorProps extends Omit<QueryEditorProps, 'onChange'> {
  onRunQuery: () => void;
  onChange: (q: BigQueryQueryNG, processQuery: boolean) => void;
  onValidate: (isValid: boolean) => void;
  queryToValidate: BigQueryQueryNG;
}

export function RawEditor({
  apiClient,
  query,
  onChange,
  onRunQuery,
  onValidate,
  queryToValidate,
  range,
}: RawEditorProps) {
  const theme = useTheme2();
  const styles = useStyles2(getStyles);
  const [isExpanded, setIsExpanded] = useState(false);
  const [toolboxRef, toolboxMeasure] = useMeasure<HTMLDivElement>();
  const [editorRef, editorMeasure] = useMeasure<HTMLDivElement>();

  const getColumns = useCallback(
    // expects fully qualified table name: <project-id>.<dataset-id>.<table-id>
    async (t: string) => {
      if (!apiClient) {
        return [];
      }
      let cols;
      const tablePath = t.split('.');

      if (tablePath.length === 3) {
        cols = await apiClient.getColumns({
          ...query,
          dataset: tablePath[1],
          table: tablePath[2],
          project: tablePath[0],
        });
      } else {
        if (!query.dataset) {
          return [];
        }
        cols = await apiClient.getColumns({ ...query, table: t, project: tablePath[0] });
      }

      if (cols.length > 0) {
        const schema = await apiClient.getTableSchema({
          ...query,
          dataset: tablePath[1],
          table: tablePath[2],
          project: tablePath[0],
        });
        return cols.map((c) => {
          const cInfo = schema.schema ? getColumnInfoFromSchema(c, schema.schema) : null;
          return { name: c, ...cInfo };
        });
      } else {
        return [];
      }
    },
    [apiClient, query]
  );

  const getTables = useCallback(
    async (p?: string) => {
      if (!apiClient) {
        return [];
      }

      let projects = [];

      if (!p) {
        projects = await apiClient.getProjects();
        return projects.map((p) => ({ name: p.displayName, completion: `\`${p.projectId}.` }));
      } else {
        const path = p.split('.').filter((s) => s);
        if (path.length > 2) {
          return [];
        }
        if (path[0] && path[1]) {
          const tables = await apiClient.getTables({ ...query, project: path[0], dataset: path[1] });
          return tables.map((t) => ({ name: t, completion: `${t}\`` }));
        } else if (path[0]) {
          const datasets = await apiClient.getDatasets(query.location, path[0]);
          return datasets.map((d) => ({ name: d, completion: `${d}.` }));
        } else {
          return [];
        }
      }
    },
    [apiClient, query]
  );

  const getTableSchema = useCallback(
    async (project: string, dataset: string, table: string) => {
      if (!apiClient) {
        return null;
      }

      return apiClient.getTableSchema({ ...query, dataset, table, project });
    },
    [apiClient, query]
  );

  const renderQueryEditor = (width?: number, height?: number) => {
    return (
      <QueryEditorRaw
        getTables={getTables}
        getColumns={getColumns}
        getTableSchema={getTableSchema}
        query={query}
        width={width}
        height={height ? height - toolboxMeasure.height : undefined}
        onChange={onChange}
      >
        {({ formatQuery }) => {
          return (
            <div ref={toolboxRef}>
              <QueryToolbox
                apiClient={apiClient}
                query={queryToValidate}
                onValidate={onValidate}
                onFormatCode={formatQuery}
                showTools
                range={range}
                onExpand={setIsExpanded}
                isExpanded={isExpanded}
              />
            </div>
          );
        }}
      </QueryEditorRaw>
    );
  };

  const renderEditor = (standalone = false) => {
    return standalone ? (
      <AutoSizer>
        {({ width, height }) => {
          return renderQueryEditor(width, height);
        }}
      </AutoSizer>
    ) : (
      <div ref={editorRef}>{renderQueryEditor()}</div>
    );
  };

  const renderPlaceholder = () => {
    return (
      <div
        style={{
          width: editorMeasure.width,
          height: editorMeasure.height,
          background: theme.colors.background.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Editing in expanded code editor
      </div>
    );
  };

  return (
    <>
      {isExpanded ? renderPlaceholder() : renderEditor()}
      {isExpanded && (
        <Modal
          title={`Query ${query.refId}`}
          closeOnBackdropClick={false}
          closeOnEscape={false}
          className={styles.modal}
          contentClassName={styles.modalContent}
          isOpen={isExpanded}
          onDismiss={() => {
            setIsExpanded(false);
          }}
        >
          {renderEditor(true)}
        </Modal>
      )}
    </>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    modal: css`
      width: 95vw;
      height: 95vh;
    `,
    modalContent: css`
      height: 100%;
      padding-top: 0;
    `,
  };
}
