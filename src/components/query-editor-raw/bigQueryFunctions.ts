export const BQ_AGGREGATE_FNS = [
  {
    id: 'ANY_VALUE',
    name: 'ANY_VALUE',
    description: `ANY_VALUE(
    expression
  )
  [OVER (...)]
  
  Returns expression for some row chosen from the group. Which row is chosen is nondeterministic, not random. Returns NULL when the input produces no rows. Returns NULL when expression is NULL for all rows in the group.
  
  ANY_VALUE behaves as if RESPECT NULLS is specified; Rows for which expression is NULL are considered and may be selected.`,
  },
  {
    id: 'ARRAY_AGG',
    name: 'ARRAY_AGG',
    description: `ARRAY_AGG(
    [DISTINCT]
    expression
    [{IGNORE|RESPECT} NULLS]
    [ORDER BY key [{ASC|DESC}] [, ... ]]
    [LIMIT n]
  )
  [OVER (...)]
  
  Returns an ARRAY of expression values`,
  },
  {
    id: 'ARRAY_CONCAT_AGG',
    name: 'ARRAY_CONCAT_AGG',
    description: `ARRAY_CONCAT_AGG(
    expression
    [ORDER BY key [{ASC|DESC}] [, ... ]]
    [LIMIT n]
  )
  
  Concatenates elements from expression of type ARRAY, returning a single ARRAY as a result. This function ignores NULL input arrays, but respects the NULL elements in non-NULL input arrays (an error is raised, however, if an array in the final query result contains a NULL element).`,
  },
  {
    id: 'AVG',
    name: 'AVG',
    description: `AVG(
    [DISTINCT]
    expression
  )
  [OVER (...)]
  
  Returns the average of non-NULL input values, or NaN if the input contains a NaN.`,
  },
  {
    id: 'BIT_AND',
    name: 'BIT_AND',
    description: `BIT_AND(
    expression
  )
  
  Performs a bitwise AND operation on expression and returns the result.`,
  },
  {
    id: 'BIT_OR',
    name: 'BIT_OR',
    description: `BIT_OR(
    expression
  )
  
  Performs a bitwise OR operation on expression and returns the result.
  `,
  },
  {
    id: 'BIT_XOR',
    name: 'BIT_XOR',
    description: `BIT_XOR(
    [DISTINCT]
    expression
  )
  
  Performs a bitwise XOR operation on expression and returns the result.
  `,
  },
  {
    id: 'COUNT',
    name: 'COUNT',
    description: `COUNT(*)  [OVER (...)]
  Returns the number of rows in the input.
  
  COUNT(
    [DISTINCT]
    expression
  )
  [OVER (...)]
  
  Returns the number of rows with expression evaluated to any value other than NULL.
  `,
  },
  {
    id: 'COUNTIF',
    name: 'COUNTIF',
    description: `COUNTIF(
    expression
  )
  [OVER (...)]
  
  Returns the count of TRUE values for expression. Returns 0 if there are zero input rows, or if expression evaluates to FALSE or NULL for all rows.`,
  },
  {
    id: 'LOGICAL_AND',
    name: 'LOGICAL_AND',
    description: `LOGICAL_AND(
    expression
  )
  
  Returns the logical AND of all non-NULL expressions. Returns NULL if there are zero input rows or expression evaluates to NULL for all rows.
  `,
  },
  {
    id: 'LOGICAL_OR',
    name: 'LOGICAL_OR',
    description: `LOGICAL_OR(
    expression
  )
  
  Returns the logical OR of all non-NULL expressions. Returns NULL if there are zero input rows or expression evaluates to NULL for all rows.
  `,
  },
  {
    id: 'MAX',
    name: 'MAX',
    description: `MAX(
    expression
  )
  [OVER (...)]
  
  Returns the maximum value of non-NULL expressions. Returns NULL if there are zero input rows or expression evaluates to NULL for all rows. Returns NaN if the input contains a NaN.
  `,
  },
  {
    id: 'MIN',
    name: 'MIN',
    description: `MIN(
    expression
  )
  [OVER (...)]
  
  Returns the minimum value of non-NULL expressions. Returns NULL if there are zero input rows or expression evaluates to NULL for all rows. Returns NaN if the input contains a NaN.
  `,
  },
  {
    id: 'STRING_AGG',
    name: 'STRING_AGG',
    description: `STRING_AGG(
    [DISTINCT]
    expression [, delimiter]
    [ORDER BY key [{ASC|DESC}] [, ... ]]
    [LIMIT n]
  )
  [OVER (...)]
  
  Returns a value (either STRING or BYTES) obtained by concatenating non-null values. Returns NULL if there are zero input rows or expression evaluates to NULL for all rows.
  
  If a delimiter is specified, concatenated values are separated by that delimiter; otherwise, a comma is used as a delimiter.
  `,
  },
  {
    id: 'SUM',
    name: 'SUM',
    description: `SUM(
    [DISTINCT]
    expression
  )
  [OVER (...)]
  
  Returns the sum of non-null values.
  
  If the expression is a floating point value, the sum is non-deterministic, which means you might receive a different result each time you use this function.
  `,
  },
];
