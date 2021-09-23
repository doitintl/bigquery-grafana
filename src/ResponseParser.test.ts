import { MetricFindValue } from '@grafana/data';
import { FetchResponse } from '@grafana/runtime';
import { BigQueryQueryNG } from 'bigquery_query';
import ResponseParser from 'ResponseParser';
import { QueryFormat } from 'types';

describe('ResponseParser', () => {
  it('transformAnnotationResponse empty results with 0 rows', async () => {
    const fields = [
      {
        name: 'time',
        type: 'TIMESTAMP',
        mode: 'NULLABLE',
      },
      {
        name: 'text',
        type: 'FLOAT',
        mode: 'NULLABLE',
      },
      {
        name: 'tags',
        type: 'FLOAT',
        mode: 'NULLABLE',
      },
    ];
    const options = { annotation: {} };
    const data = { data: { schema: { fields } } } as FetchResponse;
    const rp = new ResponseParser();
    const list = await rp.transformAnnotationResponse(options, data);

    expect(list.length).toBe(0);
  });

  it('transformAnnotationResponse empty results without rows', async () => {
    const fields = [
      {
        name: 'time',
        type: 'TIMESTAMP',
        mode: 'NULLABLE',
      },
      {
        name: 'text',
        type: 'FLOAT',
        mode: 'NULLABLE',
      },
      {
        name: 'tags',
        type: 'FLOAT',
        mode: 'NULLABLE',
      },
    ];
    const options = { annotation: {} };
    const data = { data: { schema: { fields } } } as FetchResponse;
    const rp = new ResponseParser();
    const list = await rp.transformAnnotationResponse(options, data);

    expect(list.length).toBe(0);
    expect(list).toEqual([]);
  });

  it('transformAnnotationResponse results with 3 rows', async () => {
    const rows = [
        {
          f: [
            {
              v: '1.521578851E9',
            },
            {
              v: '37.7753058',
            },
            {
              v: '42.7753058',
            },
          ],
        },
        {
          f: [
            {
              v: '1.521578916E9',
            },
            {
              v: '37.3322326',
            },
            {
              v: '42.7753058',
            },
          ],
        },
        {
          f: [
            {
              v: '1.521578927E9',
            },
            {
              v: '37.781752',
            },
            {
              v: '42.7753058',
            },
          ],
        },
      ],
      fields = [
        {
          name: 'time',
          type: 'TIMESTAMP',
          mode: 'NULLABLE',
        },
        {
          name: 'text',
          type: 'FLOAT',
          mode: 'NULLABLE',
        },
        {
          name: 'tags',
          type: 'FLOAT',
          mode: 'NULLABLE',
        },
      ];
    const options = { annotation: {} };
    const data = { data: { schema: { fields }, rows } } as FetchResponse;
    const rp = new ResponseParser();
    const list = await rp.transformAnnotationResponse(options, data);

    expect(list.length).toBe(3);
  });
});

describe('When performing parseQueryResults for table', () => {
  const response = {
    kind: 'bigquery#queryResponse',
    schema: {
      fields: [
        {
          name: 'time',
          type: 'TIMESTAMP',
          mode: 'NULLABLE',
        },
        {
          name: 'start_station_latitude',
          type: 'FLOAT',
          mode: 'NULLABLE',
        },
      ],
    },
    jobReference: {
      projectId: 'proj-1',
      jobId: 'job_fB4qCDAO-TKg1Orc-OrkdIRxCGN5',
      location: 'US',
    },
    totalRows: '3',
    rows: [
      {
        f: [
          {
            v: '1.521578851E9',
          },
          {
            v: '37.7753058',
          },
        ],
      },
      {
        f: [
          {
            v: '1.521578916E9',
          },
          {
            v: '37.3322326',
          },
        ],
      },
      {
        f: [
          {
            v: '1.521578927E9',
          },
          {
            v: '37.781752',
          },
        ],
      },
    ],
    totalBytesProcessed: '23289520',
    jobComplete: true,
    cacheHit: false,
  };

  const query = {
    format: QueryFormat.Table,
    refId: 'A',
    rawSql: 'raw',
    timeColumn: 'time',
  };

  it('should return a data frame', () => {
    const results = ResponseParser.parseQueryResults(response, query as BigQueryQueryNG);
    expect(results.refId).toBe('A');
    expect(results.length).toBe(3);
    expect(results.fields.length).toBe(2);
    expect(results).toMatchInlineSnapshot(`
      Object {
        "fields": Array [
          Object {
            "config": Object {},
            "name": "time",
            "type": "time",
            "values": Array [
              1521578851000,
              1521578916000,
              1521578927000,
            ],
          },
          Object {
            "config": Object {},
            "name": "start_station_latitude",
            "type": "number",
            "values": Array [
              37.7753058,
              37.3322326,
              37.781752,
            ],
          },
        ],
        "length": 3,
        "refId": "A",
      }
    `);
  });
});

