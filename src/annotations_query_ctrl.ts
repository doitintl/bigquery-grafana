const defaultQuery = `SELECT
  extract(epoch from time_column) AS time,
  text_column as text,
  tags_column as tags
FROM
  metric_table
WHERE
  $__timeFilter(time_column)
`;

export class BigQueryAnnotationsQueryCtrl {
  static templateUrl = 'partials/annotations.editor.html';

  annotation: any;

  constructor() {
    this.annotation.rawQuery = this.annotation.rawQuery || defaultQuery;
  }
}
