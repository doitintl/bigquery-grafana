import { getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { BigQueryQueryNG } from 'types';

export interface TableFieldSchema {
  name: string;
  description?: string;
  type: string;
  repeated: boolean;
  schema: TableFieldSchema[];
}

export enum PartitioningType {
  Day = 'DAY',
  Hour = 'HOUR',
}

export interface TableSchema {
  name?: string;
  schema?: TableFieldSchema[];
  timePartitioning?: {
    type?: PartitioningType;
    field?: string;
  };
  rangePartitioning?: any;
}

export interface ValidationResults {
  error: string;
  isError: boolean;
  isValid: boolean;
  statistics: {
    TotalBytesProcessed: number;
  } | null;
}

export interface BigQueryAPI {
  getDefaultProject: () => string;
  getDatasets: (location: string) => Promise<string[]>;
  getTables: (location: string, dataset: string) => Promise<string[]>;
  getTableSchema: (location: string, dataset: string, table: string) => Promise<TableSchema>;
  getColumns: (location: string, dataset: string, table: string, isOrderable?: boolean) => Promise<string[]>;
  validateQuery: (query: BigQueryQueryNG) => Promise<ValidationResults>;
  dispose: () => void;
}

class BigQueryAPIClient implements BigQueryAPI {
  private RESULTS_CACHE = new Map<string, any>();
  private baseUrl: string;
  private resourcesUrl: string;

  constructor(datasourceId: number, private defaultProject: string) {
    this.baseUrl = `/api/datasources/${datasourceId}`;
    this.resourcesUrl = `${this.baseUrl}/resources`;
  }

  getDefaultProject() {
    return this.defaultProject;
  }

  getDatasets = async (location: string) => {
    return await this.fromCache('datasets', this._getDatasets)(location);
  };

  private _getDatasets = async (location: string): Promise<string[]> => {
    return await getBackendSrv().post(this.resourcesUrl + '/datasets', {
      project: this.defaultProject,
      location,
    });
  };

  getTables = async (location: string, dataset: string): Promise<string[]> => {
    return this.fromCache('tables', this._getTables)(location, dataset);
  };

  private _getTables = async (location: string, dataset: string): Promise<string[]> => {
    return await getBackendSrv().post(this.resourcesUrl + '/tables', {
      project: this.defaultProject,
      location,
      dataset,
    });
  };

  validateQuery = async (query: BigQueryQueryNG): Promise<ValidationResults> => {
    return await getBackendSrv().post(this.resourcesUrl + '/validateQuery', {
      project: this.defaultProject,
      location: query.location,
      query: {
        ...query,
        rawSql: getTemplateSrv().replace(query.rawSql),
      },
    });
  };

  getColumns = async (location: string, dataset: string, table: string, isOrderable?: boolean): Promise<string[]> => {
    return this.fromCache('columns', this._getColumns)(location, dataset, table, isOrderable);
  };

  private _getColumns = async (
    location: string,
    dataset: string,
    table: string,
    isOrderable?: boolean
  ): Promise<string[]> => {
    return await getBackendSrv().post(this.resourcesUrl + '/columns', {
      project: this.defaultProject,
      location,
      dataset,
      table,
      isOrderable: isOrderable ? 'true' : 'false',
    });
  };

  getTableSchema = async (location: string, dataset: string, table: string): Promise<TableSchema> => {
    return this.fromCache('schema', this._getTableSchema)(location, dataset, table);
  };

  private _getTableSchema = async (location: string, dataset: string, table: string): Promise<TableSchema> => {
    return await getBackendSrv().post(this.resourcesUrl + '/dataset/table/schema', {
      project: this.defaultProject,
      location,
      dataset,
      table,
    });
  };

  private fromCache = <T>(scope: string, fn: (...args: any[]) => Promise<T>) => async (...args: any[]): Promise<T> => {
    const id = `${scope}/${args.join('.')}`;

    if (this.RESULTS_CACHE.has(id)) {
      return Promise.resolve(this.RESULTS_CACHE.get(id)!);
    } else {
      const res = await fn(...args);
      this.RESULTS_CACHE.set(id, res);
      return res;
    }
  };

  dispose() {
    this.RESULTS_CACHE.clear();
  }
}

const apis: Map<number, BigQueryAPI> = new Map();

export async function getApiClient(datasourceId: number) {
  if (!apis.has(datasourceId)) {
    const defaultProject = await getBackendSrv().post(`/api/datasources/${datasourceId}/resources/defaultProjects`, {});
    apis.set(datasourceId, new BigQueryAPIClient(datasourceId, defaultProject));
  }

  return apis.get(datasourceId)!;
}
