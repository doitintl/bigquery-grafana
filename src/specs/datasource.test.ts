// eslint-disable-next-line no-restricted-imports
import moment from 'moment';
import { of } from 'rxjs';
import { BigQueryDatasource } from '../datasource';

const templateSrvMock = {
  replace: jest.fn((text) => text),
};
const fetchMock = jest.fn().mockReturnValue(of({ data: {}, status: 200 }));
jest.mock('@grafana/runtime', () => ({
  ...(jest.requireActual('@grafana/runtime') as unknown as object),
  getBackendSrv: () => ({
    fetch: fetchMock,
  }),
  getTemplateSrv: () => templateSrvMock,
}));

describe('BigQueryDatasource', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const instanceSettings: any = {
    name: 'bigquery',
    jsonData: {
      authenticationType: 'jwt',
      sendUsageData: false,
    },
  };

  const raw = {
    from: moment.utc('2018-04-25 10:00'),
    to: moment.utc('2018-04-25 11:00'),
  };

  const ctx = {
    timeSrvMock: {
      timeRange: () => ({
        from: raw.from,
        to: raw.to,
        raw,
      }),
    },
  } as any;

  beforeEach(() => {
    ctx.ds = new BigQueryDatasource(instanceSettings);
    ctx.ds.projectName = 'my project';
  });

  describe('metricFindQuery', () => {
    const query = '',
      options = { variable: { name: 'refId' } };

    it('should check response for empty query', async () => {
      const res = await ctx.ds.metricFindQuery(query, options);
      expect(res).toEqual([]);
    });
  });

  describe('When performing do request', () => {
    let results: any;

    beforeEach(() => {
      const mockResponse = {
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
          projectId: 'aviv-playground',
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
      fetchMock.mockImplementation(() => of({ data: mockResponse, status: 200 }));
    });

    it('should return expected data', async () => {
      const results = await ctx.ds.doQuery('select * from table', 'id-1');
      expect(results.data.rows.length).toBe(3);
      expect(results.data.schema.fields.length).toBe(2);
    });

    it('should return expected data batch api', async () => {
      const priority = 'BATCH';
      await ctx.ds.doQuery('select * from table', 'id-1', priority).then((data: any) => {
        results = data;
      });
      expect(results.data.rows.length).toBe(3);
      expect(results.data.schema.fields.length).toBe(2);
    });

    it('should return expected data interactive', async () => {
      const priority = 'INTERACTIVE';
      await ctx.ds.doQuery('select * from table', 'id-1', priority).then((data: any) => {
        results = data;
      });

      expect(results.data.rows.length).toBe(3);
      expect(results.data.schema.fields.length).toBe(2);
    });

    it('should return expected data interactive', async () => {
      const priority = 'INTERACTIVE';
      await ctx.ds.doQueryRequest('select * from table', 'id-1', priority).then((data: any) => {
        results = data;
      });

      expect(results.data.rows.length).toBe(3);
      expect(results.data.schema.fields.length).toBe(2);
    });
  });

  describe('_waitForJobComplete', () => {
    let results: any;

    const queryResults = {
      data: {
        totalBytesProcessed: '23289520',
        jobComplete: false,
        cacheHit: false,
      },
    };

    beforeEach(() => {
      const mockResponse = {
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
          projectId: 'aviv-playground',
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
      fetchMock.mockImplementation(() => of({ data: mockResponse, status: 200 }));
    });

    it('should return expected data', async () => {
      await ctx.ds
        ._waitForJobComplete(queryResults, 'requestId', 'job_fB4qCDAO-TKg1Orc-OrkdIRxCGN5')
        .then((data: any) => {
          results = data;
        });
      expect(results.data.rows.length).toBe(3);
      expect(results.data.schema.fields.length).toBe(2);
    });
  });

  describe('_getQueryResults', () => {
    let results: any;
    const mockResponse = {
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
        projectId: 'aviv-playground',
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
    const queryResults = {
      data: {
        pageToken: 'token;',
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
          projectId: 'aviv-playground',
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
      },
    };

    beforeEach(() => {
      fetchMock.mockImplementation(() => of({ data: mockResponse, status: 200 }));
    });

    it('should return expected data', async () => {
      await ctx.ds._getQueryResults(queryResults, 'requestId', 'job_fB4qCDAO-TKg1Orc-OrkdIRxCGN5').then((data: any) => {
        results = data;
      });
      expect(results.data.rows.length).toBe(6);
    });
  });

  describe('When performing getProjects', () => {
    let queryResults: any;

    beforeEach(async () => {
      const mockResponse = {
        kind: 'bigquery#projectList',
        etag: 'o48iuUgjDrXb++kcLl2yeQ==',
        projects: [
          {
            kind: 'bigquery#project',
            id: 'prj-1',
            numericId: '1',
            projectReference: {
              projectId: 'prj-1',
            },
            friendlyName: 'prj-1',
          },
          {
            kind: 'bigquery#project',
            id: 'prj-2',
            numericId: '2',
            projectReference: {
              projectId: 'prj-2',
            },
            friendlyName: 'prj-2',
          },
          {
            kind: 'bigquery#project',
            id: 'prj-3',
            numericId: '3',
            projectReference: {
              projectId: 'prj-3',
            },
            friendlyName: 'prj-3',
          },
        ],
        totalItems: 3,
      };
      fetchMock.mockImplementation(() => of({ data: mockResponse, status: 200 }));
      await ctx.ds.getProjects().then((data: any) => {
        queryResults = data;
      });
    });

    it('should return list of projects', () => {
      expect(queryResults.length).toBe(3);
      expect(queryResults[0].text).toBe('prj-1');
      expect(queryResults[2].text).toBe('prj-3');
    });
  });

  describe('When interpolating variables', () => {
    beforeEach(() => {
      ctx.variable = {};
    });

    describe('and value is a string', () => {
      it('should return an unquoted value', () => {
        expect(ctx.ds.interpolateVariable('abc', ctx.variable)).toEqual('abc');
      });
    });
    describe('and value is a number', () => {
      it('should return an unquoted value', () => {
        expect(ctx.ds.interpolateVariable(1000, ctx.variable)).toEqual(1000);
      });
    });
    describe('and value is an array of strings', () => {
      it('should return comma separated quoted values', () => {
        expect(ctx.ds.interpolateVariable(['a', 'b', 'c'], ctx.variable)).toEqual("'a','b','c'");
      });
    });

    describe('and variable allows multi-value and is a string', () => {
      it('should return a quoted value', () => {
        ctx.variable.multi = true;
        expect(ctx.ds.interpolateVariable('abc', ctx.variable)).toEqual("'abc'");
      });
    });

    describe('and variable contains single quote', () => {
      it('should return a quoted value', () => {
        ctx.variable.multi = true;
        expect(ctx.ds.interpolateVariable("a'bc", ctx.variable)).toEqual("'a''bc'");
        expect(ctx.ds.interpolateVariable("a'b'c", ctx.variable)).toEqual("'a''b''c'");
      });
    });

    describe('and variable allows all and is a string', () => {
      it('should return a quoted value', () => {
        ctx.variable.includeAll = true;
        expect(ctx.ds.interpolateVariable('abc', ctx.variable)).toEqual("'abc'");
      });
    });
  });

  describe('annotationQuery', () => {
    beforeEach(() => {
      const mockResponse = {
        kind: 'bigquery#queryResponse',
        schema: {
          fields: [
            {
              name: 'time',
              type: 'TIMESTAMP',
              mode: 'NULLABLE',
            },
            {
              name: 'text',
              type: 'STRING',
              mode: 'NULLABLE',
            },
            {
              name: 'tags',
              type: 'STRING',
              mode: 'NULLABLE',
            },
          ],
        },
        jobReference: {
          projectId: 'proj-1',
          jobId: 'job_fB4qCDAO-TKg1Orc-OrkdIRxCGN5',
          location: 'US',
        },
        totalRows: '2',
        rows: [
          {
            f: [{ v: 1 }, { v: 'text1' }, { v: 'tags1' }],
          },
          {
            f: [{ v: 2 }, { v: 'text2' }, { v: 'tags2' }],
          },
        ],
        totalBytesProcessed: '23289520',
        jobComplete: true,
        cacheHit: false,
      };
      fetchMock.mockImplementation(() => of({ data: mockResponse, status: 200 }));
    });

    const options = {
      annotation: {
        name: 'Annotation test name',
        rawQuery: `select x from y where z`,
      },
      scopedVars: {
        __interval: {
          text: '600000',
          value: 600000,
        },
      },
      range: {
        from: moment.utc('2018-04-25 10:00'),
        to: moment.utc('2018-04-25 11:00'),
      },
    };

    it('should return expected data', async () => {
      const expectedResult = [
        {
          annotation: { name: 'Annotation test name', rawQuery: 'select x from y where z' },
          tags: ['tags1'],
          text: 'text1',
          time: 1000,
        },
        {
          annotation: { name: 'Annotation test name', rawQuery: 'select x from y where z' },
          tags: ['tags2'],
          text: 'text2',
          time: 2000,
        },
      ];
      const res = await ctx.ds.annotationQuery(options);

      expect(res).toEqual(expectedResult);
      expect(res.length).toBe(expectedResult.length);
    });
  });
});
