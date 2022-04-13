import _ from 'lodash';
import { BigQueryQueryNG, BigQueryOptions, GoogleAuthType, QueryModel, QueryFormat } from './types';
import {
  DataFrame,
  DataQuery,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceInstanceSettings,
  ScopedVars,
  vectorator,
} from '@grafana/data';
import { DataSourceWithBackend, getTemplateSrv } from '@grafana/runtime';
import { interpolateVariable } from './utils/interpolateVariable';
import { DEFAULT_REGION } from './constants';
import { EditorMode } from '@grafana/experimental';

export class BigQueryDatasource extends DataSourceWithBackend<BigQueryQueryNG, BigQueryOptions> {
  jsonData: BigQueryOptions;

  authenticationType: string;
  annotations = {};

  constructor(instanceSettings: DataSourceInstanceSettings<BigQueryOptions>) {
    super(instanceSettings);

    this.jsonData = instanceSettings.jsonData;
    this.authenticationType = instanceSettings.jsonData.authenticationType || GoogleAuthType.JWT;
  }

  filterQuery(query: BigQueryQueryNG) {
    if (query.hide || !query.rawSql) {
      return false;
    }
    return true;
  }

  async importQueries(queries: DataQuery[]) {
    const importedQueries = [];

    for (let i = 0; i < queries.length; i++) {
      if (queries[i].datasource?.type === 'doitintl-bigquery-datasource') {
        const {
          // ignore not supported fields
          group,
          metricColumn,
          orderByCol,
          orderBySort,
          select,
          timeColumn,
          timeColumnType,
          where,
          convertToUTC,
          // use the rest of the fields
          ...commonQueryProps
        } = queries[i] as any;

        importedQueries.push({
          ...commonQueryProps,
          location: (queries[i] as any).location || DEFAULT_REGION,
          format: (queries[i] as any).format === 'time_series' ? QueryFormat.Timeseries : QueryFormat.Table,
          editorMode: EditorMode.Code,
        } as BigQueryQueryNG);
      }
    }

    return Promise.resolve(importedQueries) as any;
  }

  async metricFindQuery(query: BigQueryQueryNG) {
    if (!query.rawSql) {
      return [];
    }
    const frame = await this.runQuery(query);

    if (frame.fields?.length === 0) {
      return [];
    }

    if (frame?.fields?.length === 1) {
      return vectorator(frame?.fields[0]?.values).map((text) => ({ text, value: text }));
    }

    // convention - assume the first field is an id field
    const ids = frame?.fields[0]?.values;
    return vectorator(frame?.fields[1]?.values).map((text, i) => ({ text, value: ids.get(i) }));
  }

  runQuery(query: Partial<BigQueryQueryNG>): Promise<DataFrame> {
    return new Promise((resolve) => {
      const req = {
        targets: [{ ...query, refId: String(Math.random()) }],
      } as DataQueryRequest<BigQueryQueryNG>;
      this.query(req).subscribe((res: DataQueryResponse) => {
        resolve(res.data[0] || { fields: [] });
      });
    });
  }

  applyTemplateVariables(queryModel: BigQueryQueryNG, scopedVars: ScopedVars): QueryModel {
    const interpolatedSql = getTemplateSrv().replace(queryModel.rawSql, scopedVars, interpolateVariable);

    const result = {
      refId: queryModel.refId,
      hide: queryModel.hide,
      key: queryModel.key,
      queryType: queryModel.queryType,
      datasource: queryModel.datasource,
      rawSql: interpolatedSql,
      format: queryModel.format,
      connectionArgs: {
        dataset: queryModel.dataset!,
        table: queryModel.table!,
        location: queryModel.location!,
      },
    };
    return result;
  }
}
