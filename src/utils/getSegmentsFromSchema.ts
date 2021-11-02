import { TableFieldSchema } from '../api';

const TIME_COLUMN_TYPES = ['DATE', 'TIMESTAMP', 'DATETIME'];
const METRIC_COLUMN_TYPES = ['STRING', 'BYTES'];
const VALUE_COLUMN_TYPES = ['INT64', 'NUMERIC', 'FLOAT64', 'FLOAT', 'INT', 'INTEGER'];

interface SegmentDefinition {
  text: string;
  fieldSchema: TableFieldSchema;
}

enum SegmentType {
  Time = 'time',
  Metric = 'metric',
  Value = 'value',
}

export type SegmentDefinitions = Record<SegmentType, SegmentDefinition[]>;

export function getSegmentsFromSchema(schema: TableFieldSchema[]): SegmentDefinitions {
  let result: SegmentDefinitions = {
    [SegmentType.Time]: [],
    [SegmentType.Metric]: [],
    [SegmentType.Value]: [],
  };

  for (let i = 0; i < schema.length; i++) {
    const field = schema[i];

    if (field.type === 'RECORD') {
      const subResult = getSegmentsFromSchema(field.schema);

      result[SegmentType.Time] = result[SegmentType.Time].concat(
        subResult.time.map((r) => ({
          text: `${field.name}.${r.text}`,
          fieldSchema: r.fieldSchema,
        }))
      );
      result[SegmentType.Metric] = result[SegmentType.Metric].concat(
        subResult.metric.map((r) => ({
          text: `${field.name}.${r.text}`,
          fieldSchema: r.fieldSchema,
        }))
      );
      result[SegmentType.Value] = result[SegmentType.Value].concat(
        subResult.value.map((r) => ({
          text: `${field.name}.${r.text}`,
          fieldSchema: r.fieldSchema,
        }))
      );
      continue;
    }

    if (TIME_COLUMN_TYPES.includes(field.type)) {
      result[SegmentType.Time].push({ text: field.name, fieldSchema: field });
    }
    if (METRIC_COLUMN_TYPES.includes(field.type)) {
      result[SegmentType.Metric].push({ text: field.name, fieldSchema: field });
    }
    if (VALUE_COLUMN_TYPES.includes(field.type)) {
      result[SegmentType.Value].push({ text: field.name, fieldSchema: field });
    }
  }

  return result;
}
