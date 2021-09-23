import { ArrayVector, DataFrame, Field, FieldType, MetricFindValue } from '@grafana/data';
import BQTypes from '@google-cloud/bigquery/build/src/types';
import _ from 'lodash';
import { FetchResponse } from '@grafana/runtime';
import { BigQueryQueryNG } from 'bigquery_query';
import { QueryFormat } from 'types';

// API interfaces
export interface ResultFormat {
  text: string;
  value: string;
}

const TIME_FIELD_SCHEMA_TYPES = ['DATE', 'TIMESTAMP', 'DATETIME'];
const VALUE_FIELD_SCHEMA_TYPES = ['INT64', 'NUMERIC', 'FLOAT64', 'FLOAT', 'INT', 'INTEGER', 'BOOL', 'BOOLEAN'];

export default class ResponseParser {
  static parseProjects(results: BQTypes.IProjectList['projects']): ResultFormat[] {
    return ResponseParser.parseData(results, 'id', 'id');
  }

  static parseDatasets(results: BQTypes.IDatasetList['datasets']): ResultFormat[] {
    return ResponseParser.parseData(results, 'datasetReference.datasetId', 'datasetReference.datasetId');
  }

  static parseTableFields(results: BQTypes.ITableFieldSchema[], filter: string[]): ResultFormat[] {
    const fields: ResultFormat[] = [];
    if (!results || results.length === 0) {
      return fields;
    }
    const res: ResultFormat[] = [];

    results = ResponseParser._handleRecordFields(results, res);

    for (const fl of results) {
      if (filter.length > 0) {
        for (const flt of filter) {
          if (flt === fl.type) {
            fields.push({
              text: fl.name!,
              value: fl.type!,
            });
          }
        }
      } else {
        fields.push({
          text: fl.name!,
          value: fl.type!,
        });
      }
    }
    return fields;
  }

  static parseQueryResults(results: BQTypes.IQueryResponse, query: BigQueryQueryNG): DataFrame {
    if (query.format === QueryFormat.Timeseries) {
      return ResponseParser._toTimeSeries(results, query);
    }
    if (query.format === QueryFormat.Table) {
      return ResponseParser._toTable(results, query);
    }

    throw new Error('Unsupported query format');
  }

  static _convertValues(value: any, type: string) {
    if (['INT64', 'NUMERIC', 'FLOAT64', 'FLOAT', 'INT', 'INTEGER'].includes(type)) {
      return Number(value);
    }

    if (['TIMESTAMP'].includes(type)) {
      return Number(value) * 1000;
    }
    //  No casting is required for types: DATE, DATETIME, TIME
    return value;
  }

  private static parseData(results: any[] | undefined, text: string, value: string): ResultFormat[] {
    const data: ResultFormat[] = [];

    if (!results || results.length === 0) {
      return data;
    }

    const objectTextList = text.split('.');
    const objectValueList = value.split('.');
    let itemValue;
    let itemText;
    for (let item of results) {
      item = ResponseParser.manipulateItem(item);
      itemText = item[objectTextList[0]];
      itemValue = item[objectValueList[0]];
      for (let i = 1; i < objectTextList.length; i++) {
        itemText = itemText[objectTextList[i]];
      }
      for (let i = 1; i < objectValueList.length; i++) {
        itemValue = itemValue[objectValueList[i]];
      }

      data.push({ text: itemText, value: itemValue });
    }
    return data;
  }

  private static manipulateItem(item: any) {
    if (item.kind === 'bigquery#table' && item.timePartitioning) {
      item.tableReference.tableId = item.tableReference.tableId + '__partitioned';
      if (item.timePartitioning.field) {
        item.tableReference.tableId += '__' + item.timePartitioning.field;
      }
    }
    return item;
  }

