import React from 'react';
import { Alert } from '@grafana/ui';
import { TEST_IDS } from 'utils/testIds';

export const ConfigurationHelp = () => {
  return (
    <Alert
      data-testid={TEST_IDS.helpBox}
      title={`How to configure Google BigQuery datasource?`}
      severity="info"
      bottomSpacing={4}
    >
      <div>
        <p>There are two ways to authenticate the BigQuery plugin:</p>
        <ul style={{ padding: 'revert' }}>
          <li>By uploading Google Service Account key</li>
          <li>
            By automatically retrieving credentials from the Google metadata server{' '}
            <em>(only available when running Grafana on a GCE virtual machine)</em>
          </li>
        </ul>
        <hr />
        <h5>Uploading Google Service Account key</h5>
        <p>
          <a
            className="external-link"
            rel="noreferrer"
            href="https://cloud.google.com/iam/docs/creating-managing-service-accounts"
            target="_blank"
          >
            Create a Google Cloud Platform (GCP) Service Account
          </a>{' '}
          or the Project you want to show data. The <strong>BigQuery Data Viewer</strong> role and the{' '}
          <strong>Job User</strong> role provide all the permissions that Grafana needs.{' '}
          <a
            className="external-link"
            rel="noreferrer"
            target="_blank"
            href="https://console.cloud.google.com/apis/library/bigquery.googleapis.com"
          >
            BigQuery API
          </a>{' '}
          has to be enabled on GCP for the data source to work.
          <br />
          Find instructions on how to create a Service Account{' '}
          <a
            className="external-link"
            rel="noreferrer"
            target="_blank"
            href="https://doitintl.github.io/bigquery-grafana/"
          >
            here
          </a>
          .
        </p>
        <br />
        <h5>Using GCE Default Service Account</h5>
        <p>
          When Grafana is running on a Google Compute Engine (GCE) virtual machine, it is possible for Grafana to
          automatically retrieve the default project id and authentication token from the metadata server. For this to
          work, you need to make sure that you have a service account that is setup as the default account for the
          virtual machine and that the service account has been given read access to the BigQuery API.
        </p>
        <br />
        <p>
          <strong>
            Note that, Grafana data source integrates with a single GCP project. If you need to visualize data from
            multiple GCP projects, create one data source per GCP project.
          </strong>
        </p>
      </div>
    </Alert>
  );
};
