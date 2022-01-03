import React, { useEffect, useCallback } from 'react';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { BigQueryDatasource } from './datasource';
import { DEFAULT_REGION, PROCESSING_LOCATIONS, QUERY_FORMAT_OPTIONS } from './constants';
import { Field, HorizontalGroup, Select } from '@grafana/ui';
import { QueryEditorRaw } from './components/query-editor-raw/QueryEditorRaw';
// import { DatasetSelector } from './components/DatasetSelector';
import { BigQueryQueryNG } from './bigquery_query';
import { BigQueryOptions, QueryFormat } from './types';
import { getApiClient } from './api';
import { getColumnInfoFromSchema } from 'utils/getColumnInfoFromSchema';
import { useAsync } from 'react-use';

type Props = QueryEditorProps<BigQueryDatasource, BigQueryQueryNG, BigQueryOptions>;

function applyQueryDefaults(q: BigQueryQueryNG, ds: BigQueryDatasource) {
  const result = { ...q };

  result.location = q.location || ds.jsonData.defaultRegion || DEFAULT_REGION;
  result.format = q.format !== undefined ? q.format : QueryFormat.Table;
  result.rawSql = q.rawSql || '';

  return result;
}

const isQueryValid = (q: BigQueryQueryNG) => {
  return Boolean(q.location && q.rawSql);
};

export function QueryEditor(props: Props) {
  const { onRunQuery, onChange } = props;
  const { loading: apiLoading, error: apiError, value: apiClient } = useAsync(
    async () => await getApiClient(props.datasource.id),
    [props.datasource]
  );

  const queryWithDefaults = applyQueryDefaults(props.query, props.datasource);

  useEffect(() => {
    return () => {
      getApiClient(props.datasource.id).then((client) => client.dispose());
    };
  }, [props.datasource.id]);

  const getColumns = useCallback(
    // excpects fully qualified table name: <project-id>.<dataset-id>.<table-id>
    async (t: string) => {
      if (!apiClient || !queryWithDefaults.location) {
        return [];
      }
      let cols;
      const tablePath = t.split('.');

      if (tablePath.length === 3) {
        cols = await apiClient.getColumns(queryWithDefaults.location, tablePath[1], tablePath[2]);
      } else {
        if (!queryWithDefaults.dataset) {
          return [];
        }
        cols = await apiClient.getColumns(queryWithDefaults.location, queryWithDefaults.dataset, t!);
      }

      if (cols.length > 0) {
        const schema = await apiClient.getTableSchema(queryWithDefaults.location, tablePath[1], tablePath[2]);
        return cols.map((c) => {
          const cInfo = schema.schema ? getColumnInfoFromSchema(c, schema.schema) : null;
          return { name: c, ...cInfo };
        });
      } else {
        return [];
      }
    },
    [apiClient, queryWithDefaults.location, queryWithDefaults.dataset]
  );

  const getTables = useCallback(
    async (d?: string) => {
      if (!queryWithDefaults.location || !apiClient) {
        return [];
      }

      let datasets = [];
      if (!d) {
        datasets = await apiClient.getDatasets(queryWithDefaults.location);
        return datasets.map((d) => ({ name: d, completion: `${apiClient.getDefaultProject()}.${d}.` }));
      } else {
        const path = d.split('.').filter((s) => s);
        if (path.length > 2) {
          return [];
        }
        if (path[0] && path[1]) {
          const tables = await apiClient.getTables(queryWithDefaults.location, path[1]);
          return tables.map((t) => ({ name: t }));
        } else if (path[0]) {
          datasets = await apiClient.getDatasets(queryWithDefaults.location);
          return datasets.map((d) => ({ name: d, completion: `${d}` }));
        } else {
          return [];
        }
      }
    },
    [apiClient, queryWithDefaults.location]
  );

  const processQuery = useCallback(
    (q: BigQueryQueryNG) => {
      if (isQueryValid(q) && onRunQuery) {
        onRunQuery();
      }
    },
    [onRunQuery]
  );

  const onFormatChange = (e: SelectableValue) => {
    const next = { ...props.query, format: e.value !== undefined ? e.value : QueryFormat.Table };
    props.onChange(next);
    processQuery(next);
  };

  const onLocationChange = (e: SelectableValue) => {
    const next = { ...props.query, location: e.value || DEFAULT_REGION };
    props.onChange(next);
    processQuery(next);
  };

  const onRawQueryChange = useCallback(
    (q: BigQueryQueryNG) => {
      onChange(q);
      processQuery(q);
    },
    [onChange, processQuery]
  );

  if (apiLoading || apiError || !apiClient) {
    return null;
  }

  return (
    <div>
      <HorizontalGroup>
        <Field label="Processing location">
          <Select
            options={PROCESSING_LOCATIONS}
            value={queryWithDefaults.location}
            onChange={onLocationChange}
            className="width-12"
            menuShouldPortal={true}
          />
        </Field>

        <Field label="Format as">
          <Select
            options={QUERY_FORMAT_OPTIONS}
            value={queryWithDefaults.format}
            onChange={onFormatChange}
            className="width-12"
            menuShouldPortal={true}
          />
        </Field>
      </HorizontalGroup>

      <QueryEditorRaw
        getTables={getTables}
        getColumns={getColumns}
        query={queryWithDefaults}
        onChange={onRawQueryChange}
        onRunQuery={props.onRunQuery}
      />
    </div>
  );
}
