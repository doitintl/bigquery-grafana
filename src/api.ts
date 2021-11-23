import { getBackendSrv } from '@grafana/runtime';

export interface TableFieldSchema {
  name: string;
  description?: string;
  type: string;
  schema: TableFieldSchema[];
}

export interface TableSchema {
  schema?: TableFieldSchema[];
}

export interface BigQueryAPI {
  getDatasets: (location: string) => Promise<string[]>;
  getTables: (location: string, dataset: string) => Promise<string[]>;
  getTableSchema: (location: string, dataset: string, table: string) => Promise<TableSchema>;
}

class BigQueryAPIClient implements BigQueryAPI {
  private baseUrl: string;
  private resourcesUrl: string;

  constructor(datasourceId: number, private defaultProject: string) {
    this.baseUrl = `/api/datasources/${datasourceId}`;
    this.resourcesUrl = `${this.baseUrl}/resources`;
  }

  getDatasets = async (location: string): Promise<string[]> => {
    return await getBackendSrv().post(this.resourcesUrl + '/datasets', {
      project: this.defaultProject,
      location,
    });
  };

  getTables = async (location: string, dataset: string): Promise<string[]> => {
    return await getBackendSrv().post(this.resourcesUrl + '/dataset/tables', {
      project: this.defaultProject,
      location,
      dataset,
    });
  };

  getTableSchema = async (location: string, dataset: string, table: string): Promise<TableSchema> => {
    return await getBackendSrv().post(this.resourcesUrl + '/dataset/table/schema', {
      project: this.defaultProject,
      location,
      dataset,
      table,
    });
  };
}

const apis: Map<number, BigQueryAPI> = new Map();

export async function getApiClient(datasourceId: number) {
  if (!apis.has(datasourceId)) {
    const defaultProject = await getBackendSrv().post(`/api/datasources/${datasourceId}/resources/defaultProjects`, {});
    apis.set(datasourceId, new BigQueryAPIClient(datasourceId, defaultProject));
  }

  return apis.get(datasourceId)!;
}
