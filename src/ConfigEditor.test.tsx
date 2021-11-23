import React, { useState } from 'react';
import { DataSourceSettings } from '@grafana/data';
import { render, screen, fireEvent } from '@testing-library/react';
import { BigQueryConfigEditor } from './ConfigEditor';
import { BigQueryOptions, BigQuerySecureJsonData, GoogleAuthType } from './types';
import { TEST_IDS } from './utils/testIds';

const TOKEN_MOCK = `{
  "type": "service_account",
  "project_id": "test-project",
  "private_key_id": "private_key_id",
  "private_key": "private_key",
  "client_email": "test@grafana.com",
  "client_id": "id",
  "auth_uri": "url",
  "token_uri": "url",
  "auth_provider_x509_cert_url": "url",
  "client_x509_cert_url": "url"
}
`;

describe('ConfigEditor', () => {
  it('renders help box', () => {
    render(
      <BigQueryConfigEditor
        options={
          {
            jsonData: {},
          } as DataSourceSettings<BigQueryOptions, BigQuerySecureJsonData>
        }
        onOptionsChange={() => {}}
      />
    );

    expect(screen.queryByTestId(TEST_IDS.helpBox)).toBeInTheDocument();
  });

  it('renders drop zone by default', () => {
    render(
      <BigQueryConfigEditor
        options={
          {
            jsonData: {},
          } as DataSourceSettings<BigQueryOptions, BigQuerySecureJsonData>
        }
        onOptionsChange={() => {}}
      />
    );

    expect(screen.queryByTestId(TEST_IDS.dropZone)).toBeInTheDocument();
  });

  it('renders JWT paste area when button clicked', () => {
    const { getByTestId } = render(
      <BigQueryConfigEditor
        options={
          {
            jsonData: {},
          } as DataSourceSettings<BigQueryOptions, BigQuerySecureJsonData>
        }
        onOptionsChange={() => {}}
      />
    );
    const pasteButton = getByTestId(TEST_IDS.pasteJwtButton);
    fireEvent.click(pasteButton);

    expect(screen.queryByTestId(TEST_IDS.pasteArea)).toBeInTheDocument();
    expect(screen.queryByTestId(TEST_IDS.dropZone)).not.toBeInTheDocument();
  });

  it('renders JWT form when token is pasted', () => {
    const { getByTestId } = render(
      <WrapInState
        defaultOptions={
          {
            jsonData: {},
          } as DataSourceSettings<BigQueryOptions, BigQuerySecureJsonData>
        }
      >
        {({ options, setOptions }) => {
          return <BigQueryConfigEditor options={options} onOptionsChange={setOptions} />;
        }}
      </WrapInState>
    );
    const pasteButton = getByTestId(TEST_IDS.pasteJwtButton);
    fireEvent.click(pasteButton);

    const pasteArea = getByTestId(TEST_IDS.pasteArea);
    expect(pasteArea).toBeInTheDocument();

    fireEvent.change(pasteArea, { target: { value: TOKEN_MOCK } });
    fireEvent.blur(pasteArea);

    expect(screen.queryByTestId(TEST_IDS.dropZone)).not.toBeInTheDocument();
    expect(screen.queryByTestId(TEST_IDS.jwtForm)).toBeInTheDocument();
  });

  it('renders drop zone on JWT token reset', () => {
    const { getByTestId } = render(
      <WrapInState
        defaultOptions={
          {
            jsonData: {
              clientEmail: 'test@grafana.com',
              tokenUri: 'https://accounts.google.com/o/oauth2/token',
              defaultProject: 'test-project',
            },
            secureJsonFields: {
              privateKey: true,
            },
          } as unknown as DataSourceSettings<BigQueryOptions, BigQuerySecureJsonData>
        }
      >
        {({ options, setOptions }) => {
          return <BigQueryConfigEditor options={options} onOptionsChange={setOptions} />;
        }}
      </WrapInState>
    );

    expect(screen.queryByTestId(TEST_IDS.jwtForm)).toBeInTheDocument();
    expect(screen.queryByTestId(TEST_IDS.dropZone)).not.toBeInTheDocument();
    expect(screen.queryByTestId(TEST_IDS.pasteArea)).not.toBeInTheDocument();

    const resetButton = getByTestId(TEST_IDS.resetJwtButton);
    fireEvent.click(resetButton);

    expect(screen.queryByTestId(TEST_IDS.jwtForm)).not.toBeInTheDocument();
    expect(screen.queryByTestId(TEST_IDS.pasteArea)).not.toBeInTheDocument();
    expect(screen.queryByTestId(TEST_IDS.dropZone)).toBeInTheDocument();
  });

  it('renders JWT form when data is provided', () => {
    render(
      <BigQueryConfigEditor
        options={
          {
            jsonData: {
              clientEmail: 'test@grafana.com',
              tokenUri: 'https://accounts.google.com/o/oauth2/token',
              defaultProject: 'test-project',
            },
            secureJsonFields: {
              privateKey: true,
            },
          } as unknown as DataSourceSettings<BigQueryOptions, BigQuerySecureJsonData>
        }
        onOptionsChange={() => {}}
      />
    );

    expect(screen.queryByTestId(TEST_IDS.jwtForm)).toBeInTheDocument();
    expect(screen.queryByTestId(TEST_IDS.pasteArea)).not.toBeInTheDocument();
    expect(screen.queryByTestId(TEST_IDS.dropZone)).not.toBeInTheDocument();
  });

  it('resets service account credentials when changing auth type', () => {
    const onOptionsChangeSpy = jest.fn();

    const { getByLabelText } = render(
      <BigQueryConfigEditor
        options={
          {
            jsonData: {
              authenticationType: GoogleAuthType.JWT,
              clientEmail: 'test@grafana.com',
              tokenUri: 'https://accounts.google.com/o/oauth2/token',
              defaultProject: 'test-project',
            },
          } as unknown as DataSourceSettings<BigQueryOptions, BigQuerySecureJsonData>
        }
        onOptionsChange={onOptionsChangeSpy}
      />
    );

    const gceAuthButton = getByLabelText(TEST_IDS.authTypeButtonGCE);
    fireEvent.click(gceAuthButton);

    expect(onOptionsChangeSpy).toHaveBeenCalledWith({
      jsonData: { authenticationType: GoogleAuthType.GCE },
      secureJsonData: {},
    });
  });
});

interface WrapInStateChildrenProps {
  options: DataSourceSettings<BigQueryOptions, BigQuerySecureJsonData>;
  setOptions: (options: DataSourceSettings<BigQueryOptions, BigQuerySecureJsonData>) => void;
}

interface WrapInStateProps {
  defaultOptions: DataSourceSettings<BigQueryOptions, BigQuerySecureJsonData>;
  children: (props: WrapInStateChildrenProps) => JSX.Element;
}

const WrapInState = ({ defaultOptions, children }: WrapInStateProps) => {
  const [options, setOptions] = useState(defaultOptions);
  return children({ options, setOptions });
};