  private static _handleRecordFields(results: BQTypes.ITableFieldSchema[], res: any[]) {
    for (const fl of results) {
      if (fl.type === 'RECORD' && fl.fields) {
        for (const f of fl.fields) {
          if (f.type !== 'RECORD') {
            res.push({ name: fl.name + '.' + f.name, type: f.type });
          } else {
            if (f.fields) {
              for (const ff of f.fields) {
                ff.name = fl.name + '.' + f.name + '.' + ff.name;
              }
              res = ResponseParser._handleRecordFields(f.fields, res);
            }
          }
        }
      } else {
        res.push({ name: fl.name, type: fl.type });
      }
    }
    return res;
  }

  static mapSchemaTypeToFieldType(type: string): FieldType {
    // TIMESTAMP, DATE, TIME, DATETIME, RECORD (where RECORD indicates that the field contains a nested schema) or STRUCT (same as RECORD).
    switch (type) {
      case 'STRING':
      case 'BYTES':
        return FieldType.string;
      case 'INTEGER':
      case 'INT64':
      case 'FLOAT':
      case 'FLOAT64':
        return FieldType.number;
      case 'BOOLEAN':
      case 'BOOL':
        return FieldType.boolean;
      case 'TIMESTAMP':
        return FieldType.time;
      default:
        return FieldType.other;
    }
  }

  private static _toTimeSeries(results: BQTypes.IQueryResponse, query: BigQueryQueryNG): DataFrame {
    let timeIndex;
    const valueIndexes = [];
    const valueFields = new Map<number, Field>();
    const metricIndexes = [];
    const metricFields = new Map<number, Field>();

    const fields: Field[] = [];

    const frame: DataFrame = {
      refId: query.refId,
      length: Number(results.totalRows) ?? 0,
      fields,
    };

    if (!results.schema || !results.schema.fields) {
      return frame;
    }

    // Prepare fields
    for (let i = 0; i < results.schema.fields.length; i++) {
      if (timeIndex === undefined && TIME_FIELD_SCHEMA_TYPES.includes(results.schema!.fields![i].type!)) {
        timeIndex = i;
      }

      if (VALUE_FIELD_SCHEMA_TYPES.includes(results.schema!.fields![i].type!)) {
        const fieldName = results.schema!.fields![i].name!;
        valueIndexes.push(i);
        valueFields.set(i, {
          name: query.timeShift ? `${fieldName}_${query.timeShift}` : fieldName,
          type: ResponseParser.mapSchemaTypeToFieldType(results.schema!.fields![i].type!),
          config: {},
          values: new ArrayVector(),
        });
      }

      if (results.schema!.fields![i].type! === 'STRING') {
        metricIndexes.push(i);
        metricFields.set(i, {
          name: results.schema!.fields![i].name!,
          type: FieldType.string,
          config: {},
          values: new ArrayVector(),
        });
      }
    }

    if (timeIndex === undefined) {
      throw new Error('No DATETIME column found in the result. The time series format requires a time column.');
    }

    const timeField = {
      name: 'time',
      type: FieldType.time,
      config: {},
      values: new ArrayVector(),
    };

    if (results.rows) {
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows[i];
        if (row.f) {
          timeField.values.add(Number(row.f[timeIndex].v) * 1000);

          for (let j = 0; j < valueIndexes.length; j++) {
            const rawValue = row.f[valueIndexes[j]].v;
            (valueFields.get(valueIndexes[j])!.values as ArrayVector).add(rawValue === null ? null : Number(rawValue));
          }

          for (let j = 0; j < metricIndexes.length; j++) {
            (metricFields.get(metricIndexes[j])!.values as ArrayVector).add(row.f[metricIndexes[j]].v);
          }
        }
      }
    }

