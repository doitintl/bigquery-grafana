import { DataSourcePlugin } from '@grafana/data';
import { BigQueryOptions } from 'types';
import { BigQueryConfigEditor } from './components/ConfigEditor';
import { QueryEditor } from './components/QueryEditor';
import { BigQueryDatasource } from './datasource';

const plugin = new DataSourcePlugin<any, any, BigQueryOptions>(BigQueryDatasource)
  .setConfigEditor(BigQueryConfigEditor)
  .setVariableQueryEditor(QueryEditor)
  .setQueryEditor(QueryEditor);

export { plugin };
