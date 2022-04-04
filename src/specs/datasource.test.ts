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
});
