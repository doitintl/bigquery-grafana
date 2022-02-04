import { QueryEditorExpressionType, QueryEditorPropertyType } from 'expressions';
import { SQLExpression } from 'types';
import { applyQueryDefaults } from '../utils';
import { haveColumns, toRawSql } from './sql.utils';

const queryWithDefaults = applyQueryDefaults({ dataset: 'test', table: 't' } as any, { jsonData: {} } as any);
const from = 'FROM projectId.test.t';

const columns: SQLExpression['columns'] = [
  {
    type: QueryEditorExpressionType.Function,
    parameters: [{ name: 'id', type: QueryEditorExpressionType.FunctionParameter }],
  },
  {
    type: QueryEditorExpressionType.Function,
    parameters: [{ name: 'name', type: QueryEditorExpressionType.FunctionParameter }],
  },
  {
    type: QueryEditorExpressionType.Function,
    parameters: [{ name: 'value', type: QueryEditorExpressionType.FunctionParameter }],
  },
];

describe('toRawSql function', () => {
  it('should return empty string if there are no values in the sql object', () => {
    const result = toRawSql(queryWithDefaults, 'projectId');
    expect(result).toEqual('');
  });

  it(`should return SELECT id ${from} when columns has function parameter with name id`, () => {
    const sql: SQLExpression = {
      columns: [columns[0]],
    };
    const result = toRawSql({ ...queryWithDefaults, sql }, 'projectId');
    expect(result).toEqual(`SELECT id ${from} `);
  });

  it(`should return SELECT id, name, value ${from} when columns has multiple function parameters`, () => {
    const sql: SQLExpression = {
      columns,
    };
    const result = toRawSql({ ...queryWithDefaults, sql }, 'projectId');
    expect(result).toEqual(`SELECT id, name, value ${from} `);
  });

  it(`should return SELECT AVG(value) ${from} when column has function and function parameter as well`, () => {
    const sql: SQLExpression = {
      columns: [{ ...columns[2], name: 'AVG' }],
    };
    const result = toRawSql({ ...queryWithDefaults, sql }, 'projectId');
    expect(result).toEqual(`SELECT AVG(value) ${from} `);
  });

  it(`should return SELECT id ${from} WHERE id = 1 when whereString is id = 1`, () => {
    const sql: SQLExpression = {
      columns: [columns[0]],
      whereString: 'id = 1',
    };
    const result = toRawSql({ ...queryWithDefaults, sql }, 'projectId');
    expect(result).toEqual(`SELECT id ${from} WHERE id = 1 `);
  });

  it(`should return SELECT name ${from} GROUP BY name when groupBy is set to name`, () => {
    const sql: SQLExpression = {
      columns: [columns[1]],
      groupBy: [
        { type: QueryEditorExpressionType.GroupBy, property: { name: 'name', type: QueryEditorPropertyType.String } },
      ],
    };
    const result = toRawSql({ ...queryWithDefaults, sql }, 'projectId');
    expect(result).toEqual(`SELECT name ${from} GROUP BY name `);
  });

  it(`should return SELECT name, value ${from} GROUP BY name, value when groupBy is set to multiple values`, () => {
    const sql: SQLExpression = {
      columns: [columns[1], columns[2]],
      groupBy: [
        { type: QueryEditorExpressionType.GroupBy, property: { name: 'name', type: QueryEditorPropertyType.String } },
        { type: QueryEditorExpressionType.GroupBy, property: { name: 'value', type: QueryEditorPropertyType.String } },
      ],
    };
    const result = toRawSql({ ...queryWithDefaults, sql }, 'projectId');
    expect(result).toEqual(`SELECT name, value ${from} GROUP BY name, value `);
  });

  it(`should return SELECT name ${from} ORDER BY name when orderBy is set to name`, () => {
    const sql: SQLExpression = {
      columns: [columns[1]],
      orderBy: {
        type: QueryEditorExpressionType.Property,
        property: { name: 'name', type: QueryEditorPropertyType.String },
      },
    };
    const result = toRawSql({ ...queryWithDefaults, sql }, 'projectId');
    expect(result).toEqual(`SELECT name ${from} ORDER BY name `);
  });

  it(`should return SELECT name ${from} ORDER BY name DESC when orderBy is set to name and orderByDirection is set to DESC`, () => {
    const sql: SQLExpression = {
      columns: [columns[1]],
      orderBy: {
        type: QueryEditorExpressionType.Property,
        property: { name: 'name', type: QueryEditorPropertyType.String },
      },
      orderByDirection: 'DESC',
    };
    const result = toRawSql({ ...queryWithDefaults, sql }, 'projectId');
    expect(result).toEqual(`SELECT name ${from} ORDER BY name DESC `);
  });

  it(`should not add orderByDirection if orderBy not set`, () => {
    const sql: SQLExpression = {
      columns: [columns[1]],
      orderByDirection: 'DESC',
    };
    const result = toRawSql({ ...queryWithDefaults, sql }, 'projectId');
    expect(result).toEqual(`SELECT name ${from} `);
  });

  it(`should return SELECT name ${from} LIMIT 10 when limit is set to 10`, () => {
    const sql: SQLExpression = {
      columns: [columns[1]],
      limit: 10,
    };
    const result = toRawSql({ ...queryWithDefaults, sql }, 'projectId');
    expect(result).toEqual(`SELECT name ${from} LIMIT 10 `);
  });

  it(`should return SELECT name ${from} LIMIT 0 when limit is set to 0`, () => {
    const sql: SQLExpression = {
      columns: [columns[1]],
      limit: 0,
    };
    const result = toRawSql({ ...queryWithDefaults, sql }, 'projectId');
    expect(result).toEqual(`SELECT name ${from} LIMIT 0 `);
  });

  it(`should not set limit if it is a negative value`, () => {
    const sql: SQLExpression = {
      columns: [columns[1]],
      limit: -2,
    };
    const result = toRawSql({ ...queryWithDefaults, sql }, 'projectId');
    expect(result).toEqual(`SELECT name ${from} `);
  });
});

describe('haveColumns', () => {
  it('should return false if columns is empty array or undefined', () => {
    const columns: SQLExpression['columns'] = [];
    expect(haveColumns(columns)).toBeFalsy();
    expect(haveColumns(undefined)).toBeFalsy();
  });
  it('should return true if there is a function', () => {
    const columns: SQLExpression['columns'] = [{ name: 'count', type: QueryEditorExpressionType.Function }];
    expect(haveColumns(columns)).toBeTruthy();
  });
  it('should return true if there is a column', () => {
    const columns: SQLExpression['columns'] = [
      {
        type: QueryEditorExpressionType.Function,
        parameters: [{ name: 'id', type: QueryEditorExpressionType.FunctionParameter }],
      },
    ];
    expect(haveColumns(columns)).toBeTruthy();
  });
});