describe('When performing parseQueryResults for time_series', () => {
  it('should return a data frame', () => {
    const response = {
      kind: 'bigquery#queryResponse',
      schema: {
        fields: [
          {
            name: 'time',
            type: 'TIMESTAMP',
            mode: 'NULLABLE',
          },
          {
            name: 'start_station_latitude',
            type: 'FLOAT',
            mode: 'NULLABLE',
          },
        ],
      },
      jobReference: {
        projectId: 'proj-1',
        jobId: 'job_fB4qCDAO-TKg1Orc-OrkdIRxCGN5',
        location: 'US',
      },
      totalRows: '3',
      rows: [
        {
          f: [
            {
              v: '1.521578851E9',
            },
            {
              v: null,
            },
          ],
        },
        {
          f: [
            {
              v: '1.521578916E9',
            },
            {
              v: '37.3322326',
            },
          ],
        },
        {
          f: [
            {
              v: '1.521578927E9',
            },
            {
              v: '37.781752',
            },
          ],
        },
      ],
      totalBytesProcessed: '23289520',
      jobComplete: true,
      cacheHit: false,
    };
    const query = {
      format: QueryFormat.Timeseries,
      refId: 'A',
      rawSql: 'raw',
      timeColumn: 'time',
    };
    const results = ResponseParser.parseQueryResults(response, query as BigQueryQueryNG);

    expect(results.refId).toBe('A');
    expect(results.length).toBe(3);
    expect(results).toMatchInlineSnapshot(`
      Object {
        "fields": Array [
          Object {
            "config": Object {},
            "name": "time",
            "type": "time",
            "values": Array [
              1521578851000,
              1521578916000,
              1521578927000,
            ],
          },
          Object {
            "config": Object {},
            "name": "start_station_latitude",
            "type": "number",
            "values": Array [
              null,
              37.3322326,
              37.781752,
            ],
          },
        ],
        "length": 3,
        "refId": "A",
      }
    `);
  });
  it('should  throw if there is no time field', () => {
    const response = {
      kind: 'bigquery#queryResponse',
      schema: {
        fields: [
          {
            name: 'start_station_latitude',
            type: 'FLOAT',
            mode: 'NULLABLE',
          },
        ],
      },
      jobReference: {
        projectId: 'proj-1',
        jobId: 'job_fB4qCDAO-TKg1Orc-OrkdIRxCGN5',
        location: 'US',
      },
      totalRows: '3',
      rows: [
        {
          f: [
            {
              v: null,
            },
          ],
        },
        {
          f: [
            {
              v: '37.3322326',
            },
          ],
        },
        {
          f: [
            {
              v: '37.781752',
            },
          ],
        },
      ],
      totalBytesProcessed: '23289520',
      jobComplete: true,
      cacheHit: false,
    };
    const query = {
      format: QueryFormat.Timeseries,
      refId: 'A',
      rawSql: 'raw',
      timeColumn: 'time',
    };
    expect(() => ResponseParser.parseQueryResults(response, query as BigQueryQueryNG)).toThrow();
  });
});

describe('When performing parseQueryResults for vars', () => {
  let results: MetricFindValue[];
  const response = {
    kind: 'bigquery#queryResponse',
    schema: {
      fields: [
        {
          name: 'time',
          type: 'TIMESTAMP',
          mode: 'NULLABLE',
        },
        {
          name: 'start_station_latitude',
          type: 'FLOAT',
          mode: 'NULLABLE',
        },
      ],
    },
    jobReference: {
      projectId: 'proj-1',
      jobId: 'job_fB4qCDAO-TKg1Orc-OrkdIRxCGN5',
      location: 'US',
    },
    totalRows: '3',
    rows: [
      {
        f: [
          {
            v: '1.521578851E9',
          },
          {
            v: '37.7753058',
          },
        ],
      },
      {
        f: [
          {
            v: '1.521578916E9',
          },
          {
            v: '37.3322326',
          },
        ],
      },
      {
        f: [
          {
            v: '1.521578927E9',
          },
          {
            v: '37.781752',
          },
        ],
      },
    ],
    totalBytesProcessed: '23289520',
    jobComplete: true,
    cacheHit: false,
  };

  it('should return a var', () => {
    results = ResponseParser.toVar(response);
    expect(results.length).toBe(3);
    expect(results[0].text).toBe('1.521578851E9');
  });
});
