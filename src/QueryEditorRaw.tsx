import React from 'react';
import { CodeEditor } from '@grafana/ui';
// import { getTemplateSrv } from '@grafana/runtime';
import { BigQueryQueryNG } from './bigquery_query';
// import { buildGetSuggestions } from 'Suggestions';

type Props = {
  query: BigQueryQueryNG;
  onChange: (value: BigQueryQueryNG) => void;
  onRunQuery: () => void;
};

export function QueryEditorRaw(props: Props) {
  //   const { rawSQL } = defaults(props.query, defaultQuery);
  const onRawSqlChange = (rawSql: string) => {
    const query = {
      ...props.query,
      rawQuery: true,
      rawSql,
    };
    props.onChange(query);
    props.onRunQuery();
  };

  //   const getSuggestions = buildGetSuggestions({ query: props.query, templateSrv: getTemplateSrv() });

  return (
    <CodeEditor
      height={'240px'}
      language={'sql'}
      value={props.query.rawSql}
      onBlur={onRawSqlChange}
      showMiniMap={false}
      showLineNumbers={true}
      //   getSuggestions={getSuggestions}
    />
  );
}
