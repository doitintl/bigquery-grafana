import { SelectableValue } from '@grafana/data';
// import { queries } from '@testing-library/dom';
import { getApiClient } from 'api';
import { useAsync } from 'react-use';
import { QueryWithDefaults } from '../types';
import { getDatasourceId } from '../utils';
import { getColumnInfoFromSchema } from './getColumnInfoFromSchema';

type Options = {
  query: QueryWithDefaults;
  isOrderable?: boolean;
};

export function useColumns({ query, isOrderable = false }: Options) {
  const datasourceId = getDatasourceId();
  const { value: apiClient } = useAsync(async () => await getApiClient(datasourceId), []);

  const state = useAsync(async () => {
    if (!query.location || !query.dataset || !query.table || !apiClient) {
      return;
    }

    const columns = await apiClient.getColumns(query, isOrderable);
    const schema = await apiClient.getTableSchema(query);
    const colTypes = new Map<string, SelectableValue[]>();

    for (let i = 0; i < columns.length; i++) {
      const cInfo = schema.schema ? getColumnInfoFromSchema(columns[i], schema.schema) : null;
      if (cInfo?.type) {
        if (colTypes.has(cInfo?.type)) {
          colTypes.get(cInfo.type)?.push({
            value: columns[i],
            label: columns[i],
            icon: cInfo?.type ? mapColumnTypeToIcon(cInfo?.type) : undefined,
          });
        } else {
          colTypes.set(cInfo?.type, [
            {
              value: columns[i],
              label: columns[i],
              icon: cInfo?.type ? mapColumnTypeToIcon(cInfo?.type) : undefined,
            },
          ]);
        }
      }
    }

    let results: SelectableValue[] = [];
    for (let [_, v] of colTypes.entries()) {
      results = results.concat(v);
    }
    return results;
  }, [apiClient, query]);

  return state;
}

export function mapColumnTypeToIcon(type: string) {
  switch (type) {
    case 'TIME':
    case 'DATETIME':
    case 'TIMESTAMP':
      return 'clock-nine';
    case 'BOOLEAN':
      return 'toggle-off';
    case 'INTEGER':
    case 'FLOAT':
    case 'FLOAT64':
    case 'INT':
    case 'SMALLINT':
    case 'BIGINT':
    case 'TINYINT':
    case 'BYTEINT':
    case 'INT64':
    case 'INT64':
    case 'NUMERIC':
    case 'DECIMAL':
      return 'calculator-alt';
    case 'STRING':
    case 'BYTES':
      return 'text';
    case 'GEOGRAPHY':
      return 'map';
    default:
      return undefined;
  }
}
