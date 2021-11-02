import { DataQuery, DataSourceJsonData } from '@grafana/data';
import { BigQueryAPI } from 'api';

export enum GoogleAuthType {
  JWT = 'jwt',
  GCE = 'gce',
}

export enum QueryPriority {
  Interactive = 'INTERACTIVE',
  Batch = 'BATCH',
}

export interface BigQueryOptions extends DataSourceJsonData {
  authenticationType: GoogleAuthType;
  flatRateProject?: string;
  processingLocation?: string;
  queryPriority?: QueryPriority;
  tokenUri?: string;
  clientEmail?: string;
  defaultProject?: string;
  defaultDataset?: string;
}

export interface BigQuerySecureJsonData {
  privateKey?: string;
}

export enum GroupType {
  Time = 'time',
  Column = 'column',
}

export enum QueryFormat {
  Timeseries = 0,
  Table = 1,
}

export interface QueryModel extends DataQuery {
  rawSql: string;
  format: QueryFormat;
  connectionArgs: {
    project: string;
    dataset: string;
    table: string;
    location: string;
  };
}

export interface ResourceSelectorProps {
  apiClient: BigQueryAPI;
  location: string;
  projectId: string;
  disabled?: boolean;
  className?: string;
  applyDefault?: boolean;
}
