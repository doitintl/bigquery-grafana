import {
  ColumnDefinition,
  CompletionItemInsertTextRule,
  CompletionItemKind,
  CompletionItemPriority,
  LanguageCompletionProvider,
  LinkedToken,
  StatementPlacementProvider,
  StatementPosition,
  SuggestionKindProvider,
  TableDefinition,
  TokenType,
} from '@grafana/experimental';
import { PartitioningType, TableSchema } from 'api';
import { BQ_AGGREGATE_FNS } from './bigQueryFunctions';
import { BQ_OPERATORS } from './bigQueryOperators';

interface CompletionProviderGetterArgs {
  getColumns: React.MutableRefObject<(t: string) => Promise<ColumnDefinition[]>>;
  getTables: React.MutableRefObject<(d?: string) => Promise<TableDefinition[]>>;
  getTableSchema: React.MutableRefObject<(l: string, d: string, t: string) => Promise<TableSchema | null>>;
}

export const getBigQueryCompletionProvider: (args: CompletionProviderGetterArgs) => LanguageCompletionProvider = ({
  getColumns,
  getTables,
  getTableSchema,
}) => () => ({
  triggerCharacters: ['.', ' ', '$', ',', '(', "'"],
  tables: {
    resolve: async () => {
      return await getTables.current();
    },
    parseName: (token: LinkedToken) => {
      let processedToken = token;
      let tablePath = processedToken.value;

      while (processedToken.next && processedToken?.next?.value !== '`') {
        tablePath += processedToken.next.value;
        processedToken = processedToken.next;
      }

      if (tablePath.trim().startsWith('`')) {
        return tablePath.slice(1);
      }

      return tablePath;
    },
  },

  columns: {
    resolve: async (t: string) => {
      return await getColumns.current(t);
    },
  },
  supportedFunctions: () => BQ_AGGREGATE_FNS,
  supportedOperators: () => BQ_OPERATORS,
  customSuggestionKinds: customSuggestionKinds(getTables, getTableSchema),
  customStatementPlacement,
});

export enum CustomStatementPlacement {
  AfterDataset = 'afterDataset',
}

export enum CustomSuggestionKind {
  TablesWithinDataset = 'tablesWithinDataset',
  Partition = 'partition',
}

export const customStatementPlacement: StatementPlacementProvider = () => [
  {
    id: CustomStatementPlacement.AfterDataset,
    resolve: (currentToken, previousKeyword) => {
      return Boolean(
        currentToken?.is(TokenType.Delimiter, '.') ||
          (currentToken?.value === '`' && currentToken?.previous?.is(TokenType.Delimiter, '.'))
      );
    },
  },
  {
    id: StatementPosition.AfterTable,
    resolve: (currentToken, previousKeyword, previousNonWhiteSpace, previousIsSlash) => {
      // A naive simplification

      return Boolean(previousNonWhiteSpace?.value === '`');
    },
  },
];

export const customSuggestionKinds: (
  getTables: CompletionProviderGetterArgs['getTables'],
  getTableSchema: CompletionProviderGetterArgs['getTableSchema']
) => SuggestionKindProvider = (getTables, getTableSchema) => () => [
  {
    id: CustomSuggestionKind.TablesWithinDataset,
    applyTo: [CustomStatementPlacement.AfterDataset],
    suggestionsResolver: async (ctx) => {
      const tablePath = ctx.currentToken ? getTablePath(ctx.currentToken) : '';
      const t = await getTables.current(tablePath);

      return t.map((table) => ({
        label: table.name,
        insertText: table.completion ?? table.name,
        kind: CompletionItemKind.Field,
        range: {
          ...ctx.range,
          startColumn: ctx.range.endColumn,
          endColumn: ctx.range.endColumn,
        },
      }));
    },
  },

  {
    id: CustomSuggestionKind.Partition,
    applyTo: [StatementPosition.AfterTable],
    suggestionsResolver: async (ctx) => {
      const tablePath = ctx.currentToken ? getTablePath(ctx.currentToken) : '';
      const path = tablePath.split('.').filter((s) => s);
      const suggestions = [];

      if (path.length === 3) {
        const schema = await getTableSchema.current(path[0], path[1], path[2]);
        if (schema) {
          const timePartitioningSetup = schema.timePartitioning;
          if (timePartitioningSetup) {
            if (timePartitioningSetup.field) {
              // TODO: add suport for field partitioning
            } else {
              // Ingestion-time partition
              // https://cloud.google.com/bigquery/docs/querying-partitioned-tables#query_an_ingestion-time_partitioned_table
              suggestions.push({
                label: '_PARTITIONTIME BETWEEN',
                insertText: 'WHERE _PARTITIONTIME BETWEEN TIMESTAMP("$1") AND TIMESTAMP("$2")',
                kind: CompletionItemKind.Snippet,
                insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
                sortText: CompletionItemPriority.MediumLow,
              });
              suggestions.push({
                label: '_PARTITIONTIME EQUALS',
                insertText: 'WHERE DATE(_PARTITIONTIME) = "$1"',
                kind: CompletionItemKind.Snippet,
                insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
                sortText: CompletionItemPriority.MediumLow,
              });

              if (timePartitioningSetup.type && timePartitioningSetup.type === PartitioningType.Day) {
                suggestions.push({
                  label: '_PARTITIONDATE BETWEEN',
                  insertText: 'WHERE _PARTITIONDATE BETWEEN DATE("$1") AND DATE("$2")',
                  kind: CompletionItemKind.Snippet,
                  insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
                  sortText: CompletionItemPriority.MediumLow,
                });
                suggestions.push({
                  label: '_PARTITIONDATE EQUALS',
                  insertText: 'WHERE DATE(_PARTITIONDATE) = "$1"',
                  kind: CompletionItemKind.Snippet,
                  insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
                  sortText: CompletionItemPriority.MediumLow,
                });
              }
            }
          }
        }
      }

      return suggestions;
    },
  },
];

function getTablePath(token: LinkedToken) {
  let processedToken = token;
  let tablePath = '';
  while (processedToken?.previous && !processedToken.previous.isWhiteSpace()) {
    tablePath = processedToken.previous.value + tablePath;
    processedToken = processedToken.previous;
  }

  if (tablePath.startsWith('`')) {
    tablePath = tablePath.slice(1);
  }

  if (tablePath.endsWith('`')) {
    tablePath = tablePath.slice(0, -1);
  }

  return tablePath;
}
