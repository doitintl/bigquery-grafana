// eslint-disable-next-line no-restricted-imports
import moment from 'moment';
import { of } from 'rxjs';
import { BigQueryDatasource } from '../datasource';

const templateSrvMock = {
  replace: jest.fn((text) => text),
};
const fetchMock = jest.fn().mockReturnValue(of({ data: {}, status: 200 }));
jest.mock('@grafana/runtime', () => ({
  ...((jest.requireActual('@grafana/runtime') as unknown) as object),
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

  // describe('annotationQuery', () => {
  //   beforeEach(() => {
  //     const mockResponse = {
  //       kind: 'bigquery#queryResponse',
  //       schema: {
  //         fields: [
  //           {
  //             name: 'time',
  //             type: 'TIMESTAMP',
  //             mode: 'NULLABLE',
  //           },
  //           {
  //             name: 'text',
  //             type: 'STRING',
  //             mode: 'NULLABLE',
  //           },
  //           {
  //             name: 'tags',
  //             type: 'STRING',
  //             mode: 'NULLABLE',
  //           },
  //         ],
  //       },
  //       jobReference: {
  //         projectId: 'proj-1',
  //         jobId: 'job_fB4qCDAO-TKg1Orc-OrkdIRxCGN5',
  //         location: 'US',
  //       },
  //       totalRows: '2',
  //       rows: [
  //         {
  //           f: [{ v: 1 }, { v: 'text1' }, { v: 'tags1' }],
  //         },
  //         {
  //           f: [{ v: 2 }, { v: 'text2' }, { v: 'tags2' }],
  //         },
  //       ],
  //       totalBytesProcessed: '23289520',
  //       jobComplete: true,
  //       cacheHit: false,
  //     };
  //     fetchMock.mockImplementation(() => of({ data: mockResponse, status: 200 }));
  //   });

  //   const options = {
  //     annotation: {
  //       name: 'Annotation test name',
  //       rawQuery: `select x from y where z`,
  //     },
  //     scopedVars: {
  //       __interval: {
  //         text: '600000',
  //         value: 600000,
  //       },
  //     },
  //     range: {
  //       from: moment.utc('2018-04-25 10:00'),
  //       to: moment.utc('2018-04-25 11:00'),
  //     },
  //   };

  //   it('should return expected data', async () => {
  //     const expectedResult = [
  //       {
  //         annotation: { name: 'Annotation test name', rawQuery: 'select x from y where z' },
  //         tags: ['tags1'],
  //         text: 'text1',
  //         time: 1000,
  //       },
  //       {
  //         annotation: { name: 'Annotation test name', rawQuery: 'select x from y where z' },
  //         tags: ['tags2'],
  //         text: 'text2',
  //         time: 2000,
  //       },
  //     ];
  //     const res = await ctx.ds.annotationQuery(options);

  //     expect(res).toEqual(expectedResult);
  //     expect(res.length).toBe(expectedResult.length);
  //   });
  // });
});
