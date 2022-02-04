// # MIT License

// ## Copyright (c) 2019 DoiT International

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { DataQueryRequest, dateTime, DurationUnit } from '@grafana/data';
import { EditorMode } from '@grafana/experimental';
import { BigQueryDatasource } from 'datasource';
import SqlParser from 'sql_parser';
import { BigQueryQueryNG, QueryFormat } from 'types';
import { createFunctionField, setGroupByField } from 'utils/sql.utils';
import { DEFAULT_REGION } from './constants';

export const SHIFTED = '_shifted';

export function formatBigqueryError(error: any) {
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

export function getShiftPeriod(strInterval: string): [DurationUnit, string] {
  const shift = strInterval.match(/\d+/)![0];
  strInterval = strInterval.substr(shift.length, strInterval.length);

  if (strInterval.trim() === 'min') {
    strInterval = 'm';
  }
  return [strInterval as DurationUnit, shift];
}

export function extractFromClause(sql: string) {
  return SqlParser.getProjectDatasetTableFromSql(sql);
}

// TODO: fix any annotation
export function findTimeField(sql: string, timeFields: any[]) {
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
export function handleError(error: any) {
  if (error.cancelled === true) {
    return [];
  }
  let msg = error;
  if (error.data !== undefined) {
    msg = error.data.error;
  }
  throw formatBigqueryError(msg);
}

export function createTimeShiftQuery(query: BigQueryQueryNG) {
  const res = getTimeShift(query.rawSql);

  if (!res) {
    return null;
  }

  const copy = { ...query };

  console.log('createTimeShiftQuery', query);
  copy.rawSql = replaceTimeShift(copy.rawSql);
  copy.timeShift = res;
  copy.refId += SHIFTED + '_' + res;
  return copy;
}

export function setupTimeShiftQuery(query: BigQueryQueryNG, options: DataQueryRequest<BigQueryQueryNG>) {
  if (!query.timeShift) {
    return { ...options };
  }

  const copy = { ...options };

  let strInterval = query.timeShift;
  const res = getShiftPeriod(strInterval);
  strInterval = res[0];

  if (!['s', 'min', 'h', 'd', 'w', 'm', 'w', 'y', 'M'].includes(strInterval)) {
    return copy;
  }

  strInterval = res[0];

  const shift = res[1];

  if (strInterval === 'min') {
    strInterval = 'm';
  }

  copy.range = {
    from: dateTime(options.range.from).subtract(shift, strInterval as DurationUnit),
    to: dateTime(options.range.to).subtract(shift, strInterval as DurationUnit),
    raw: { ...options.range.raw }, // huh, not relevant really
  };

  return copy;
}

export function updatePartition(q: string, options: DataQueryRequest<BigQueryQueryNG>) {
  if (q.indexOf('AND _PARTITIONTIME >= ') < 1) {
    return q;
  }
  if (q.indexOf('AND _PARTITIONTIME <') < 1) {
    return q;
  }
  const from = q.substr(q.indexOf('AND _PARTITIONTIME >= ') + 22, 21);

  const newFrom = "'" + formatDateToString(options.range.from.toDate(), '-', true) + "'";
  q = q.replace(from, newFrom);
  const to = q.substr(q.indexOf('AND _PARTITIONTIME < ') + 21, 21);
  const newTo = "'" + formatDateToString(options.range.to.toDate(), '-', true) + "'";

  q = q.replace(to, newTo) + '\n ';
  return q;
}

export function updateTableSuffix(q: string, options: DataQueryRequest<BigQueryQueryNG>) {
  const ind = q.indexOf('AND  _TABLE_SUFFIX BETWEEN ');
  if (ind < 1) {
    return q;
  }
  const from = q.substr(ind + 28, 8);

  const newFrom = formatDateToString(options.range.from.toDate());
  q = q.replace(from, newFrom);
  const to = q.substr(ind + 43, 8);
  const newTo = formatDateToString(options.range.to.toDate());
  q = q.replace(to, newTo) + '\n ';
  return q;
}

// query utils
export function quoteLiteral(value: any) {
  return "'" + String(value).replace(/'/g, "''") + "'";
}

export function escapeLiteral(value: any) {
  return String(value).replace(/'/g, "''");
}

export function quoteFiledName(value: string) {
  const vals = value.split('.');
  let res = '';
  for (let i = 0; i < vals.length; i++) {
    res = res + '`' + String(vals[i]) + '`';
    if (vals.length > 1 && i + 1 < vals.length) {
      res = res + '.';
    }
  }
  return res;
}

export function formatDateToString(inputDate: Date, separator = '', addtime = false) {
  const date = new Date(inputDate);
  // 01, 02, 03, ... 29, 30, 31
  const DD = (date.getDate() < 10 ? '0' : '') + date.getDate();
  // 01, 02, 03, ... 10, 11, 12
  const MM = (date.getMonth() + 1 < 10 ? '0' : '') + (date.getMonth() + 1);
  // 1970, 1971, ... 2015, 2016, ...
  const YYYY = date.getFullYear();

  // create the format you want
  let dateStr = YYYY + separator + MM + separator + DD;
  if (addtime === true) {
    dateStr += ' ' + date.toTimeString().substr(0, 8);
  }
  return dateStr;
}

export function getInterval(q: string, alias: boolean) {
  const interval: string[] = [];
  const res = alias
    ? q.match(/(\$__timeGroupAlias\(([\w._]+,)).*?(?=\))/g)
    : q.match(/(\$__timeGroup\(([\w_.]+,)).*?(?=\))/g);
  if (res) {
    interval[0] = res[0].split(',')[1] ? res[0].split(',')[1].trim() : res[0].split(',')[1];
    interval[1] = res[0].split(',')[2] ? res[0].split(',')[2].trim() : res[0].split(',')[2];
  }
  return interval;
}

export function getUnixSecondsFromString(str?: string) {
  if (str === undefined) {
    return 0;
  }
  const res = getShiftPeriod(str);
  const groupPeriod = res[0];
  const groupVal = parseInt(res[1], 10);

  switch (groupPeriod) {
    case 's':
      return 1 * groupVal;
    case 'm':
      return 60 * groupVal;
    case 'h':
      return 3600 * groupVal;
    case 'd':
      return groupVal * 86400;
    case 'w':
      return 604800 * groupVal;
    case 'M':
      return 2629743 * groupVal;
    case 'y':
      return 31536000 * groupVal;
  }
  return 0;
}

export function getTimeShift(q: string) {
  let res = q.match(/(.*\$__timeShifting\().*?(?=\))/g);
  let result = null;

  if (res) {
    result = res[0].substr(1 + res[0].lastIndexOf('('));
  }
  return result;
}

export function replaceTimeShift(q: string) {
  return q.replace(/(\$__timeShifting\().*?(?=\))./g, '');
}

export function convertToUtc(d: Date) {
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
}

export function applyQueryDefaults(q: BigQueryQueryNG, ds: BigQueryDatasource) {
  const result = {
    ...q,
    dataset: q.dataset || '',
    location: q.location || ds.jsonData.defaultRegion || DEFAULT_REGION,
    format: q.format !== undefined ? q.format : QueryFormat.Table,
    rawSql: q.rawSql || '',
    editorMode: q.editorMode || EditorMode.Builder,
    sql: q.sql || {
      columns: [createFunctionField()],
      groupBy: [setGroupByField()],
    },
  };

  return result;
}

export const isQueryValid = (q: BigQueryQueryNG) => {
  return Boolean(q.location && q.rawSql);
};

let datasourceId: number;

export function setDatasourceId(instance: number) {
  datasourceId = instance;
}

export function getDatasourceId(): number {
  return datasourceId;
}
