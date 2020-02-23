import { BigQueryDatasource } from './datasource';
import { BigQueryQueryCtrl } from './query_ctrl';
import { BigQueryConfigCtrl } from './config_ctrl';

const defaultQuery = `SELECT
  extract(epoch from time_column) AS time,
  text_column as text,
  tags_column as tags
FROM
  metric_table
WHERE
  $__timeFilter(time_column)
`;

class BigQueryAnnotationsQueryCtrl {
  static templateUrl = 'partials/annotations.editor.html';

  public annotation: any;

  /** @ngInject */
  constructor() {
    this.annotation.rawQuery = this.annotation.rawQuery || defaultQuery;
  }
}

export {
  BigQueryDatasource,
  BigQueryDatasource as Datasource,
  BigQueryQueryCtrl as QueryCtrl,
  BigQueryConfigCtrl as ConfigCtrl,
  BigQueryAnnotationsQueryCtrl as AnnotationsQueryCtrl,
};
