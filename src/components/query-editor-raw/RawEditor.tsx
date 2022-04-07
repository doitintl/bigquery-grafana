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
        cols = await apiClient.getColumns(query.location, tablePath[1], tablePath[2]);
      } else {
        if (!query.dataset) {
          return [];
        }
        cols = await apiClient.getColumns(query.location, query.dataset, t!);
      }

      if (cols.length > 0) {
        const schema = await apiClient.getTableSchema(query.location, tablePath[1], tablePath[2]);
        return cols.map((c) => {
          const cInfo = schema.schema ? getColumnInfoFromSchema(c, schema.schema) : null;
          return { name: c, ...cInfo };
        });
      } else {
        return [];
      }
    },
    [apiClient, query.location, query.dataset]
  );

  const getTables = useCallback(
    async (d?: string) => {
      if (!apiClient) {
        return [];
      }

      let datasets = [];
      if (!d) {
        datasets = await apiClient.getDatasets(query.location);
        return datasets.map((d) => ({ name: d, completion: `\`${apiClient.getDefaultProject()}.${d}.` }));
      } else {
        const path = d.split('.').filter((s) => s);
        if (path.length > 2) {
          return [];
        }
        if (path[0] && path[1]) {
          const tables = await apiClient.getTables(query.location, path[1]);
          return tables.map((t) => ({ name: t, completion: `${t}\`` }));
        } else if (path[0]) {
          datasets = await apiClient.getDatasets(query.location);
          return datasets.map((d) => ({ name: d, completion: `${d}` }));
        } else {
          return [];
        }
      }
    },
    [apiClient, query.location]
  );

  const getTableSchema = useCallback(
    async (location: string, dataset: string, table: string) => {
      if (!apiClient) {
        return null;
      }

      return apiClient.getTableSchema(location, dataset, table);
    },
    [apiClient]
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
