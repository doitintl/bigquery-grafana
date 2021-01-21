// import { validate } from "@babel/types";
// import { sheets } from "googleapis/build/src/apis/sheets";
import _ from 'lodash';
// import { countBy, size } from "lodash-es";
import moment from 'moment';
import BigQueryQuery from './bigquery_query';
import ResponseParser, { IResultFormat } from './response_parser';

const Shifted = '_shifted';
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class BigQueryDatasource {
  public static formatBigqueryError(error) {
    let message = 'BigQuery: ';
    let status = '';
    let data = '';
    if (error !== undefined) {
      message += error.message ? error.message : 'Cannot connect to BigQuery API';
      status = error.code;
      data = error.errors[0].reason + ': ' + error.message;
    }
    return {
      data: {
        message: data,
      },
      status,
      statusText: message,
    };
  }

  public static _getShiftPeriod(strInterval) {
    const shift = strInterval.match(/\d+/)[0];
    strInterval = strInterval.substr(shift.length, strInterval.length);
    if (strInterval === 'm') {
      strInterval = 'M';
    }

    if (strInterval === 'min') {
      strInterval = 'm';
    }
    return [strInterval, shift];
  }

  public static _extractFromClause(sql) {
    let str = sql.replace(/\n/g, ' ');
    const from = str.search(/from/i);
    str = str.substring(from + 4).trim();
    const last = str.search(' ');
    return str.substring(1, last - 1);
  }

  public static _FindTimeField(sql, timeFields) {
    const select = sql.search(/select/i);
    const from = sql.search(/from/i);
    const fields = sql.substring(select + 6, from);
    const splitFrom = fields.split(',');
    let col;
    for (let i = 0; i < splitFrom.length; i++) {
      let field = splitFrom[i].search(/ AS /i);
      if (field === -1) {
        field = splitFrom[i].length;
      }
      col = splitFrom[i].substring(0, field).trim().replace('`', '').replace('`', '');
      col = col.replace(/\$__timeGroupAlias\(/g, '');
      col = col.replace(/\$__timeGroup\(/g, '');
      col = col.replace(/\$__timeFilter\(/g, '');
      col = col.replace(/\$__timeFrom\(/g, '');
      col = col.replace(/\$__timeTo\(/g, '');
      col = col.replace(/\$__millisTimeTo\(/g, '');
      col = col.replace(/\$__millisTimeFrom\(/g, '');
      for (const fl of timeFields) {
        if (fl.text === col) {
          return fl;
        }
      }
    }
    return null;
  }
  private static _handleError(error) {
    if (error.cancelled === true) {
      return [];
    }
    let msg = error;
    if (error.data !== undefined) {
      msg = error.data.error;
    }
    throw BigQueryDatasource.formatBigqueryError(msg);
  }
  private static _createTimeShiftQuery(query) {
    const res = BigQueryQuery.getTimeShift(query.rawSql);
    if (!res) {
      return res;
    }
    const copy = query.constructor();
    for (const attr in query) {
      if (query.hasOwnProperty(attr)) {
        copy[attr] = query[attr];
      }
    }
    copy.rawSql = BigQueryQuery.replaceTimeShift(copy.rawSql);
    copy.format += '#' + res;
    copy.refId += Shifted + '_' + res;
    return copy;
  }

  private static _setupTimeShiftQuery(query, options) {
    const index = query.format.indexOf('#');
    const copy = options.constructor();
    for (const attr in options) {
      if (options.hasOwnProperty(attr)) {
        copy[attr] = options[attr];
      }
    }
    if (index === -1) {
      return copy;
    }
    let strInterval = query.format.substr(index + 1, query.format.len);
    const res = BigQueryDatasource._getShiftPeriod(strInterval);
    strInterval = res[0];
    if (!['s', 'min', 'h', 'd', 'w', 'm', 'w', 'y', 'M'].includes(strInterval)) {
      return copy;
    }
    query.format = query.format.substr(0, index);
    strInterval = res[0];
    const shift = res[1];
    if (strInterval === 'm') {
      strInterval = 'M';
    }

    if (strInterval === 'min') {
      strInterval = 'm';
    }
    copy.range.from = options.range.from.subtract(parseInt(shift, 10), strInterval);
    copy.range.to = options.range.to.subtract(parseInt(shift, 10), strInterval);
    return copy;
  }

  private static _updatePartition(q, options) {
    if (q.indexOf('AND _PARTITIONTIME >= ') < 1) {
      return q;
    }
    if (q.indexOf('AND _PARTITIONTIME <') < 1) {
      return q;
    }
    const from = q.substr(q.indexOf('AND _PARTITIONTIME >= ') + 22, 21);

    const newFrom = "'" + BigQueryQuery.formatDateToString(options.range.from._d, '-', true) + "'";
    q = q.replace(from, newFrom);
    const to = q.substr(q.indexOf('AND _PARTITIONTIME < ') + 21, 21);
    const newTo = "'" + BigQueryQuery.formatDateToString(options.range.to._d, '-', true) + "'";

    q = q.replace(to, newTo) + '\n ';
    return q;
  }

  private static _updateTableSuffix(q, options) {
    const ind = q.indexOf('AND  _TABLE_SUFFIX BETWEEN ');
    if (ind < 1) {
      return q;
    }
    const from = q.substr(ind + 28, 8);

    const newFrom = BigQueryQuery.formatDateToString(options.range.from._d);
    q = q.replace(from, newFrom);
    const to = q.substr(ind + 43, 8);
    const newTo = BigQueryQuery.formatDateToString(options.range.to._d);
    q = q.replace(to, newTo) + '\n ';
    return q;
  }
  public authenticationType: string;
  public projectName: string;
  private readonly id: any;
  private jsonData: any;
  private responseParser: ResponseParser;
  private queryModel: BigQueryQuery;
  private readonly baseUrl: string;
  private readonly url: string;
  private mixpanel;
  private runInProject: string;
  private processingLocation: string;
  private queryPriority: string;

  /** @ngInject */
  constructor(instanceSettings, private backendSrv, private $q, private templateSrv) {
    this.id = instanceSettings.id;
    this.jsonData = instanceSettings.jsonData;
    this.responseParser = new ResponseParser(this.$q);
    this.queryModel = new BigQueryQuery({});
    this.baseUrl = `/bigquery/`;
    this.url = instanceSettings.url;
    this.authenticationType = instanceSettings.jsonData.authenticationType || 'jwt';
    (async () => {
      this.projectName = instanceSettings.jsonData.defaultProject || (await this.getDefaultProject());
    })();
    this.mixpanel = require('mixpanel-browser');
    if (this.jsonData.sendUsageData !== false) {
      this.mixpanel.init('86fa5c838013959cc6867dc884958f7e');
      this.mixpanel.track('datasource.create');
    }
    this.runInProject =
      this.jsonData.flatRateProject && this.jsonData.flatRateProject.length
        ? this.jsonData.flatRateProject
        : this.projectName;
    this.processingLocation =
      this.jsonData.processingLocation && this.jsonData.processingLocation.length
        ? this.jsonData.processingLocation
        : undefined;
    this.queryPriority = this.jsonData.queryPriority;
  }

  public async query(options) {
    const queries = _.filter(options.targets, (target) => {
      return target.hide !== true;
    }).map((target) => {
      const queryModel = new BigQueryQuery(target, this.templateSrv, options.scopedVars);
      this.queryModel = queryModel;
      return {
        queryPriority: this.queryPriority,
        datasourceId: this.id,
        format: target.format,
        intervalMs: options.intervalMs,
        maxDataPoints: options.maxDataPoints,
        metricColumn: target.metricColumn,
        partitioned: target.partitioned,
        partitionedField: target.partitionedField,
        rawSql: queryModel.render(this.interpolateVariable),
        refId: target.refId,
        sharded: target.sharded,
        table: target.table,
        timeColumn: target.timeColumn,
        timeColumnType: target.timeColumnType,
      };
    });

    if (queries.length === 0) {
      return this.$q.when({ data: [] });
    }
    _.map(queries, (query) => {
      const newQuery = BigQueryDatasource._createTimeShiftQuery(query);
      if (newQuery) {
        queries.push(newQuery);
      }
    });
    let modOptions;
    const allQueryPromise = _.map(queries, (query) => {
      const tmpQ = this.queryModel.target.rawSql;
      if (this.queryModel.target.rawQuery === false) {
        this.queryModel.target.metricColumn = query.metricColumn;
        this.queryModel.target.partitioned = query.partitioned;
        this.queryModel.target.partitionedField = query.partitionedField;
        this.queryModel.target.rawSql = query.rawSql;
        this.queryModel.target.sharded = query.sharded;
        this.queryModel.target.table = query.table;
        this.queryModel.target.timeColumn = query.timeColumn;
        this.queryModel.target.timeColumnType = query.timeColumnType;
        modOptions = BigQueryDatasource._setupTimeShiftQuery(query, options);
        const q = this.setUpQ(modOptions, options, query);
        console.log(q);
        this.queryModel.target.rawSql = tmpQ;
        return this.doQuery(q, options.panelId + query.refId, query.queryPriority).then((response) => {
          return ResponseParser.parseDataQuery(response, query.format);
        });
      } else {
        // Fix raw sql
        const from = BigQueryDatasource._extractFromClause(tmpQ);
        const splitFrom = from.split('.');
        const project = splitFrom[0];
        const dataset = splitFrom[1];
        const table = splitFrom[2];
        this.getDateFields(project, dataset, table)
          .then((dateFields) => {
            const tm = BigQueryDatasource._FindTimeField(tmpQ, dateFields);
            this.queryModel.target.timeColumn = tm.text;
            this.queryModel.target.timeColumnType = tm.value;
            this.queryModel.target.table = table;
          })
          .catch((err) => {
            console.log(err);
          });
        this.queryModel.target.rawSql = query.rawSql;
        modOptions = BigQueryDatasource._setupTimeShiftQuery(query, options);
        const q = this.setUpQ(modOptions, options, query);
        console.log(q);
        return this.doQuery(q, options.panelId + query.refId, query.queryPriority).then((response) => {
          return ResponseParser.parseDataQuery(response, query.format);
        });
      }
    });
    return this.$q.all(allQueryPromise).then((responses): any => {
      const data = [];
      if (responses) {
        for (const response of responses) {
          if (response.type && response.type === 'table') {
            data.push(response);
          } else {
            for (const dp of response) {
              data.push(dp);
            }
          }
        }
      }
      for (const d of data) {
        if (typeof d.target !== 'undefined' && d.target.search(Shifted) > -1) {
          const res = BigQueryDatasource._getShiftPeriod(
            d.target.substring(d.target.lastIndexOf('_') + 1, d.target.length)
          );
          const shiftPeriod = res[0];
          const shiftVal = res[1];
          for (let i = 0; i < d.datapoints.length; i++) {
            d.datapoints[i][1] = moment(d.datapoints[i][1]).subtract(shiftVal, shiftPeriod).valueOf();
          }
        }
      }
      return { data };
    });
  }

  public metricFindQuery(query, optionalOptions) {
    let refId = 'tempvar';
    if (optionalOptions && optionalOptions.variable && optionalOptions.variable.name) {
      refId = optionalOptions.variable.name;
    }
    const interpolatedQuery = {
      datasourceId: this.id,
      format: 'table',
      rawSql: this.templateSrv.replace(query, {}, this.interpolateVariable),
      refId,
    };
    return this.doQuery(interpolatedQuery.rawSql, refId, query.queryPriority).then(metricData =>
      ResponseParser.parseDataQuery(metricData, "var")
    );
  }
  public async testDatasource() {
    let status = 'success';
    let message = 'Successfully queried the BigQuery API.';
    const defaultErrorMessage = 'Cannot connect to BigQuery API';
    try {
      const path = `v2/projects/${this.projectName}/datasets`;
      const response = await this.doRequest(`${this.baseUrl}${path}`);
      if (response.status !== 200) {
        status = 'error';
        message = response.statusText ? response.statusText : defaultErrorMessage;
      }
    } catch (error) {
      message = error.statusText ? error.statusText : defaultErrorMessage;
    }
    try {
      const path = `v2/projects/${this.projectName}/jobs/no-such-jobs`;
      const response = await this.doRequest(`${this.baseUrl}${path}`);
      if (response.status !== 200) {
        status = 'error';
        message = response.statusText ? response.statusText : defaultErrorMessage;
      }
    } catch (error) {
      if (error.status !== 404) {
        message = error.statusText ? error.statusText : defaultErrorMessage;
      }
    }
    if (this.jsonData.sendUsageData !== false) {
      this.mixpanel.track('datasource.save');
    }
    return {
      message,
      status,
    };
  }

  public async getProjects(): Promise<IResultFormat[]> {
    const path = `v2/projects`;
    const data = await this.paginatedResults(path, 'projects');
    return ResponseParser.parseProjects(data);
  }

  public async getDatasets(projectName): Promise<IResultFormat[]> {
    const path = `v2/projects/${projectName}/datasets`;
    const data = await this.paginatedResults(path, 'datasets');
    return ResponseParser.parseDatasets(data);
  }

  public async getTables(projectName: string, datasetName: string): Promise<IResultFormat[]> {
    const path = `v2/projects/${projectName}/datasets/${datasetName}/tables`;
    const data = await this.paginatedResults(path, 'tables');
    return new ResponseParser(this.$q).parseTabels(data);
  }

  public async getTableFields(
    projectName: string,
    datasetName: string,
    tableName: string,
    filter
  ): Promise<IResultFormat[]> {
    const path = `v2/projects/${projectName}/datasets/${datasetName}/tables/${tableName}`;
    const data = await this.paginatedResults(path, 'schema.fields');
    return ResponseParser.parseTableFields(data, filter);
  }

  public async getDateFields(projectName: string, datasetName: string, tableName: string) {
    return this.getTableFields(projectName, datasetName, tableName, ['DATE', 'TIMESTAMP', 'DATETIME']);
  }
  public async getDefaultProject() {
    try {
      if (this.authenticationType === 'gce' || !this.projectName) {
        let data;
        data = await this.getProjects();
        this.projectName = data[0].value;
        return data[0].value;
      } else {
        return this.projectName;
      }
    } catch (error) {
      return (this.projectName = '');
    }
  }

  public annotationQuery(options) {
    const path = `v2/projects/${this.runInProject}/queries`;
    const url = this.url + `${this.baseUrl}${path}`;
    if (!options.annotation.rawQuery) {
      return this.$q.reject({
        message: 'Query missing in annotation definition',
      });
    }
    const rawSql = this.templateSrv.replace(options.annotation.rawQuery, options.scopedVars, this.interpolateVariable);

    const query = {
      datasourceId: this.id,
      format: 'table',
      rawSql,
      refId: options.annotation.name,
    };
    this.queryModel.target.rawSql = query.rawSql;
    query.rawSql = this.queryModel.expend_macros(options);
    return this.backendSrv
      .datasourceRequest({
        data: {
          priority: this.queryPriority,
          from: options.range.from.valueOf().toString(),
          query: query.rawSql,
          to: options.range.to.valueOf().toString(),
          useLegacySql: false,
          useQueryCache: true,
        },
        method: 'POST',
        requestId: options.annotation.name,
        url,
      })
      .then((data) => this.responseParser.transformAnnotationResponse(options, data));
  }
  private setUpQ(modOptions, options, query) {
    let q = this.queryModel.expend_macros(modOptions);
    if (q) {
      q = this.setUpPartition(q, query.partitioned, query.partitionedField, modOptions);
      q = BigQueryDatasource._updatePartition(q, modOptions);
      q = BigQueryDatasource._updateTableSuffix(q, modOptions);
      if (query.refId.search(Shifted) > -1) {
        q = this._updateAlias(q, modOptions, query.refId);
      }
      const limit = q.match(/[^]+(\bLIMIT\b)/gi);
      if (limit == null) {
        const limitStatement = ' LIMIT ' + options.maxDataPoints;
        const limitPosition = q.match(/\$__limitPosition/g);
        if (limitPosition !== null) {
          q = q.replace(/\$__limitPosition/g, limitStatement);
        } else {
          q += limitStatement;
        }
      }
    }
    return q;
  }
  /**
   * Add partition to query unless it has one
   * @param query
   * @param isPartitioned
   * @param partitionedField
   * @param options
   */
  private setUpPartition(query, isPartitioned, partitionedField, options) {
    partitionedField = partitionedField ? partitionedField : '_PARTITIONTIME';
    if (isPartitioned && !query.match(partitionedField)) {
      const fromD = options.range.from._d.getTime();
      const toD = options.range.to._d.getTime();
      const from = `${partitionedField} >= '${BigQueryQuery.formatDateToString(fromD, '-', true)}'`;
      const to = `${partitionedField} < '${BigQueryQuery.formatDateToString(toD, '-', true)}'`;
      const partition = `where ${from} AND ${to} AND `;
      if (query.match(/where/i)) query = query.replace(/where/i, partition);
      else {
        const reg = /from ('|`|"|){1}(.*?)('|`|"|){1} as ('|`|"|)(\S*)('|`|"|){1}|from ('|`|"|){1}(\S*)('|`|"|){1}/i;
        const fromMatch = query.match(reg);
        query = query.replace(reg, `${fromMatch} ${fromMatch}`);
      }
    }
    return query;
  }
  private async doRequest(url, requestId = 'requestId', maxRetries = 3) {
    return this.backendSrv
      .datasourceRequest({
        method: 'GET',
        requestId,
        url: this.url + url,
      })
      .then((result) => {
        if (result.status !== 200) {
          if (result.status >= 500 && maxRetries > 0) {
            return this.doRequest(url, requestId, maxRetries - 1);
          }
          throw BigQueryDatasource.formatBigqueryError(result.data.error);
        }
        return result;
      })
      .catch((error) => {
        if (maxRetries > 0) {
          return this.doRequest(url, requestId, maxRetries - 1);
        }
        if (error.cancelled === true) {
          return [];
        }
        return BigQueryDatasource._handleError(error);
      });
  }

  private async doQueryRequest(query, requestId, priority, maxRetries = 3) {
    const location = this.queryModel.target.location || this.processingLocation || 'US';
    let data,
      queryiesOrJobs = 'queries';
    data = { priority: priority, location, query, useLegacySql: false, useQueryCache: true }; //ExternalDataConfiguration
    if (priority.toUpperCase() === 'BATCH') {
      queryiesOrJobs = 'jobs';
      data = { configuration: { query: { query, priority } } };
    }
    const path = `v2/projects/${this.runInProject}/${queryiesOrJobs}`;
    const url = this.url + `${this.baseUrl}${path}`;
    return this.backendSrv
      .datasourceRequest({
        data: data,
        method: 'POST',
        requestId,
        url,
      })
      .then((result) => {
        if (result.status !== 200) {
          if (result.status >= 500 && maxRetries > 0) {
            return this.doQueryRequest(query, requestId, priority, maxRetries - 1);
          }
          throw BigQueryDatasource.formatBigqueryError(result.data.error);
        }
        return result;
      })
      .catch((error) => {
        if (maxRetries > 0) {
          return this.doQueryRequest(query, requestId, priority, maxRetries - 1);
        }
        if (error.cancelled === true) {
          return [];
        }
        return BigQueryDatasource._handleError(error);
      });
  }
  private async _waitForJobComplete(queryResults, requestId, jobId) {
    let sleepTimeMs = 100;
    console.log('New job id: ', jobId);
    const location = this.queryModel.target.location || this.processingLocation || 'US';
    const path = `v2/projects/${this.runInProject}/queries/` + jobId + '?location=' + location;
    while (!queryResults.data.jobComplete) {
      await sleep(sleepTimeMs);
      sleepTimeMs *= 2;
      queryResults = await this.doRequest(`${this.baseUrl}${path}`, requestId);
      console.log('wating for job to complete ', jobId);
    }
    console.log('Job Done ', jobId);
    return queryResults;
  }

  private async _getQueryResults(queryResults, rows, requestId, jobId) {
    while (queryResults.data.pageToken) {
      const location = this.queryModel.target.location || this.processingLocation || 'US';
      const path =
        `v2/projects/${this.runInProject}/queries/` +
        jobId +
        '?pageToken=' +
        queryResults.data.pageToken +
        '&location=' +
        location;
      queryResults = await this.doRequest(`${this.baseUrl}${path}`, requestId);
      if (queryResults.length === 0) {
        return rows;
      }
      rows = rows.concat(queryResults.data.rows);
      console.log('getting results for: ', jobId);
    }
    return rows;
  }

  private async doQuery(query, requestId, priority = 'INTERACTIVE') {
    if (!query) {
      return {
        rows: null,
        schema: null,
      };
    }
    let notReady = false;
    ['-- time --', '-- value --'].forEach((element) => {
      if (query.indexOf(element) !== -1) {
        notReady = true;
      }
    });
    if (notReady) {
      return {
        rows: null,
        schema: null,
      };
    }
    let queryResults = await this.doQueryRequest(
      //"tableDefinitions": {
      //   string: {
      //     object (ExternalDataConfiguration)
      //   },
      //   ...
      // },
      query,
      requestId,
      priority
    );
    if (queryResults.length === 0) {
      return {
        rows: null,
        schema: null,
      };
    }
    const jobId = queryResults.data.jobReference.jobId;
    queryResults = await this._waitForJobComplete(queryResults, requestId, jobId);
    if (queryResults.length === 0) {
      return {
        rows: null,
        schema: null,
      };
    }
    let rows = queryResults.data.rows;
    const schema = queryResults.data.schema;
    rows = await this._getQueryResults(queryResults, rows, requestId, jobId);
    return {
      rows,
      schema,
    };
  }

  private interpolateVariable = (value, variable) => {
    if (typeof value === 'string') {
      if (variable.multi || variable.includeAll) {
        return BigQueryQuery.quoteLiteral(value);
      } else {
        return value;
      }
    }

    if (typeof value === 'number') {
      return value;
    }

    const quotedValues = _.map(value, (v) => {
      return BigQueryQuery.quoteLiteral(v);
    });
    return quotedValues.join(',');
  };

  private async paginatedResults(path, dataName) {
    let queryResults = await this.doRequest(`${this.baseUrl}${path}`);
    let data = queryResults.data;
    const dataList = dataName.split('.');
    dataList.forEach((element) => {
      data = data[element];
    });
    while (queryResults.data.nextPageToken) {
      queryResults = await this.doRequest(`${this.baseUrl}${path}` + '?pageToken=' + queryResults.data.nextPageToken);
      dataList.forEach((element) => {
        data = data.concat(queryResults.data[element]);
      });
    }
    return data;
  }
  private _updateAlias(q, options, shiftstr) {
    if (shiftstr !== undefined) {
      const index = shiftstr.search(Shifted);
      const shifted = shiftstr.substr(index, shiftstr.length);
      for (const al of options.targets[0].select[0]) {
        if (al.type === 'alias') {
          q = q.replace('AS ' + al.params[0], 'AS ' + al.params[0] + shifted);
          return q;
        }
      }
      const aliasshiftted = [options.targets[0].select[0][0].params[0] + shifted];
      const oldSelect = this.queryModel.buildValueColumn(options.targets[0].select[0]);
      const newSelect = this.queryModel.buildValueColumn([
        options.targets[0].select[0][0],
        options.targets[0].select[0][1],
        { type: 'alias', params: [aliasshiftted] },
      ]);
      q = q.replace(oldSelect, newSelect);
    }
    return q;
  }
}
