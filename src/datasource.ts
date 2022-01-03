import _ from 'lodash';
import BigQueryQuery, { BigQueryQueryNG } from './bigquery_query';
import { BigQueryOptions, GoogleAuthType, QueryModel } from './types';
import { v4 as generateID } from 'uuid';
import {
  DataFrame,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceInstanceSettings,
  ScopedVars,
  VariableModel,
  vectorator,
} from '@grafana/data';
import { DataSourceWithBackend, getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { formatBigqueryError, quoteLiteral } from 'utils';
import BQTypes from '@google-cloud/bigquery/build/src/types';

export class BigQueryDatasource extends DataSourceWithBackend<BigQueryQueryNG, BigQueryOptions> {
  private readonly url?: string;
  jsonData: BigQueryOptions;

  authenticationType: string;

  constructor(instanceSettings: DataSourceInstanceSettings<BigQueryOptions>) {
    super(instanceSettings);
    this.url = instanceSettings.url;

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

  async annotationQuery(options: any): Promise<any> {}

  // @ts-ignore
  private async doRequest(url: string, requestId = 'requestId', maxRetries = 3) {
    return getBackendSrv()
      .fetch<BQTypes.IQueryResponse>({
        method: 'GET',
        requestId: generateID(),
        url: this.url + url,
      })
      .toPromise()
      .then((result) => {
        if (result?.status !== 200) {
          if (result && result.status >= 500 && maxRetries > 0) {
            return this.doRequest(url, requestId, maxRetries - 1);
          }
          throw formatBigqueryError((result?.data as any).error);
        }

        return result;
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
    // TMP until we refactor Query Model
    const query = new BigQueryQuery(queryModel, scopedVars);
    const rawSql = query.target.rawQuery ? query.target.rawSql : query.buildQuery();
    const interpolatedSql = getTemplateSrv().replace(rawSql, scopedVars, this.interpolateVariable);

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
