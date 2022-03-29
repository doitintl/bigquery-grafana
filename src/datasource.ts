import _ from 'lodash';
import moment from 'moment';
import BigQueryQuery from './bigquery_query';
import ResponseParser, { IResultFormat } from './response_parser';
import SqlParser from './sql_parser';
import { v4 as generateID } from 'uuid';
// import { Table } from 'apache-arrow';
//import { toDataQueryResponse } from '@grafana/runtime';
// import axios from 'axios';
// import { readFileSync } from 'fs';
// import { Table } from 'apache-arrow';

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

    if (strInterval.trim() === 'min') {
      strInterval = 'm';
    }
    return [strInterval, shift];
  }

  public static _extractFromClause(sql: string) {
    return SqlParser.getProjectDatasetTableFromSql(sql);
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

    if (strInterval === 'min') {
      strInterval = 'm';
    }
    copy.range.from = options.range.from.subtract(parseInt(shift, 10), strInterval);
    copy.range.to = options.range.to.subtract(parseInt(shift, 10), strInterval);
    return copy;
  }

  private static _updatePartition(q, options, convertToUTC = false) {
    if (q.indexOf('AND _PARTITIONTIME >= ') < 1) {
      return q;
    }
    if (q.indexOf('AND _PARTITIONTIME <') < 1) {
      return q;
    }
    const from = q.substr(q.indexOf('AND _PARTITIONTIME >= ') + 22, 21);

    const newFrom = "'" + BigQueryQuery.formatDateToString(options.range.from._d, convertToUTC, '-', true) + "'";
    q = q.replace(from, newFrom);
    const to = q.substr(q.indexOf('AND _PARTITIONTIME < ') + 21, 21);
    const newTo = "'" + BigQueryQuery.formatDateToString(options.range.to._d, convertToUTC, '-', true) + "'";

    q = q.replace(to, newTo) + '\n ';
    return q;
  }

  private static _updateTableSuffix(q, options, convertToUTC = false) {
    const ind = q.indexOf('AND  _TABLE_SUFFIX BETWEEN ');
    if (ind < 1) {
      return q;
    }
    const from = q.substr(ind + 28, 8);

    const newFrom = BigQueryQuery.formatDateToString(options.range.from._d, convertToUTC);
    q = q.replace(from, newFrom);
    const to = q.substr(ind + 43, 8);
    const newTo = BigQueryQuery.formatDateToString(options.range.to._d, convertToUTC);
    q = q.replace(to, newTo) + '\n ';
    return q;
  }
  public authenticationType: string;
  public projectName: string;
  public readonly name: string;
  public readonly id: number;
  public readonly type: string;
  public readonly uid: string;
  private readonly url: string;
  private readonly baseUrl: string;
  private jsonData: any;
  private responseParser: ResponseParser;
  private queryModel: BigQueryQuery;
  private runInProject: string;
  private processingLocation: string;
  private queryPriority: string;
  // private options: any;

  /** @ngInject */
  constructor(instanceSettings, private backendSrv, private $q, private templateSrv) {
    this.name = instanceSettings.name;
    this.id = instanceSettings.id;
    console.log(instanceSettings,"instanceSettings")
    this.type = instanceSettings.type;
    this.uid = instanceSettings.uid;
    this.url = instanceSettings.url;
    this.jsonData = instanceSettings.jsonData;
    this.baseUrl = `/bigquery/`;
    //

    //
    this.responseParser = new ResponseParser(this.$q);
    this.queryModel = new BigQueryQuery({});
    this.authenticationType = instanceSettings.jsonData.authenticationType || 'jwt';
    (async () => {
      this.projectName = instanceSettings.jsonData.defaultProject || (await this.getDefaultProject());
    })();
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
    // this.options = options
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
        this.queryModel.target.rawSql = q;
        return this.doQuery(q, options.panelId + query.refId, query.queryPriority).then((response) => {
          return ResponseParser.parseDataQuery(response, query.format);
        });
      } else {
        // Fix raw sql
        const sqlWithNoVariables = this.templateSrv.replace(tmpQ, options.scopedVars, this.interpolateVariable);
        const [project, dataset, table] = BigQueryDatasource._extractFromClause(sqlWithNoVariables);
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
    if (!this.projectName) {
      try {
        await this.getDefaultProject();
      } catch (error) {
        message = error.statusText ? error.statusText : defaultErrorMessage;
      }
    }
    try {
      const path = `v2/projects/${this.projectName}/datasets`;
      const response = await this.doRequest(`${this.baseUrl}${path}`);
      if (response.status !== 200) {
        status = 'error';
        message = response.statusText ? response.statusText : defaultErrorMessage;
      }
    } catch (error) {
      message = error.statusText ? error.statusText : defaultErrorMessage;
      status = 'error';
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
    console.log("cacheEnabale", this.jsonData.enableCache);
    if (this.jsonData.enableCache) {
      if (this.jsonData.cacheType === "redis") {
        try {
          var redisURL = this.jsonData.cacheURL;
          var redisDatabase = this.jsonData.cacheDatabase;
          var redisPassword = this.jsonData.cachePassword;
          if (redisURL === undefined) {redisURL = ""}
          if (!redisDatabase) {redisDatabase = "0"}
          if (redisPassword === undefined) {redisPassword = ""}
          const path = `redis/validate/${redisURL}/${redisDatabase}/${redisPassword}`;
          const response = await this.doRequest(`${this.baseUrl}${path}`);
          if (response.status !== 200) {
            status = 'error';
            message = response.statusText ? response.statusText : defaultErrorMessage;
          }
        } catch (error) {
          message = error.statusText ? error.statusText : defaultErrorMessage;
          status = 'error';
        }
      }
     
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
        const data = await this.getProjects();
        this.projectName = data[0].value;
        if (!this.runInProject) {
          this.runInProject = this.projectName;
        }
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
    [query.rawSql, ,] = this.queryModel.expend_macros(options);
    return this.backendSrv
      .datasourceRequest({
        data: {
          priority: this.queryPriority,
          from: options.range.from.valueOf().toString(),
          query: query.rawSql,
          to: options.range.to.valueOf().toString(),
          useLegacySql: false,
          useQueryCache: false,
        },
        method: 'POST',
        requestId: options.annotation.name,
        url,
      })
      .then((data) => this.responseParser.transformAnnotationResponse(options, data));
  }
  private setUpQ(modOptions, options, query) {
    let [q, hasMacro, convertToUTC] = this.queryModel.expend_macros(modOptions);
    if (q) {
      q = this.setUpPartition(q, query.partitioned, query.partitionedField, modOptions, hasMacro, convertToUTC);
      q = BigQueryDatasource._updatePartition(q, modOptions, convertToUTC);
      q = BigQueryDatasource._updateTableSuffix(q, modOptions, convertToUTC);
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
   * Add partition to query unless it has one OR already being ranged by other condition
   * @param query
   * @param isPartitioned
   * @param partitionedField
   * @param options
   */
  private setUpPartition(query, isPartitioned, partitionedField, options, hasMacro = false, convertToUTC = false) {
    partitionedField = partitionedField ? partitionedField : '_PARTITIONTIME';
    const hasTimeFilter = !!(BigQueryQuery.hasDateFilter(query.split(/where/gi)[1] || "") || hasMacro);
    if (isPartitioned && !hasTimeFilter) {
      const { from: { _d: fromD }, to: { _d: toD } } = options.range;
      const from = `${partitionedField} >= '${BigQueryQuery.formatDateToString(fromD, convertToUTC, '-', true)}'`;
      const to = `${partitionedField} < '${BigQueryQuery.formatDateToString(toD, convertToUTC, '-', true)}'`;
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
        requestId: generateID(),
        url: this.url + url
      })
      .then(result => {
        if (result.status !== 200) {
          if (result.status >= 500 && maxRetries > 0) {
            return this.doRequest(url, requestId, maxRetries - 1);
          }
          throw BigQueryDatasource.formatBigqueryError(result.data.error);
        }
        return result;
      })
      .catch(error => {
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
    console.log(this.queryModel.target.enableCache);
    console.log("duration ", this.queryModel.target); // <-------
    data['cacheEnabled'] = (this.queryModel.target.enableCache) ? this.queryModel.target.enableCache : false;
    if (this.queryModel.target.enableCache) {
      data['cacheType'] = this.jsonData.cacheType;
      data['cacheData'] = { url: this.jsonData.cacheURL, password: this.jsonData.cachePassword, database: this.jsonData.cacheDatabase };
      data['cacheDuration'] = parseInt(this.queryModel.target.cacheDuration);
    }
    if (priority.toUpperCase() === 'BATCH') {
      queryiesOrJobs = 'jobs';
      data = { configuration: { query: { query, priority } } };
    }
    const path = `v2/projects/${this.runInProject}/${queryiesOrJobs}`;
    console.log("this.url", this.url)
    const url = this.url + `${this.baseUrl}${path}`;
    console.log("this.queryMod", this.queryModel.target)
    console.log(this.jsonData,"instanceSettings")

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
    // }
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
    if (!data) return data;
    const dataList = dataName.split('.');
    dataList.forEach(element => {
      if (data && data[element]) data = data[element];
    });
    while (queryResults && queryResults.data && queryResults.data.nextPageToken) {
      queryResults = await this.doRequest(`${this.baseUrl}${path}` + '?pageToken=' + queryResults.data.nextPageToken);
      dataList.forEach(element => {
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
