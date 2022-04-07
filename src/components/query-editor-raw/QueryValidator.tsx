import { css } from '@emotion/css';
import { formattedValueToString, getValueFormat, TimeRange } from '@grafana/data';
import { Icon, Spinner, useTheme2 } from '@grafana/ui';
import { BigQueryAPI, ValidationResults } from 'api';
import React, { useState, useMemo, useEffect } from 'react';
import { useAsyncFn } from 'react-use';
import useDebounce from 'react-use/lib/useDebounce';
import { BigQueryQueryNG } from 'types';

export interface QueryValidatorProps {
  apiClient: BigQueryAPI;
  query: BigQueryQueryNG;
  range?: TimeRange;
  onValidate: (isValid: boolean) => void;
}

export function QueryValidator({ apiClient, query, onValidate, range }: QueryValidatorProps) {
  const [validationResult, setValidationResult] = useState<ValidationResults | null>();
  const theme = useTheme2();
  const valueFormatter = useMemo(() => getValueFormat('bytes'), []);

  const styles = useMemo(() => {
    return {
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

      return await apiClient.validateQuery(q, range);
    },
    [apiClient]
  );

  const [,] = useDebounce(
    async () => {
      const result = await validateQuery(query);
      if (result) {
        setValidationResult(result);
      }

      return null;
    },
    1000,
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

  const error = state.value?.error ? processErrorMessage(state.value.error) : '';

  return (
    <>
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

          <>{state.value.isError && <div className={styles.error}>{error}</div>}</>
        </>
      )}
    </>
  );
}

function processErrorMessage(error: string) {
  const splat = error.split(':');
  if (splat.length > 2) {
    return splat.slice(2).join(':');
  }
  return error;
}
