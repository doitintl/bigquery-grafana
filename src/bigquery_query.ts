import _ from "lodash";
import { BigQueryDatasource } from './datasource';

export default class BigQueryQuery {
  public static quoteLiteral(value) {
    return "'" + String(value).replace(/'/g, "''") + "'";
  }

  public static escapeLiteral(value) {
    return String(value).replace(/'/g, "''");
  }

  public static quoteFiledName(value) {
    const vals = value.split(".");
    let res = "";
    for (let i = 0; i < vals.length; i++) {
      res = res + "`" + String(vals[i]) + "`";
      if (vals.length > 1 && i + 1 < vals.length) {
        res = res + ".";
      }
    }
    return res;
  }
  public static formatDateToString(date, separator = "", addtime = false) {
    // 01, 02, 03, ... 29, 30, 31
    const DD = (date.getDate() < 10 ? "0" : "") + date.getDate();
    // 01, 02, 03, ... 10, 11, 12
    const MM = (date.getMonth() + 1 < 10 ? "0" : "") + (date.getMonth() + 1);
    // 1970, 1971, ... 2015, 2016, ...
    const YYYY = date.getFullYear();

    // create the format you want
    let dateStr = YYYY + separator + MM + separator + DD;
    if (addtime === true) {
      dateStr += " " + date.toTimeString().substr(0, 8);
    }
    return dateStr;
  }

  public static _getInterval(q, alias: boolean) {
    let res = alias
      ? q.match(/(.*\$__timeGroupAlias\(([\w._]+,)).*?(?=\))/g)
      : q.match(/(.*\$__timeGroup\(([\w_.]+,)).*?(?=\))/g);
    if (res) {
      res = res[0].substr(1 + res[0].lastIndexOf(",")).trim();
    }
    return res;
  }
  public static getUnixSecondsFromString(str) {
    const res = BigQueryDatasource._getShiftPeriod(str);
    const groupPeriod = res[0];
    const groupVal = res[1];
    switch (groupPeriod) {
      case "s":
        return 1 * groupVal;
      case "m":
        return 60 * groupVal;
      case "h":
        return 3600 * groupVal;
      case "d":
        return groupVal * 86400;
      case "w":
        return 604800 * groupVal;
      case "M":
        return 2629743 * groupVal;
      case "y":
        return 31536000 * groupVal;
    }
    return "0";
  }

  public static getTimeShift(q) {
    let res: string;
    res = q.match(/(.*\$__timeShifting\().*?(?=\))/g);
    if (res) {
      res = res[0].substr(1 + res[0].lastIndexOf("("));
    }
    return res;
  }
  public static replaceTimeShift(q) {
    return q.replace(/(\$__timeShifting\().*?(?=\))./g, "");
  }
  public target: any;
  public templateSrv: any;
  public scopedVars: any;
  public isWindow: boolean;
  public groupBy: string;
  public tmpValue: string;

  /** @ngInject */
  constructor(target, templateSrv?, scopedVars?) {
    this.target = target;
    this.templateSrv = templateSrv;
    this.scopedVars = scopedVars;
    this.isWindow = false;
    this.groupBy = "";
    this.tmpValue = "";

    target.format = target.format || "time_series";
    target.timeColumn = target.timeColumn || "-- time --";
    target.timeColumnType = target.timeColumnType || "TIMESTAMP";
    target.metricColumn = target.metricColumn || "none";
    target.group = target.group || [];
    target.where = target.where || [
      { type: "macro", name: "$__timeFilter", params: [] }
    ];
    target.select = target.select || [
      [{ type: "column", params: ["-- value --"] }]
    ];
    // handle pre query gui panels gracefully
    if (!("rawQuery" in this.target)) {
      target.rawQuery = "rawSql" in target;
    }

    // give interpolateQueryStr access to this
    this.interpolateQueryStr = this.interpolateQueryStr.bind(this);
  }
  public getIntervalStr(interval: string) {
    const res = BigQueryDatasource._getShiftPeriod(interval);
    const groupPeriod = res[0];
    let IntervalStr =
      "TIMESTAMP_SECONDS(DIV(UNIX_SECONDS(" + this._dateToTimestamp() + "), ";
    const unixSeconds = BigQueryQuery.getUnixSecondsFromString(interval);
    if (groupPeriod === "M") {
      IntervalStr =
        "TIMESTAMP(" +
        "  (" +
        'PARSE_DATE( "%Y-%m-%d",CONCAT( CAST((EXTRACT(YEAR FROM ' +
        BigQueryQuery.quoteFiledName(this.target.timeColumn) +
        ")) AS STRING),'-',CAST((EXTRACT(MONTH FROM " +
        BigQueryQuery.quoteFiledName(this.target.timeColumn) +
        ")) AS STRING)," +
        "'-','01'" +
        ")" +
        ")" +
        ")" +
        ")";
    } else {
      IntervalStr += unixSeconds + ") * " + unixSeconds + ")";
    }
    return IntervalStr;
  }


  public hasTimeGroup() {
    return _.find(this.target.group, (g: any) => g.type === "time");
  }

  public hasMetricColumn() {
    return this.target.metricColumn !== "none";
  }

  public interpolateQueryStr(value, variable, defaultFormatFn) {
    // if no multi or include all do not regexEscape
    if (!variable.multi && !variable.includeAll) {
      return BigQueryQuery.escapeLiteral(value);
    }

    if (typeof value === "string") {
      return BigQueryQuery.quoteLiteral(value);
    }

    const escapedValues = _.map(value, BigQueryQuery.quoteLiteral);
    return escapedValues.join(",");
  }

  public render(interpolate?) {
    const target = this.target;
    // new query with no table set yet
    if (!this.target.rawQuery && !("table" in this.target)) {
      return "";
    }
    if (!target.rawQuery) {
      target.rawSql = this.buildQuery();
    }
    if (interpolate) {
      return this.templateSrv.replace(
        target.rawSql,
        this.scopedVars,
        this.interpolateQueryStr
      );
    } else {
      return target.rawSql;
    }
  }

  public _buildTimeColumntimeGroup(alias, timeGroup) {
    let args;
    let macro = "$__timeGroup";

    args = !(timeGroup.params.length > 1 && timeGroup.params[1] !== "none")
      ? timeGroup.params[0]
      : timeGroup.params.join(",");
    if (alias) {
      macro += "Alias";
    }
    return macro + "(" + this.target.timeColumn + "," + args + ")";
  }

  public buildTimeColumn(alias = true) {
    const timeGroup = this.hasTimeGroup();
    let query;
    if (timeGroup) {
      query = this._buildTimeColumntimeGroup(alias, timeGroup);
    } else {
      query = BigQueryQuery.quoteFiledName(this.target.timeColumn);
      if (alias) {
        query += " AS time";
      }
    }
    return query;
  }

  public buildMetricColumn() {
    if (this.hasMetricColumn()) {
      return (
        "CAST (" +
        BigQueryQuery.quoteFiledName(this.target.metricColumn) +
        "AS String ) AS metric"
      );
    }

    return "";
  }

  public buildValueColumns() {
    let query = "";
    for (const column of this.target.select) {
      query += ",\n  " + this.buildValueColumn(column);
    }

    return query;
  }

  public _buildAggregate(aggregate, query) {
    if (aggregate) {
      const func = aggregate.params[0];
      switch (aggregate.type) {
        case "aggregate":
          query =
            func === "first" || func === "last"
              ? func + "(" + query + "," + this.target.timeColumn + ")"
              : func + "(" + query + ")";
          break;
        case "percentile":
          query =
            func +
            "(" +
            aggregate.params[1] +
            ") WITHIN GROUP (ORDER BY " +
            query +
            ")";
          break;
      }
    }
    return query;
  }

  public buildValueColumn(column) {
    const columnName = _.find(column, (g: any) => g.type === "column");
    let query = BigQueryQuery.quoteFiledName(columnName.params[0]);
    const aggregate = _.find(
      column,
      (g: any) => g.type === "aggregate" || g.type === "percentile"
    );
    const windows = _.find(
      column,
      (g: any) => g.type === "window" || g.type === "moving_window"
    );
    const timeshift = _.find(
      column,
      (g: any) => g.type === "timeshift"
    );
    query = this._buildAggregate(aggregate, query);
    if (windows) {
      this.isWindow = true;
      const overParts = [];
      const partBy = "PARTITION BY " + this.target.timeColumn;
      if (this.hasMetricColumn()) {
        overParts.push(partBy + " " + this.target.metricColumn);
      }
      overParts.push(partBy);
      overParts.push("ORDER BY " + this.buildTimeColumn(false));
      const over = overParts.join(" ");
      let curr: string;
      let prev: string;
      const tmpval = query;
      switch (windows.type) {
        case "window":
          switch (windows.params[0]) {
            case "delta":
              curr = query;
              prev = "lag(" + curr + ") OVER (" + over + ")";
              query = curr + " - " + prev;
              break;
            case "increase":
              curr = query;
              prev = "lag(" + curr + ") OVER (" + over + ")";
              query =
                "(CASE WHEN " +
                curr +
                " >= " +
                prev +
                " THEN " +
                curr +
                " - " +
                prev;
              query +=
                " WHEN " + prev + " IS NULL THEN NULL ELSE " + curr + " END)";
              break;
            case "rate":
              let timeColumn = this.target.timeColumn;
              if (aggregate) {
                timeColumn = "min(" + timeColumn + ")";
              }

              curr = query;
              prev = "lag(" + curr + ") OVER (" + over + ")";
              query =
                "(CASE WHEN " +
                curr +
                " >= " +
                prev +
                " THEN " +
                curr +
                " - " +
                prev;
              query +=
                " WHEN " + prev + " IS NULL THEN NULL ELSE " + curr + " END)";
              query +=
                "/(UNIX_SECONDS(" +
                this._dateToTimestamp() +
                ") -UNIX_SECONDS(  lag(" +
                this._dateToTimestamp() +
                ") OVER (" +
                over +
                ")))";
              break;
            default:
              query = windows.params[0] + "(" + query + ") OVER (" + over + ")";
              break;
          }
          break;
        case "moving_window":
          query =
            windows.params[0] +
            "(" +
            query +
            ") OVER (" +
            over +
            " ROWS " +
            windows.params[1] +
            " PRECEDING)";
          query = tmpval + " as tmp" + tmpval + ", " + query;
          break;
      }
      this.tmpValue = "tmp" + columnName.params[0];
      query = tmpval + " as " + this.tmpValue + ", " + query;
    }

    const alias = _.find(column, (g: any) => g.type === "alias");
    if (alias) {
      query += " AS " + alias.params[0];
    }
    if (timeshift) {
      query += " $__timeShifting(" + timeshift.params[0] + ")";
    }
    return query;
  }
  public buildWhereClause() {
    let query = "";
    const conditions = _.map(this.target.where, (tag, index) => {
      switch (tag.type) {
        case "macro":
          return tag.name + "(" + this.target.timeColumn + ")";
        case "expression":
          return tag.params.join(" ");
      }
    });
    if (conditions.length > 0) {
      query = "\nWHERE\n  " + conditions.join(" AND\n  ");
    }
    if (this.target.sharded) {
      const from = BigQueryQuery.formatDateToString(
        this.templateSrv.timeRange.from._d
      );
      const to = BigQueryQuery.formatDateToString(
        this.templateSrv.timeRange.to._d
      );
      query += " AND  _TABLE_SUFFIX BETWEEN '" + from + "' AND '" + to + "' ";
    }
    if (this.target.partitioned && this.target.partitionedField === "") {
      query +=
        " AND _PARTITIONTIME >= '" +
        BigQueryQuery.formatDateToString(
          this.templateSrv.timeRange.from._d,
          "-",
          true
        ) +
        "' AND _PARTITIONTIME < '" +
        BigQueryQuery.formatDateToString(
          this.templateSrv.timeRange.to._d,
          "-",
          true
        ) +
        "'";
    }
    return query;
  }

  public buildGroupClause() {
    let query = "";
    let groupSection = "";
    for (let i = 0; i < this.target.group.length; i++) {
      const part = this.target.group[i];
      if (i > 0) {
        groupSection += ", ";
      }
      if (part.type === "time") {
        groupSection += "1";
      } else {
        groupSection += part.params[0];
      }
    }
    if (groupSection.length) {
      query = "\nGROUP BY " + groupSection;
      this.groupBy = query;
      if (this.isWindow) {
        query += "," + this.target.timeColumn + "," + this.tmpValue;
        this.groupBy += ",2";
      }
      if (this.hasMetricColumn()) {
        query += ",2";
        if (this.isWindow) {
          this.groupBy += ",3";
        }
      }
    }
    return query;
  }

  public buildQuery() {
    let query = "";
    query += "\n" + "SELECT";
    query += "\n " + this.buildTimeColumn();
    if (this.hasMetricColumn()) {
      query += ",\n  " + this.buildMetricColumn();
    }
    query += this.buildValueColumns();

    query +=
      "\nFROM " +
      "`" +
      this.target.project +
      "." +
      this.target.dataset +
      "." +
      this.target.table +
      "`";

    query += this.buildWhereClause();
    query += this.buildGroupClause();
    if (!this.isWindow) {
      query += "\nORDER BY 1";
      if (this.hasMetricColumn()) {
        query += ",2";
      }
    }
    // query += '\nLIMIT 2';
    if (this.isWindow) {
      query = "\nSELECT *  EXCEPT (" + this.tmpValue + ") From \n (" + query;
      query = query + ")" + this.groupBy;
    }
    query = "#standardSQL" + query;
    return query;
  }

  public expend_macros(options) {
    if (this.target.rawSql) {
      let q = this.target.rawSql;
      q = BigQueryQuery.replaceTimeShift(q);
      q = this.replaceTimeFilters(q, options);
      q = this.replacetimeGroupAlias(q, true);
      q = this.replacetimeGroupAlias(q, false);
      return q;
    }
  }

  public replaceTimeFilters(q, options) {
    let to = "";
    let from = "";
    if (this.target.timeColumnType === "DATE") {
      from =
        "'" +
        BigQueryQuery.formatDateToString(
          this.templateSrv.timeRange.from._d,
          "-"
        ) +
        "'";
      to =
        "'" +
        BigQueryQuery.formatDateToString(
          this.templateSrv.timeRange.to._d,
          "-"
        ) +
        "'";
    } else if (this.target.timeColumnType === "DATETIME") {
      from =
        "'" +
        BigQueryQuery.formatDateToString(
          this.templateSrv.timeRange.from._d,
          "-",
          true
        ) +
        "'";
      to =
        "'" +
        BigQueryQuery.formatDateToString(
          this.templateSrv.timeRange.to._d,
          "-",
          true
        ) +
        "'";
    } else {
      from =
        "TIMESTAMP_MILLIS (" + options.range.from.valueOf().toString() + ")";
      to = "TIMESTAMP_MILLIS (" + options.range.to.valueOf().toString() + ")";
    }
    if (this.target.timeColumn === "-- time --") {
      const myRegexp = /\$__timeFilter\(([\w_.]+)\)/g;
      this.target.timeColumn = myRegexp.exec(q)[1];
    }
    const range = BigQueryQuery.quoteFiledName(this.target.timeColumn) + " BETWEEN " + from + " AND " + to;
    return q.replace(/\$__timeFilter\(([\w_.]+)\)/g, range);
  }

  public replacetimeGroupAlias(q, alias: boolean) {
    const interval = BigQueryQuery._getInterval(q, alias);
    if (!interval) {
      return q;
    }

    const intervalStr = this.getIntervalStr(
      interval,
    );
    if (alias) {
      return q.replace(
        /\$__timeGroupAlias\(([\w_.]+,+[a-zA-Z0-9_ ]+\))/g,
        intervalStr
      );
    } else {
      return q.replace(
        /\$__timeGroup\(([\w_.]+,+[a-zA-Z0-9_ ]+\))/g,
        intervalStr
      );
    }
  }

  private _dateToTimestamp()
   {
    if (this.target.timeColumnType === "DATE"){
      return (
        "Timestamp(" +
        BigQueryQuery.quoteFiledName(this.target.timeColumn) +
        ")"
      );
    }
    return BigQueryQuery.quoteFiledName(this.target.timeColumn);
  }
}
