![GitHub stars](https://img.shields.io/github/stars/doitintl/bigquery-grafana.svg?style=plastic)
![GitHub forks](https://img.shields.io/github/forks/doitintl/bigquery-grafana.svg?style=plastic)
# BigQuery datasource for Grafana 4.6+

ClickHouse datasource plugin provides a support for [BigQuery](https://cloud.google.com/bigquery/) as a backend database.  

### Quick start
Install from [grafana.net](https://grafana.net/plugins/doitintl-bigquery-datasource)

OR

Copy files to your [Grafana plugin directory](http://docs.grafana.org/plugins/installation/#grafana-plugin-directory). Restart Grafana, check datasources list at http://your.grafana.instance/datasources/new, choose BigQuery option.

## Adding the data source to Grafana

1. Open the side menu by clicking the Grafana icon in the top header.
2. In the side menu under the `Dashboards` link you should find a link named `Data Sources`.
3. Click the `+ Add data source` button in the top header.
4. Select `BigQuery` from the _Type_ dropdown.
5. Upload or paste in the Service Account Key file. See below for steps on how to create a Service Account Key file.

> NOTE: If you're not seeing the `Data Sources` link in your side menu it means that your current user does not have the `Admin` role for the current organization.

| Name                  | Description                                                                         |
| --------------------- | ----------------------------------------------------------------------------------- |
| _Name_                | The datasource name. This is how you refer to the datasource in panels & queries.   |
| _Default_             | Default datasource means that it will be pre-selected for new panels.               |
| _Service Account Key_ | Service Account Key File for a GCP Project. Instructions below on how to create it. |

## Authentication

There are two ways to authenticate the BigQuery plugin - either by uploading a Google JWT file, or by automatically retrieving credentials from Google metadata server. The latter option is only available when running Grafana on GCE virtual machine.

### Using a Google Service Account Key File

To authenticate with the BigQuery API, you need to create a Google Cloud Platform (GCP) Service Account for the Project you want to show data for. A Grafana datasource integrates with one GCP Project. If you want to visualize data from multiple GCP Projects then you can give the service account permissions in each project or  create one datasource per GCP Project.

#### Enable APIs

The following APIs need to be enabled first:

* [BigQuery API](https://console.cloud.google.com/apis/library/bigquery-json.googleapis.com)


Click on the links above and click the `Enable` button:

![Enable GCP APIs](bigquery_enable_api.png)

