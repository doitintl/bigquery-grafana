import React from 'react';
import { Button, Field, Input, Tooltip } from '@grafana/ui';
import { BigQueryOptions } from 'types';
import { TEST_IDS } from 'utils/testIds';

interface JWTFormProps {
  options: BigQueryOptions;
  onReset: () => void;
  onChange: (key: keyof BigQueryOptions) => (e: React.SyntheticEvent<HTMLInputElement | HTMLSelectElement>) => void;
}
export const JWTForm: React.FC<JWTFormProps> = ({ options, onReset, onChange }) => {
  return (
    <div data-testid={TEST_IDS.jwtForm}>
      <Field label="Project ID">
        {/* @ts-ignore */}
        <Input
          id="defaultProject"
          width={60}
          value={options.defaultProject || ''}
          onChange={onChange('defaultProject')}
        />
      </Field>

      <Field label="Client email">
        {/* @ts-ignore */}
        <Input width={60} id="clientEmail" value={options.clientEmail || ''} onChange={onChange('clientEmail')} />
      </Field>

      <Field label="Token URI">
        {/* @ts-ignore */}
        <Input width={60} id="tokenUri" value={options.tokenUri || ''} onChange={onChange('tokenUri')} />
      </Field>

      <Field label="Private key" disabled>
        {/* @ts-ignore */}
        <Input
          width={60}
          id="privateKey"
          readOnly
          placeholder="Private key configured"
          addonAfter={
            <Tooltip content="Click to clear the uploaded JWT token and upload a new one">
              <Button data-testid={TEST_IDS.resetJwtButton} icon="sync" size="xs" onClick={onReset} fill="outline">
                Reset token
              </Button>
            </Tooltip>
          }
        />
      </Field>
    </div>
  );
};
