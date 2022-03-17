# Google BigQuery data source for Grafana

The Google BigQuery data source plugin allows you to query and visualize Google BigQuery data from within Grafana.

## Beta

This plugin is currently in Beta development and subject to change.

## Install the plugin

1. Navigate to [BigQuery](https://grafana.com/grafana/plugins/grafana-bigquery-datasource/) plugin homepage.
2. From the left-hand menu, click the **Install plugin** button.

   The **Installation** tab is displayed.

### Verify that the plugin is installed

1. In Grafana, navigate to **Configuration** > **Data sources**.
2. From the top-right corner, click the **Add data source** button.
3. Search for Google BigQuery in the search field, and hover over the Google BigQuery search result.
4. Click the **Select** button for Google BigQuery. If you can click the **Select** button, then it is installed.

## Configure the Google BigQuery data source in Grafana

Follow [these instructions](https://grafana.com/docs/grafana/latest/datasources/add-a-data-source/) to add a new Google BigQuery data source, and enter configuration options:

### Authentication

Google BigQuery datasource provides two ways of authentication:

- By uploading Google Service Account key
- By automatically retrieving credentials from the Google Metadata Server (only available when running Grafana on a GCE virtual machine)

#### Google Service Account authentication

[Create a Google Cloud Platform (GCP) Service Account](https://cloud.google.com/iam/docs/creating-managing-service-accounts). The BigQuery Data Viewer role and the Job User role provide all the permissions that Grafana needs. [BigQuery API](https://console.cloud.google.com/apis/library/bigquery.googleapis.com) has to be enabled on GCP for the data source to work.

#### Google metadata server

When Grafana is running on a Google Compute Engine (GCE) virtual machine, it is possible for the Google BigQuery datasource to automatically retrieve the default project id and authentication token from the metadata server. For this to work, you need to make sure that you have a service account that is setup as the default account for the virtual machine and that the service account has been given read access to the BigQuery API.

### Provisioning

It is possible to configure data sources using configuration files with Grafana’s provisioning system. To read about how it works, including and all the settings that you can set for this data source, refer to [Provisioning Grafana data sources](https://grafana.com/docs/grafana/latest/administration/provisioning/#data-sources).

Below you will find some provisioning examples

#### Using service account

```yaml
# config file version
apiVersion: 1

datasources:
  - name: BigQuery DS
    type: grafana-bigquery-datasource
    editable: true
    enabled: true
    jsonData:
      authenticationType: jwt
      clientEmail: your-client-email
      defaultProject: your-default-bigquery-project
      tokenUri: https://oauth2.googleapis.com/token
    secureJsonData:
      privateKey: your-private-key
```

#### Using Google Metadata Server

```yaml
# config file version
apiVersion: 1

datasources:
  - name: BigQuery DS
    type: grafana-bigquery-datasource
    editable: true
    enabled: true
    jsonData:
      authenticationType: gce
```

## Query the data source

The query editor allows you to query Google BigQuery datasource. Queries can contain macros which simplify syntax and allow for dynamic parts.

### Query as time series

Time series visualization options are selectable after adding [`TIMESTAMP`](https://cloud.google.com/bigquery/docs/reference/standard-sql/data-types#timestamp_type) field to your query. This field will be used as the timestamp. You can select time series visualization using the visualization options. Grafana interprets timestamp rows without explicit time zone as UTC. Any column except time is treated as a value column.

### Query as table

Table visualizations will always be available for any valid Google BigQuery query.

### Macros

To simplify syntax and to allow for dynamic parts, like date range filters, the query can contain macros.

Here is an example of a query with a macro that will use Grafana's time filter:

```sql
SELECT
      time_column,
      value_column,
FROM project.dataset.table
WHERE $__timeFilter(time_column)
```

| Macro example                         | Description                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| _$\_\_timeFilter(timeColumn)_         | Will be replaced by a time range filter using the specified name.                  |
| _$\_\_from_                           | Will be replaced by the start of the currently active time range filter selection. |
| _$\_\_to_                             | Will be replaced by the end of the currently active time range filter selection.   |
| _$\_\_timeGroup(timeColumn,interval)_ | Will be replaced by an expression usable in GROUP BY clause.                       |

### Templates and variables

To add a new Google BigQuery query variable, refer to [Add a query variable](https://grafana.com/docs/grafana/latest/variables/variable-types/add-query-variable/).

After creating a variable, you can use it in your Google BigQuery queries by using [Variable syntax](https://grafana.com/docs/grafana/latest/variables/syntax/). For more information about variables, refer to [Templates and variables](https://grafana.com/docs/grafana/latest/variables/).

## Learn more

- Add [Annotations](https://grafana.com/docs/grafana/latest/dashboards/annotations/).
- Configure and use [Templates and variables](https://grafana.com/docs/grafana/latest/variables/).
- Add [Transformations](https://grafana.com/docs/grafana/latest/panels/transformations/).
- Set up alerting; refer to [Alerts overview](https://grafana.com/docs/grafana/latest/alerting/).
