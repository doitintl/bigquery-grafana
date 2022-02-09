import { css } from '@emotion/css';
import { formattedValueToString, getValueFormat, shallowCompare } from '@grafana/data';
import { Icon, Spinner, useTheme2 } from '@grafana/ui';
import { BigQueryAPI, ValidationResults } from 'api';
import React, { useState, useMemo, useEffect } from 'react';
import { useAsyncFn, usePrevious } from 'react-use';
import useDebounce from 'react-use/lib/useDebounce';
import { BigQueryQueryNG } from 'types';

interface QueryValidatorProps {
  apiClient: BigQueryAPI;
  query: BigQueryQueryNG;
  onValidate: (isValid: boolean) => void;
}

export function QueryValidator({ apiClient, query, onValidate }: QueryValidatorProps) {
  const [validationResult, setValidationResult] = useState<ValidationResults | null>();
  const theme = useTheme2();
  const prevQuery = usePrevious(query);
  const valueFormatter = useMemo(() => getValueFormat('bytes'), []);

  const styles = useMemo(() => {
    return {
      container: css`
        border: 1px solid ${theme.colors.border.medium};
        border-top: none;
        padding: ${theme.spacing(0.5, 0.5, 0.5, 0.5)};
        display: flex;
        justify-content: space-between;
        font-size: ${theme.typography.bodySmall.fontSize};
      `,
      error: css`
        color: ${theme.colors.error.text};
        font-size: ${theme.typography.bodySmall.fontSize};
        font-family: ${theme.typography.fontFamilyMonospace};
      `,
      valid: css`
        color: ${theme.colors.success.text};
      `,
      info: css`
        color: ${theme.colors.text.secondary};
      `,
    };
  }, [theme]);

  const [state, validateQuery] = useAsyncFn(
    async (q: BigQueryQueryNG) => {
      if (!q.location || q.rawSql.trim() === '') {
        return null;
      }
      return await apiClient.validateQuery(q.location, q.rawSql);
    },
    [apiClient]
  );

  const [,] = useDebounce(
    async () => {
      if ((prevQuery && !shallowCompare(query, prevQuery)) || !validationResult) {
        const result = await validateQuery(query);
        if (result) {
          setValidationResult(result);
        }
      }
      return null;
    },
    200,
    [query, validateQuery]
  );

  useEffect(() => {
    if (validationResult?.isError) {
      onValidate(false);
    }
    if (validationResult?.isValid) {
      onValidate(true);
    }
  }, [validationResult, onValidate]);

  if (!state.value && !state.loading) {
    return null;
  }

  return (
    <div className={styles.container}>
      {state.loading && (
        <div className={styles.info}>
          <Spinner inline={true} size={12} /> Validating query...
        </div>
      )}
      {!state.loading && state.value && (
        <>
          <>
            {state.value.isValid && state.value.statistics && (
              <div className={styles.valid}>
                <Icon name="check" /> This query will process{' '}
                <strong>{formattedValueToString(valueFormatter(state.value.statistics.TotalBytesProcessed))}</strong>{' '}
                when run.
              </div>
            )}
          </>

          <>{state.value.isError && <div className={styles.error}>{state.value.error}</div>}</>
        </>
      )}
    </div>
  );
}
