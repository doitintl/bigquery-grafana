import { DataSourcePlugin } from '@grafana/data';
import { BigQueryAnnotationsQueryCtrl } from 'annotations_query_ctrl';
import { BigQueryOptions } from 'types';
import { BigQueryConfigEditor } from './ConfigEditor';
import { BigQueryDatasource } from './datasource';
import { BigQueryQueryCtrl } from './query_ctrl';

export const plugin = new DataSourcePlugin<any, any, BigQueryOptions>(BigQueryDatasource)
  .setQueryCtrl(BigQueryQueryCtrl)
  .setConfigEditor(BigQueryConfigEditor)
  .setAnnotationQueryCtrl(BigQueryAnnotationsQueryCtrl);
