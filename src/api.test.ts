import { setBackendSrv } from '@grafana/runtime';
import { getApiClient } from './api';

describe('api', () => {
  const datasourceId = 1;
  const mockResponse = {
    status: 200,
    data: {
      message: 'Hello World',
    },
  };

  let defaultProjectSpy = jest.fn();
  const setupBackendSrv = (spy: jest.Mock) => {
    setBackendSrv({
      post: (path: string) => {
        const resPath = `/api/datasources/${datasourceId}/resources`;
        if (path === `${resPath}/defaultProjects`) {
          defaultProjectSpy();
          return 'defaultProject';
        } else {
          spy();
          return mockResponse;
        }

        return null;
      },
    } as any);
  };

  beforeEach(() => {
    defaultProjectSpy.mockClear();
  });

  test('api caching', async () => {
    setupBackendSrv(jest.fn());

    await getApiClient(datasourceId);
    expect(defaultProjectSpy).toBeCalled();

    await getApiClient(datasourceId);
    expect(defaultProjectSpy).toBeCalledTimes(1);
  });

  it.each`
    method              | connArgs
    ${'getDatasets'}    | ${['us']}
    ${'getTables'}      | ${['us', 'my-dataset']}
    ${'getColumns'}     | ${['us', 'my-dataset', 'my-table']}
    ${'getTableSchema'} | ${['us', 'my-dataset', 'my-table']}
  `('$method returns cached values', async ({ method, connArgs }) => {
    const callsSpy = jest.fn();
    setupBackendSrv(callsSpy);
    const apiClient = await getApiClient(datasourceId);

    const res1 = await (apiClient as any)[method](...connArgs);
    expect(res1).toEqual(mockResponse);
    expect(callsSpy).toBeCalledTimes(1);

    const res2 = await (apiClient as any)[method](...connArgs);
    expect(res2).toEqual(mockResponse);
    expect(callsSpy).toBeCalledTimes(1);

    await apiClient.dispose();
    const res3 = await (apiClient as any)[method](...connArgs);
    expect(res3).toEqual(mockResponse);
    expect(callsSpy).toBeCalledTimes(2);
  });
});
