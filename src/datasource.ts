import _ from "lodash";
import moment from "moment";
import BigQueryQuery from "./bigquery_query";
import ResponseParser, { IResultFormat } from "./response_parser";
import {countBy, size} from "lodash-es";
import {sheets} from "googleapis/build/src/apis/sheets";
import {validate} from "@babel/types";

const Shifted = "_shifted";
function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export class BigQueryDatasource {
  public static formatBigqueryError(error) {
    let message = "BigQuery: ";
    let status = "";
    let data = "";
    if (error !== undefined) {
      message += error.message
        ? error.message
        : "Cannot connect to BigQuery API";
      status = error.code;
      data = error.errors[0].reason + ": " + error.message;
    }
    return {
      data: {
        message: data
      },
      status,
      statusText: message
    };
  }

  public static _getShiftPeriod(strInterval) {
    const shift = strInterval.match(/\d+/)[0];
    strInterval = strInterval.substr(shift.length, strInterval.length);
    if (strInterval === "m") {
      strInterval = "M";
    }

    if (strInterval === "min") {
      strInterval = "m";
    }
    return [strInterval, shift];
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
    copy.format += "#" + res;
    copy.refId += Shifted + "_" + res;
    return copy;
  }

  private static _setupTimeShiftQuery(query, options) {
    const index = query.format.indexOf("#");
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
    if (
      !["s", "min", "h", "d", "w", "m", "w", "y", "M"].includes(strInterval)
    ) {
      return copy;
    }
    query.format = query.format.substr(0, index);
    strInterval = res[0];
    const shift = res[1];
    if (strInterval === "m") {
      strInterval = "M";
    }

    if (strInterval === "min") {
      strInterval = "m";
    }
    copy.range.from = options.range.from.subtract(
      parseInt(shift, 10),
      strInterval
    );
    copy.range.to = options.range.to.subtract(parseInt(shift, 10), strInterval);
    return copy;
  }

  private static _updatePartition(q, options) {
    if (q.indexOf("AND _PARTITIONTIME >= ") < 1) {
      return q;
    }
    if (q.indexOf("AND _PARTITIONTIME <") < 1) {
      return q;
    }
    const from = q.substr(q.indexOf("AND _PARTITIONTIME >= ") + 22, 21);

    const newFrom =
      "'" +
      BigQueryQuery.formatDateToString(options.range.from._d, "-", true) +
      "'";
    q = q.replace(from, newFrom);
    const to = q.substr(q.indexOf("AND _PARTITIONTIME < ") + 21, 21);
    const newTo =
      "'" +
      BigQueryQuery.formatDateToString(options.range.to._d, "-", true) +
      "'";

    q = q.replace(to, newTo) + "\n ";
    return q;
  }
  public authenticationType: string;
  public projectName: string;
  private readonly id: any;
  private name: any;
  private jsonData: any;
  private responseParser: ResponseParser;
  private queryModel: BigQueryQuery;
  private interval: string;
  private readonly baseUrl: string;
  private readonly url: string;

  /** @ngInject */
  constructor(
    instanceSettings,
    private backendSrv,
    private $q,
    private templateSrv,
    private timeSrv
  ) {
    this.name = instanceSettings.name;
    this.id = instanceSettings.id;
    this.jsonData = instanceSettings.jsonData;
    this.responseParser = new ResponseParser(this.$q);
    this.queryModel = new BigQueryQuery({});
    this.baseUrl = `/bigquery/`;
    this.url = instanceSettings.url;
    this.interval = (instanceSettings.jsonData || {}).timeInterval || "1m";
    this.authenticationType =
      instanceSettings.jsonData.authenticationType || "jwt";
    (async () => {
      this.projectName =
        instanceSettings.jsonData.defaultProject ||
        (await this.getDefaultProject());
    })();
  }

  public async query(options) {
    const queries = _.filter(options.targets, target => {
      return target.hide !== true;
    }).map(target => {
      const queryModel = new BigQueryQuery(
        target,
        this.templateSrv,
        options.scopedVars
      );
      this.queryModel = queryModel;
      return {
        datasourceId: this.id,
        format: target.format,
        intervalMs: options.intervalMs,
        maxDataPoints: options.maxDataPoints,
        rawSql: queryModel.render(this.interpolateVariable),
        refId: target.refId
      };
    });

    if (queries.length === 0) {
      return this.$q.when({ data: [] });
    }
    _.map(queries, query => {
      const newQuery = BigQueryDatasource._createTimeShiftQuery(query);
      if (newQuery) {
        queries.push(newQuery);
      }
    });
    const allQueryPromise = _.map(queries, query => {
      const tmpQ = this.queryModel.target.rawSql;
      this.queryModel.target.rawSql = query.rawSql;
      const modOptions = BigQueryDatasource._setupTimeShiftQuery(
        query,
        options
      );
      let q = this.queryModel.expend_macros(modOptions);
      q = BigQueryDatasource._updatePartition(q, modOptions);
      if (query.refId.search(Shifted) > -1) {
        q = this._updateAlias(q, modOptions, query.refId);
      }
      q += " LIMIT " + options.maxDataPoints;
      console.log(q);
      this.queryModel.target.rawSql = tmpQ;
      return this.doQuery(q, options.panelId + query.refId).then(response => {
        return ResponseParser.parseDataQuery(response, query.format);
      });
    });
    return this.$q.all(allQueryPromise).then(
      (responses): any => {
        const data = [];
        for (const response of responses) {
          if (response.type && response.type === "table") {
            data.push(response);
          } else {
            for (const dp of response) {
              data.push(dp);
            }
          }
        }
        for (const d of data) {
          if (
            typeof d.target !== "undefined" &&
            d.target.search(Shifted) > -1
          ) {
            const res = BigQueryDatasource._getShiftPeriod(
              d.target.substring(d.target.lastIndexOf("_") + 1, d.target.length)
            );
            const shiftPeriod = res[0];
            const shiftVal = res[1];
            for(let i = 0; i < d.datapoints.length; i++){
              d.datapoints[i][1] = moment(d.datapoints[i][1])
                .subtract(shiftVal, shiftPeriod)
                .valueOf();
            }
          }
        }
        return { data };
      }
    );
  }

  public metricFindQuery(query, optionalOptions) {
    let refId = "tempvar";
    if (
      optionalOptions &&
      optionalOptions.variable &&
      optionalOptions.variable.name
    ) {
      refId = optionalOptions.variable.name;
    }
    const interpolatedQuery = {
      datasourceId: this.id,
      format: "table",
      rawSql: this.templateSrv.replace(query, {}, this.interpolateVariable),
      refId
    };
    const range = this.timeSrv.timeRange();
    const data = {
      from: range.from.valueOf().toString(),
      queries: [interpolatedQuery],
      to: range.to.valueOf().toString()
    };
    return this.doQuery(interpolatedQuery.rawSql, refId).then(metricData =>
      ResponseParser.parseDataQuery(metricData, "var")
    );
  }
  public async testDatasource() {
    let status = "success";
    let message = "Successfully queried the BigQuery API.";
    const defaultErrorMessage = "Cannot connect to BigQuery API";
    try {
      const path = `v2/projects/${this.projectName}/datasets`;
      const response = await this.doRequest(`${this.baseUrl}${path}`);
      if (response.status !== 200) {
        status = "error";
        message = response.statusText
          ? response.statusText
          : defaultErrorMessage;
      }
    } catch (error) {
      message = error.statusText ? error.statusText : defaultErrorMessage;
    }
    try {
      const path = `v2/projects/${this.projectName}/jobs/no-such-jobs`;
      const response = await this.doRequest(`${this.baseUrl}${path}`);
      if (response.status !== 200) {
        status = "error";
        message = response.statusText
          ? response.statusText
          : defaultErrorMessage;
      }
    } catch (error) {
      if (error.status !== 404) {
        message = error.statusText ? error.statusText : defaultErrorMessage;
      }
    }
    return {
      message,
      status
    };
  }

  public async getProjects(): Promise<IResultFormat[]> {
    const path = `v2/projects`;
    const data = await this.paginatedResults(path, "projects");
    return ResponseParser.parseProjects(data);
  }

  public async getDatasets(projectName): Promise<IResultFormat[]> {
    const path = `v2/projects/${projectName}/datasets`;
    const data = await this.paginatedResults(path, "datasets");
    return ResponseParser.parseDatasets(data);
  }

  public async getTables(
    projectName: string,
    datasetName: string
  ): Promise<IResultFormat[]> {
    const path = `v2/projects/${projectName}/datasets/${datasetName}/tables`;
    const data = await this.paginatedResults(path, "tables");
    return new ResponseParser(this.$q).parseTabels(data);
  }

  public async getTableFields(
    projectName: string,
    datasetName: string,
    tableName: string,
    filter
  ): Promise<IResultFormat[]> {
    const path = `v2/projects/${projectName}/datasets/${datasetName}/tables/${tableName}`;
    const data = await this.paginatedResults(path, "schema.fields");
    return ResponseParser.parseTableFields(data, filter);
  }

  public async getDefaultProject() {
    try {
      if (this.authenticationType === "gce" || !this.projectName) {
        let data;
        data = await this.getProjects();
        this.projectName = data[0].value;
        return data[0].value;
      } else {
        return this.projectName;
      }
    } catch (error) {
      return (this.projectName = "");
    }
  }

  public annotationQuery(options) {
    const path = `v2/projects/${this.projectName}/queries`;
    const url = this.url + `${this.baseUrl}${path}`;
    if (!options.annotation.rawQuery) {
      return this.$q.reject({
        message: "Query missing in annotation definition"
      });
    }

    const query = {
      datasourceId: this.id,
      format: "table",
      rawSql: this.templateSrv.replace(
        options.annotation.rawQuery,
        options.scopedVars,
        this.interpolateVariable
      ),
      refId: options.annotation.name
    };
    return this.backendSrv
      .datasourceRequest({
        data: {
          query: query.rawSql,
          from: options.range.from.valueOf().toString(),
          to: options.range.to.valueOf().toString(),
          useLegacySql: false,
          useQueryCache: true
        },
        method: "POST",
        requestId: options.annotation.name,
        url: url
      })
      .then(data =>
        this.responseParser.transformAnnotationResponse(options, data)
      );
  }

  private async doRequest(url, requestId = "requestId", maxRetries = 3) {
    return this.backendSrv
      .datasourceRequest({
        method: "GET",
        requestId,
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

  private async doQueryRequest(query, requestId, maxRetries = 3) {
    const path = `v2/projects/${this.projectName}/queries`;
    const url = this.url + `${this.baseUrl}${path}`;
    return this.backendSrv
      .datasourceRequest({
        data: {
          query,
          useLegacySql: false,
          useQueryCache: true
        },
        method: "POST",
        requestId,
        url
      })
      .then(result => {
        if (result.status !== 200) {
          if (result.status >= 500 && maxRetries > 0) {
            return this.doQueryRequest(query, requestId, maxRetries - 1);
          }
          throw BigQueryDatasource.formatBigqueryError(result.data.error);
        }
        return result;
      })
      .catch(error => {
        if (maxRetries > 0) {
          return this.doQueryRequest(query, requestId, maxRetries - 1);
        }
        return BigQueryDatasource._handleError(error);
      });
  }

  private async _waitForJobComplete(queryResults, requestId, jobId) {
    let sleepTimeMs = 100;
    console.log("New job id: ", jobId);
    const path = `v2/projects/${this.projectName}/queries/` + jobId;
    while (!queryResults.data.jobComplete) {
      await sleep(sleepTimeMs);
      sleepTimeMs *= 2;
      queryResults = await this.doRequest(`${this.baseUrl}${path}`, requestId);
      console.log("wating for job to complete ", jobId);
    }
    console.log("Job Done ", jobId);
    return queryResults;
  }

  private async _getQueryResults(queryResults, rows, requestId, jobId) {
    while (queryResults.data.pageToken) {
      const path =
        `v2/projects/${this.projectName}/queries/` +
        jobId +
        "?pageToken=" +
        queryResults.data.pageToken;
      queryResults = await this.doRequest(`${this.baseUrl}${path}`, requestId);
      if (queryResults.length === 0) {
        return rows;
      }
      rows = rows.concat(queryResults.data.rows);
      console.log("getting results for: ", jobId);
    }
    return rows;
  }

  private async doQuery(query, requestId, maxRetries = 1) {
    if (!query) {
      return {
        rows: null,
        schema: null
      };
    }
    let notReady = false;
    ["-- time --", "-- value --"].forEach(element => {
      if (query.indexOf(element) !== -1) {
        notReady = true;
      }
    });
    if (notReady) {
      return {
        rows: null,
        schema: null
      };
    }
    let queryResults = await this.doQueryRequest(
      query,
      requestId,
      (maxRetries = 1)
    );
    if (queryResults.length === 0) {
      return {
        rows: null,
        schema: null
      };
    }
    const jobId = queryResults.data.jobReference.jobId;
    queryResults = await this._waitForJobComplete(
      queryResults,
      requestId,
      jobId
    );
    if (queryResults.length === 0) {
      return {
        rows: null,
        schema: null
      };
    }
    let rows = queryResults.data.rows;
    const schema = queryResults.data.schema;
    rows = await this._getQueryResults(queryResults, rows, requestId, jobId);
    return {
      rows,
      schema
    };
  }

  private interpolateVariable = (value, variable) => {
    if (typeof value === "string") {
      if (variable.multi || variable.includeAll) {
        return BigQueryQuery.quoteLiteral(value);
      } else {
        return value;
      }
    }

    if (typeof value === "number") {
      return value;
    }

    const quotedValues = _.map(value, v => {
      return BigQueryQuery.quoteLiteral(v);
    });
    return quotedValues.join(",");
  };

  private async paginatedResults(path, dataName) {
    let queryResults = await this.doRequest(`${this.baseUrl}${path}`);
    let data = queryResults.data;
    const dataList = dataName.split(".");
    dataList.forEach(element => {
      data = data[element];
    });
    while (queryResults.data.nextPageToken) {
      queryResults = await this.doRequest(
        `${this.baseUrl}${path}` +
          "?pageToken=" +
          queryResults.data.nextPageToken
      );
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
        if (al.type === "alias") {
          q = q.replace("AS " + al.params[0], "AS " + al.params[0] + shifted);
          return q;
        }
      }
      const aliasshiftted = [
        options.targets[0].select[0][0].params[0] + shifted
      ];
      const oldSelect = this.queryModel.buildValueColumn(
        options.targets[0].select[0]
      );
      const newSelect = this.queryModel.buildValueColumn([
        options.targets[0].select[0][0],
        options.targets[0].select[0][1],
        { type: "alias", params: [aliasshiftted] }
      ]);
      q = q.replace(oldSelect, newSelect);
    }
    return q;
  }
}