    return { ...frame, fields: [timeField, ...Array.from(valueFields.values()), ...Array.from(metricFields.values())] };
  }

  private static _toTable(results: BQTypes.IQueryResponse, query: BigQueryQueryNG): DataFrame {
    const fields: Field[] = [];
    const frame: DataFrame = {
      refId: query.refId,
      length: Number(results.totalRows) ?? 0,
      fields,
    };

    if (!results.schema || !results.schema.fields) {
      return frame;
    }

    if (results.schema && results.schema.fields) {
      for (let i = 0; i < results.schema.fields.length; i++) {
        const fieldName = results.schema!.fields![i].name!;
        const fieldType = ResponseParser.mapSchemaTypeToFieldType(results.schema.fields[i].type!);
        fields.push({
          name: query.timeShift && fieldType !== FieldType.time ? `${fieldName}_${query.timeShift}` : fieldName,
          type: fieldType,
          config: {},
          values: new ArrayVector(),
        });
      }
    }

    if (results.rows) {
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows[i];
        if (row.f) {
          for (let j = 0; j < row.f.length; j++) {
            const rawVal = row.f[j].v;
            if (row.f[j].v !== null) {
              (fields[j].values as ArrayVector).add(
                ResponseParser._convertValues(rawVal, results.schema.fields[j].type!)
              );
            } else {
              (fields[j].values as ArrayVector).add(rawVal);
            }
          }
        }
      }
    }

    return { ...frame, fields };
  }

  static toVar(results: any): MetricFindValue[] {
    const res = [];
    for (const row of results.rows) {
      res.push(row.f[0].v);
    }

    return _.map(res, (value) => {
      return { text: value };
    });
  }

  parseTabels(results: BQTypes.ITableList['tables']): ResultFormat[] {
    return this._handelWildCardTables(
      ResponseParser.parseData(results, 'tableReference.tableId', 'tableReference.tableId')
    );
  }

  transformAnnotationResponse(options: any, data: FetchResponse) {
    const table = data.data;
    let timeColumnIndex = -1;
    let textColumnIndex = -1;
    let tagsColumnIndex = -1;

    for (let i = 0; i < data.data.schema.fields.length; i++) {
      if (data.data.schema.fields[i].name === 'time') {
        timeColumnIndex = i;
      } else if (data.data.schema.fields[i].name === 'text') {
        textColumnIndex = i;
      } else if (data.data.schema.fields[i].name === 'tags') {
        tagsColumnIndex = i;
      }
    }

    if (timeColumnIndex === -1) {
      return Promise.reject({
        message: 'Missing mandatory time column in annotation query.',
      });
    }

    const list = [];
    if (table.rows && table.rows.length) {
      for (const row of table.rows) {
        list.push({
          annotation: options.annotation,
          tags: row.f[tagsColumnIndex].v ? row.f[tagsColumnIndex].v.trim().split(/\s*,\s*/) : [],
          text: row.f[textColumnIndex].v ? row.f[textColumnIndex].v.toString() : '',
          time: Number(Math.floor(Number(row.f[timeColumnIndex].v))) * 1000,
        });
      }
    }

    return Promise.resolve(list);
  }

  private _handelWildCardTables(tables: ResultFormat[]) {
    let sorted = new Map();
    let newTables: ResultFormat[] = [];
    for (const t of tables) {
      const partitioned = t.text.indexOf('__partitioned');
      if (partitioned > -1) {
        t.text = t.text.substring(0, partitioned);
      }
      if (
        !t.value.match(
          /_(?:(?:20\d{2})(?:(?:(?:0[13578]|1[02])31)|(?:(?:0[1,3-9]|1[0-2])(?:29|30)))|(?:(?:20(?:0[48]|[2468][048]|[13579][26]))0229)|(?:20\d{2})(?:(?:0?[1-9])|(?:1[0-2]))(?:0?[1-9]|1\d|2[0-8]))(?!\d)$/g
        )
      ) {
        sorted = sorted.set(t.value, t.text);
      } else {
        sorted.set(
          t.text.substring(0, t.text.length - 8) + 'YYYYMMDD',
          t.text.substring(0, t.text.length - 8) + 'YYYYMMDD'
        );
      }
    }
    sorted.forEach((text, value) => {
      newTables = newTables.concat({ text, value });
    });
    return newTables;
  }
}
