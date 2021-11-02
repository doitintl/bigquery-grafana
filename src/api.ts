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
  getDatasets: (project: string, location: string) => Promise<string[]>;
  getTables: (project: string, location: string, dataset: string) => Promise<string[]>;
  getTableSchema: (project: string, location: string, dataset: string, table: string) => Promise<TableSchema>;
}

class BigQueryAPIClient implements BigQueryAPI {
  private baseUrl: string;
  private resourcesUrl: string;

  constructor(datasourceId: number) {
    this.baseUrl = `/api/datasources/${datasourceId}`;
    this.resourcesUrl = `${this.baseUrl}/resources`;
  }

  getDatasets = async (project: string, location: string): Promise<string[]> => {
    return await getBackendSrv().post(this.resourcesUrl + '/datasets', {
      project,
      location,
    });
  };

  getTables = async (project: string, location: string, dataset: string): Promise<string[]> => {
    return await getBackendSrv().post(this.resourcesUrl + '/dataset/tables', {
      project,
      location,
      dataset,
    });
  };

  getTableSchema = async (project: string, location: string, dataset: string, table: string): Promise<TableSchema> => {
    return await getBackendSrv().post(this.resourcesUrl + '/dataset/table/schema', {
      project,
      location,
      dataset,
      table,
    });
  };
}

const apis: Map<number, BigQueryAPI> = new Map();

export function getApiClient(datasourceId: number) {
  if (!apis.has(datasourceId)) {
    apis.set(datasourceId, new BigQueryAPIClient(datasourceId));
  }

  return apis.get(datasourceId)!;
}
