import { OperatorType } from '@grafana/experimental';

export const BQ_OPERATORS = [
  { type: OperatorType.Comparison, id: 'LESS_THAN', operator: '<', description: 'Returns TRUE if X is less than Y.' },
  {
    type: OperatorType.Comparison,
    id: 'LESS_THAN_EQUAL',
    operator: '<=',
    description: 'Returns TRUE if X is less than or equal to Y.',
  },
  {
    type: OperatorType.Comparison,
    id: 'GREATER_THAN',
    operator: '>',
    description: 'Returns TRUE if X is greater than Y.',
  },
  {
    type: OperatorType.Comparison,
    id: 'GREATER_THAN_EQUAL',
    operator: '>=',
    description: 'Returns TRUE if X is greater than or equal to Y.',
  },
  { type: OperatorType.Comparison, id: 'EQUAL', operator: '=', description: 'Returns TRUE if X is equal to Y.' },
  {
    type: OperatorType.Comparison,
    id: 'NOT_EQUAL',
    operator: '!=',
    description: 'Returns TRUE if X is not equal to Y.',
  },
  {
    type: OperatorType.Comparison,
    id: 'NOT_EQUAL_ALT',
    operator: '<>',
    description: 'Returns TRUE if X is not equal to Y.',
  },
  {
    type: OperatorType.Comparison,
    id: 'LIKE',
    operator: 'LIKE',
    description: `Checks if the STRING in the first operand X matches a pattern specified by the second operand Y. Expressions can contain these characters:
- A percent sign "%" matches any number of characters or bytes
- An underscore "_" matches a single character or byte
- You can escape "\", "_", or "%" using two backslashes. For example, "\\%". If you are using raw strings, only a single backslash is required. For example, r"\%".`,
  },
  { type: OperatorType.Logical, id: 'LOGICAL_AND', operator: 'AND' },
  { type: OperatorType.Logical, id: 'LOGICAL_OR', operator: 'OR' },
];
