[![GitHub stars](https://img.shields.io/github/stars/doitintl/bigquery-grafana.svg?style=svg)](https://github.com/doitintl/bigquery-grafana/stargazers)
![GitHub forks](https://img.shields.io/github/forks/doitintl/bigquery-grafana.svg?style=svg)
[![Automated Release Notes by gren](https://img.shields.io/badge/%F0%9F%A4%96-release%20notes-00B2EE.svg)](https://github-tools.github.io/github-release-notes/)

## Status: Production Ready

# BigQuery DataSource for Grafana

A BigQuery DataSource plugin provides support for [BigQuery](https://cloud.google.com/bigquery/) as a backend database.

### Quick Start

There are multiple ways to install bigquery-grafana. See [INSTALL](https://doitintl.github.io/bigquery-grafana/INSTALL) for more information.

### Features:

- Query setup
- Raw SQL editor
- Query builder
- Macros support
- Additional functions
- Table view
- Annotations
- BQ queries in variables
- Sharded tables (`tablename_YYYYMMDD`)
- Partitioned Tables
- Granular slot allocation (Running queries in a project with flat-rate pricing)

**Plugin Demo:**

![plugin demo](https://raw.githubusercontent.com/doitintl/bigquery-grafana/master/img/grafana-bigquery-demo.gif)

## Adding the DataSource to Grafana

1. Open the side menu by clicking the Grafana icon in the top header.
2. In the side menu under `Dashboards` you should find a link named `Data Sources`.
3. Click the `+ Add data source` button in the top header.
4. Select `BigQuery` from the _Type_ dropdown.
5. Upload or paste in the Service Account Key file. See below for steps on how to create a Service Account Key file.

> NOTE: If you're not seeing the `Data Sources` link in your side menu it means that your current user does not have the `Admin` role for the current organization.

| Name                  | Description                                                                         |
| --------------------- | ----------------------------------------------------------------------------------- |
| _Name_                | The datasource name. This is how you refer to the datasource in panels & queries.   |
| _Default_             | Default datasource means that it will be pre-selected for new panels.               |
| _Service Account Key_ | Service Account Key File for a GCP Project. Instructions below on how to create it. |

### Set query priority

You can now set query priority "INTERACTIVE" or "BATCH" per datasouce
![](https://raw.githubusercontent.com/doitintl/bigquery-grafana/master/img/QueryPriority.png)

### Example of Provisioning a File

You can manage DataSource via [provisioning system](https://grafana.com/docs/administration/provisioning/#datasources). See the example below of a configuration file.

```
apiVersion: 1

datasources:
- name: <Datasource Name>
  type: doitintl-bigquery-datasource
  access: proxy
  isDefault: true
  jsonData:
       authenticationType: jwt
       clientEmail: <Service Account Email>
       defaultProject: <Default Project Name>
       tokenUri: https://oauth2.googleapis.com/token
  secureJsonData:
       privateKey: |
          -----BEGIN PRIVATE KEY-----
           <Content of the Private Key>
          -----END PRIVATE KEY-----
  version: 2
  readOnly: false
```

## Authentication

There are two ways to authenticate the BigQuery plugin - either by uploading a Google JWT file, or by automatically retrieving credentials from Google's metadata server. The latter is only available when running Grafana on a GCE virtual machine.

### Using a Google Service Account Key File

To authenticate with the BigQuery API, you need to create a Google Cloud Platform (GCP) Service Account for the Project you want to show data for. A Grafana datasource integrates with one GCP Project. If you want to visualize data from multiple GCP Projects then you can give the service account permissions in each project or create one datasource per GCP Project.

#### Enable APIs

Go to [BigQuery API](https://console.cloud.google.com/apis/library/bigquery.googleapis.com) and `Enable` the API:

![Enable GCP APIs](https://raw.githubusercontent.com/doitintl/bigquery-grafana/master/img/bigquery_enable_api.png)

#### Create a GCP Service Account for a Project

1. Navigate to the [APIs & Services Credentials page](https://console.cloud.google.com/apis/credentials).
2. Click on `Create credentials` and choose `Service account key`.

   ![](https://raw.githubusercontent.com/doitintl/bigquery-grafana/master/img/createserviceaccountbutton.png)

3. On the `Create service account key` page, choose key type `JSON`. Then in the `Service Account` dropdown, choose the `New service account` option:

   ![](https://raw.githubusercontent.com/doitintl/bigquery-grafana/master/img/newserviceaccount.png)

4. Some new fields will appear. Fill in a name for the service account in the `Service account name` field and then choose the `BigQuery Data Viewer` and `BigQuery Job User` roles from the `Role` dropdown:

   ![](https://raw.githubusercontent.com/doitintl/bigquery-grafana/master/img/bq_service_account_choose_role.png)

5. Click the `Create` button. A JSON key file will be created and downloaded to your computer. Store this file in a secure place as it allows access to your BigQuery data.
6. Upload it to Grafana on the datasource Configuration page. You can either upload the file or paste in the contents of the file.

   ![](https://raw.githubusercontent.com/doitintl/bigquery-grafana/master/img/bq__grafana_upload_key.png)

7. The file contents will be encrypted and saved in the Grafana database. Don't forget to save after uploading the file!

   ![](https://raw.githubusercontent.com/doitintl/bigquery-grafana/master/img/bq_grafana_key_uploaded.png)

### Using GCE Default Service Account

If Grafana is running on a Google Compute Engine (GCE) virtual machine, it is possible for Grafana to automatically retrieve default credentials from the metadata server. This has the advantage of not needing to generate a private key file for the service account and also not having to upload the file to Grafana. However for this to work, there are a few preconditions that need to be met.

1. First of all, you need to create a Service Account that can be used by the GCE virtual machine. See detailed instructions on how to do that [here](https://cloud.google.com/compute/docs/access/create-enable-service-accounts-for-instances#createanewserviceaccount).
2. Make sure the GCE virtual machine instance is being run as the service account that you just created. See instructions [here](https://cloud.google.com/compute/docs/access/create-enable-service-accounts-for-instances#using).
3. Allow access to the `BigQuery API` scope. See instructions [here](https://cloud.google.com/compute/docs/access/create-enable-service-accounts-for-instances#changeserviceaccountandscopes).

Read more about creating and enabling service accounts for GCE VM instances [here](https://cloud.google.com/compute/docs/access/create-enable-service-accounts-for-instances).

### Using the Query Builder

The query builder provides a simple yet a user-friendly interface to help you quickly compose a query. The builder enables you to define the basic parts of your query, The common ones are:

1. The table you want to query from
2. The time field and metric field
3. WHERE clause - Either use one of the pre-defined macros, to speed your writing time, or set up your own expression. Existing supported Macros are:

   a. Macro $__timeFiler with last 7 days example:

```
  WHERE `createDate` BETWEEN TIMESTAMP_MILLIS (1592147699012) AND TIMESTAMP_MILLIS (1592752499012) AND _PARTITIONTIME >= '2020-06-14 18:14:59' AND _PARTITIONTIME < '2020-06-21 18:14:59'
```

b. Macro $__timeFrom with last 7 days example:

```
  WHERE `createDate` > TIMESTAMP_MILLIS (1592223758609)  AND _PARTITIONTIME >= '2020-06-15 15:22:38' AND _PARTITIONTIME < '2020-06-22 15:22:38'
```

c. Macro $__timeTo with last 7 days example:

```
  WHERE `createDate` < TIMESTAMP_MILLIS (1592828659681)  AND _PARTITIONTIME >= '2020-06-15 15:24:19' AND _PARTITIONTIME < '2020-06-22 15:24:19'
```

You can now use timeFilter macro in raw sql mode

4. GROUP BY option - You can use a pre-defined macro or use one of the fields from your query
   a. time ($__interval,none)
5. ORDER BY option

Note: If your processing location is not the Default US one set your location from the processing Location drop-down at the top right bottom of the query builder

### Troubleshooting

Viewing your Query

1.  Use The Query Inspector located at the top of the query builder
    ![](https://raw.githubusercontent.com/doitintl/bigquery-grafana/master/img/QueryInspector.png)
2.  The query Inspector enables you to see the clean query and troubleshoot SQL errors
    ![](https://raw.githubusercontent.com/doitintl/bigquery-grafana/master/img/InspectPanel.png)  
     The Query builder comes with a set of defaults which are control from the top of the Query Builder
    ![](https://raw.githubusercontent.com/doitintl/bigquery-grafana/master/img/QueryBuilder.png)

![](https://raw.githubusercontent.com/doitintl/bigquery-grafana/master/img/QueryOptions.png)

### Build

The build works with Yarn:

#### Development Build

```
yarn run build:dev
```

#### Production Build

```
yarn run build:prod
```

Tests can be run with Jest:

```
yarn run test
```

## Contributing

See the [Contribution Guide](https://doitintl.github.io/bigquery-grafana/CONTRIBUTING).

## License

See the [License File](https://doitintl.github.io/bigquery-grafana/LICENSE).
