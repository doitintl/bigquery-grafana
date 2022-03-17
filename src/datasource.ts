import _ from 'lodash';
import { BigQueryQueryNG, BigQueryOptions, GoogleAuthType, QueryModel } from './types';
import {
  DataFrame,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceInstanceSettings,
  ScopedVars,
  VariableModel,
  vectorator,
} from '@grafana/data';
import { DataSourceWithBackend, getTemplateSrv } from '@grafana/runtime';
import { quoteLiteral } from 'utils';
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
    if (!query.rawSql) {
      return false;
    }
    return true;
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

  private interpolateVariable = (value: any, variable: VariableModel) => {
    if (typeof value === 'string') {
      // @ts-ignore
      if (variable.multi || variable.includeAll) {
        return quoteLiteral(value);
      } else {
        return value;
      }
    }

    if (typeof value === 'number') {
      return value;
    }

    const quotedValues = _.map(value, (v) => {
      return quoteLiteral(v);
    });
    return quotedValues.join(',');
  };

  applyTemplateVariables(queryModel: BigQueryQueryNG, scopedVars: ScopedVars): QueryModel {
    const interpolatedSql = getTemplateSrv().replace(queryModel.rawSql, scopedVars, this.interpolateVariable);

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
