import {
  ColumnDefinition,
  CompletionItemKind,
  LanguageCompletionProvider,
  LinkedToken,
  StatementPlacementProvider,
  SuggestionKindProvider,
  TableDefinition,
  TokenType,
} from '@grafana/experimental';
import { BQ_AGGREGATE_FNS } from './bigQueryFunctions';
import { BQ_OPERATORS } from './bigQueryOperators';

interface CompletionProviderGetterArgs {
  getColumns: React.MutableRefObject<(t: string) => Promise<ColumnDefinition[]>>;
  getTables: React.MutableRefObject<(d?: string) => Promise<TableDefinition[]>>;
}

export const getBigQueryCompletionProvider: (args: CompletionProviderGetterArgs) => LanguageCompletionProvider = ({
  getColumns,
  getTables,
}) => () => ({
  triggerCharacters: ['.', ' ', '$', ',', '(', "'"],
  tables: {
    resolve: async () => {
      return await getTables.current();
    },
    parseName: (token: LinkedToken) => {
      let processedToken = token;
      let tablePath = processedToken.value;
      while (processedToken.next && !processedToken?.next?.isKeyword() && !processedToken?.next?.isParenthesis()) {
        tablePath += processedToken.next.value;
        processedToken = processedToken.next;
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
  customSuggestionKinds: customSuggestionKinds(getTables),
  customStatementPlacement,
});

export enum CustomStatementPlacement {
  AfterDataset = 'afterDataset',
}

export enum CustomSuggestionKind {
  TablesWithinDataset = 'tablesWithinDataset',
}

export const customStatementPlacement: StatementPlacementProvider = () => [
  {
    id: CustomStatementPlacement.AfterDataset,
    resolve: (currentToken, previousKeyword) => {
      return Boolean(
        previousKeyword?.value.toLowerCase() === 'from' &&
          (currentToken?.is(TokenType.Delimiter, '.') || currentToken?.previous?.is(TokenType.Delimiter, '.'))
      );
    },
  },
];

export const customSuggestionKinds: (getTables: CompletionProviderGetterArgs['getTables']) => SuggestionKindProvider = (
  getTables
) => () => [
  {
    id: CustomSuggestionKind.TablesWithinDataset,
    applyTo: [CustomStatementPlacement.AfterDataset],
    suggestionsResolver: async (ctx) => {
      let processedToken = ctx.currentToken;
      let tablePath = '';
      while (processedToken?.previous && !processedToken.previous.isWhiteSpace()) {
        tablePath = processedToken.previous.value + tablePath;
        processedToken = processedToken.previous;
      }

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
];
