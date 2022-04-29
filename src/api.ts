import { TimeRange } from '@grafana/data';
import { getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';
import { BigQueryQueryNG } from 'types';
import { interpolateVariable } from './utils/interpolateVariable';

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
  query: BigQueryQueryNG;
  rawSql: string;
  error: string;
  isError: boolean;
  isValid: boolean;
  statistics: {
    TotalBytesProcessed: number;
  } | null;
}

interface GCPProject {
  displayName: string;
  projectId: string;
}

export interface BigQueryAPI {
  getDefaultProject: () => string;
  getDatasets: (location: string, project: string) => Promise<string[]>;
  getTables: (query: BigQueryQueryNG) => Promise<string[]>;
  getTableSchema: (query: BigQueryQueryNG) => Promise<TableSchema>;
  getColumns: (query: BigQueryQueryNG, isOrderable?: boolean) => Promise<string[]>;
  validateQuery: (query: BigQueryQueryNG, range?: TimeRange) => Promise<ValidationResults>;
  getProjects: () => Promise<GCPProject[]>;
  dispose: () => void;
}

class BigQueryAPIClient implements BigQueryAPI {
  private RESULTS_CACHE = new Map<string, any>();
  private baseUrl: string;
  private resourcesUrl: string;
  private datasourceId: number;
  private lastValidation: ValidationResults | null = null;

  constructor(datasourceId: number, private defaultProject: string) {
    this.datasourceId = datasourceId;
    this.baseUrl = `/api/datasources/${datasourceId}`;
    this.resourcesUrl = `${this.baseUrl}/resources`;
  }

  getDefaultProject() {
    return this.defaultProject;
  }

  getDatasets = async (location: string, project: string) => {
    return await this.fromCache('datasets', this._getDatasets)(location, project);
  };

  private _getDatasets = async (location: string, project: string): Promise<string[]> => {
    return await getBackendSrv().post(this.resourcesUrl + '/datasets', {
      project,
      location,
    });
  };

  private _getProjects = async (): Promise<GCPProject[]> => {
    return await getBackendSrv().post(this.resourcesUrl + '/projects', {
      datasourceId: `${this.datasourceId}`,
    });
  };

  getProjects = async (): Promise<GCPProject[]> => {
    return this.fromCache('projects', this._getProjects)(this.datasourceId);
  };

  getTables = async (query: BigQueryQueryNG): Promise<string[]> => {
    return this.fromCache('tables', this._getTables)(query);
  };

  private _getTables = async (query: BigQueryQueryNG): Promise<string[]> => {
    return await getBackendSrv().post(this.resourcesUrl + '/tables', {
      project: query.project,
      location: query.location,
      dataset: query.dataset,
    });
  };

  validateQuery = async (query: BigQueryQueryNG, range?: TimeRange): Promise<ValidationResults> => {
    const rawSql = getTemplateSrv()
      .replace(
        query.rawSql,
        // The $__interval vars are hardcoded here, as validation is not performed via PanelQueryRunner which provides the interval value.
        // Moreover, the interval and the rest of the query options are not passed down to the QueryEditor are these are dependand on
        // dashbaord settings, panel size etc. Hardcoding the interval value here should not influence the query validation whatsoever.
        {
          __interval: {
            text: '1m',
            value: '1m',
          },
          __interval_ms: {
            text: '60000',
            value: 60000,
          },
        },
        interpolateVariable
      )
      .trim();

    const lastRawSql =
      this.lastValidation &&
      getTemplateSrv().replace(this.lastValidation.query.rawSql, undefined, interpolateVariable).trim();

    if (this.lastValidation && rawSql === lastRawSql && query.location === this.lastValidation.query.location) {
      return this.lastValidation;
    }

    const validationResults = await getBackendSrv().post(this.resourcesUrl + '/validateQuery', {
      project: this.defaultProject,
      location: query.location,
      query: {
        ...query,
        rawSql,
      },
      range,
    });

    this.lastValidation = {
      ...validationResults,
      query,
      rawSql: validationResults.query,
    };

    return this.lastValidation!;
  };

  getColumns = async (query: BigQueryQueryNG, isOrderable?: boolean): Promise<string[]> => {
    return this.fromCache('columns', this._getColumns)(query, isOrderable);
  };

  private _getColumns = async (query: BigQueryQueryNG, isOrderable?: boolean): Promise<string[]> => {
    return await getBackendSrv().post(this.resourcesUrl + '/columns', {
      project: query.project,
      location: query.location,
      dataset: query.dataset,
      table: query.table,
      isOrderable: isOrderable ? 'true' : 'false',
    });
  };

  getTableSchema = async (query: BigQueryQueryNG): Promise<TableSchema> => {
    return this.fromCache('schema', this._getTableSchema)(query);
  };

  private _getTableSchema = async (query: BigQueryQueryNG): Promise<TableSchema> => {
    const result = await lastValueFrom(
      getBackendSrv().fetch<TableSchema>({
        method: 'POST',
        showErrorAlert: false,
        showSuccessAlert: false,
        url: this.resourcesUrl + '/dataset/table/schema',
        data: {
          project: query.project,
          location: query.location,
          dataset: query.dataset,
          table: query.table,
        },
      })
    );

    return result.data;
  };

  private fromCache = <T>(scope: string, fn: (...args: any[]) => Promise<T>) => async (...args: any[]): Promise<T> => {
    let id = `${scope}/${args.join('.')}`;

    if (args[0]?.location) {
      id = `${scope}/${args[0].project}.${args[0].location}.${args[0].dataset}.${args[0].table}`;
    }

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
