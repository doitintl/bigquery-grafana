import {
  DataSourcePluginOptionsEditorProps,
  onUpdateDatasourceJsonDataOption,
  onUpdateDatasourceJsonDataOptionSelect,
} from '@grafana/data';
import { Field, FieldSet, Input, RadioButtonGroup, Select } from '@grafana/ui';

import React from 'react';
import { JWTConfigEditor } from './components/JWTConfigEditor';
import { JWTForm } from './components/JWTForm';
import { ConfigurationHelp } from './components/ConfigurationHelp';
import { DEFAULT_REGION, GOOGLE_AUTH_TYPE_OPTIONS, PROCESSING_LOCATIONS, QUERY_PRIORITIES } from './constants';
import { BigQueryOptions, BigQuerySecureJsonData, GoogleAuthType, QueryPriority } from './types';
import { getApiClient } from './api';

import { DatasetSelector } from 'components/DatasetSelector';

export type BigQueryConfigEditorProps = DataSourcePluginOptionsEditorProps<BigQueryOptions, BigQuerySecureJsonData>;

export const BigQueryConfigEditor: React.FC<BigQueryConfigEditorProps> = (props) => {
  const { options, onOptionsChange } = props;
  const { jsonData, secureJsonFields, secureJsonData } = options;
  const isJWT = jsonData.authenticationType === GoogleAuthType.JWT || jsonData.authenticationType === undefined;

  const hasJWTConfigured = Boolean(
    secureJsonFields &&
      secureJsonFields.privateKey &&
      jsonData.clientEmail &&
      jsonData.defaultProject &&
      jsonData.tokenUri
  );

  const onResetApiKey = () => {
    const nextSecureJsonData = { ...secureJsonData };
    const nextJsonData = { ...options.jsonData };

    delete nextJsonData.clientEmail;
    delete nextJsonData.defaultProject;
    delete nextJsonData.tokenUri;
    delete nextJsonData.defaultDataset;
    delete nextSecureJsonData.privateKey;

    onOptionsChange({
      ...options,
      secureJsonData: nextSecureJsonData,
      jsonData: nextJsonData,
    });
  };

  const onJWTFormChange = (key: keyof BigQueryOptions) => onUpdateDatasourceJsonDataOption(props, key);

  return (
    <>
      <ConfigurationHelp />

      <FieldSet label="Authentication">
        <Field label="Authentication type">
          <RadioButtonGroup
            options={GOOGLE_AUTH_TYPE_OPTIONS}
            value={jsonData.authenticationType || GoogleAuthType.JWT}
            onChange={(v) => {
              onOptionsChange({
                ...options,
                jsonData: { ...jsonData, authenticationType: v },
              });
            }}
          />
        </Field>
      </FieldSet>

      {isJWT && (
        <FieldSet label="JWT Key Details">
          {hasJWTConfigured ? (
            <JWTForm options={options.jsonData} onReset={onResetApiKey} onChange={onJWTFormChange} />
          ) : (
            <JWTConfigEditor
              onChange={(jwt) => {
                onOptionsChange({
                  ...options,
                  secureJsonFields: { ...secureJsonFields, privateKey: true },
                  secureJsonData: {
                    ...secureJsonData,
                    privateKey: jwt.privateKey,
                  },
                  jsonData: {
                    ...jsonData,
                    clientEmail: jwt.clientEmail,
                    defaultProject: jwt.projectId,
                    tokenUri: jwt.tokenUri,
                  },
                });
              }}
            />
          )}{' '}
        </FieldSet>
      )}

      <FieldSet label="Other settings">
        {jsonData.defaultProject && (
          <Field label="Default dataset">
            <DatasetSelector
              applyDefault
              apiClient={getApiClient(options.id)}
              value={jsonData.defaultDataset}
              location={jsonData.processingLocation || DEFAULT_REGION}
              projectId={jsonData.defaultProject}
              className="width-30"
              onChange={onUpdateDatasourceJsonDataOptionSelect(props, 'defaultDataset')}
            />
          </Field>
        )}
        <Field
          label="Flat rate project"
          description="The project that the Queries will be run in if you are using a flat-rate pricing model"
        >
          <Input
            className="width-30"
            value={jsonData.flatRateProject || ''}
            onChange={onUpdateDatasourceJsonDataOption(props, 'flatRateProject')}
          />
        </Field>

        <Field
          label="Processing location"
          description={
            <span>
              Read more about processing location{' '}
              <a
                href="https://cloud.google.com/bigquery/docs/locations"
                rel="noreferrer"
                className="external-link"
                target="_blank"
              >
                here
              </a>
            </span>
          }
        >
          <Select
            className="width-30"
            placeholder="Default US"
            value={jsonData.processingLocation || ''}
            options={PROCESSING_LOCATIONS}
            onChange={onUpdateDatasourceJsonDataOptionSelect(props, 'processingLocation')}
            menuShouldPortal={true}
          />
        </Field>

        <Field
          label="Query priority"
          description={
            <span>
              Read more about query priotities{' '}
              <a
                href="https://cloud.google.com/bigquery/docs/query-overview#types_of_queries"
                className="external-link"
                rel="noreferrer"
                target="_blank"
              >
                here
              </a>
            </span>
          }
        >
          <RadioButtonGroup
            options={QUERY_PRIORITIES}
            value={jsonData.queryPriority || QueryPriority.Interactive}
            onChange={(v) => {
              props.onOptionsChange({
                ...options,
                jsonData: { ...jsonData, queryPriority: v },
              });
            }}
          />
        </Field>
      </FieldSet>
    </>
  );
};
