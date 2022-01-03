import { DataSourcePlugin } from '@grafana/data';
import { BigQueryAnnotationsQueryCtrl } from 'annotations_query_ctrl';
import { BigQueryOptions } from 'types';
import { BigQueryConfigEditor } from './ConfigEditor';
import { QueryEditor } from './QueryEditor';
import { BigQueryDatasource } from './datasource';
import { BigQueryQueryCtrl } from './query_ctrl';

const ENABLE_NG = true;

const plugin = new DataSourcePlugin<any, any, BigQueryOptions>(BigQueryDatasource)
  .setConfigEditor(BigQueryConfigEditor)
  .setVariableQueryEditor(QueryEditor)
  .setAnnotationQueryCtrl(BigQueryAnnotationsQueryCtrl);

if (ENABLE_NG) {
  plugin.setQueryEditor(QueryEditor);
} else {
  plugin.setQueryCtrl(BigQueryQueryCtrl);
}

export { plugin };
