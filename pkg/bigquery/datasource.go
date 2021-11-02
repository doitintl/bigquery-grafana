package bigquery

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"sync"

	bq "cloud.google.com/go/bigquery"
	"github.com/grafana/grafana-bigquery-datasource/pkg/bigquery/api"
	_ "github.com/grafana/grafana-bigquery-datasource/pkg/bigquery/driver"
	"github.com/grafana/grafana-bigquery-datasource/pkg/bigquery/types"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/grafana/grafana-plugin-sdk-go/data/sqlutil"
	"github.com/grafana/sqlds/v2"
	"github.com/pkg/errors"
	"google.golang.org/api/option"
)

type BigqueryDatasourceIface interface {
	sqlds.Driver
	Datasets(ctx context.Context, options sqlds.Options) ([]string, error)
	Tables(ctx context.Context, options sqlds.Options) ([]string, error)
	TableSchema(ctx context.Context, options sqlds.Options) (*types.TableMetadataResponse, error)
}

type BigQueryDatasource struct {
	apiClients sync.Map
	config     sync.Map
}

type ConnectionArgs struct {
	Project  string `json:"project,omitempty"`
	Dataset  string `json:"dataset,omitempty"`
	Table    string `json:"table,omitempty"`
	Location string `json:"location,omitempty"`
}

func New() *BigQueryDatasource {
	return &BigQueryDatasource{}
}

func (s *BigQueryDatasource) Connect(config backend.DataSourceInstanceSettings, queryArgs json.RawMessage) (*sql.DB, error) {
	log.DefaultLogger.Info("Connecting to BigQuery")
	settings, err := LoadSettings(config)
	if err != nil {
		return nil, err
	}
	s.config.Store(config.ID, settings)

	args, err := parseConnectionArgs(queryArgs)
	if err != nil {
		return nil, err
	}

	connectionString, err := getDSN(settings, args)

	if err != nil {
		return nil, err
	}

	db, err := sql.Open("bigquery", connectionString)

	if err != nil {
		return nil, errors.WithMessage(err, "Failed to connect to database. Is the hostname and port correct?")
	}

	return db, nil

}

func (s *BigQueryDatasource) Converters() (sc []sqlutil.Converter) {
	return sc
}

func (s *BigQueryDatasource) FillMode() *data.FillMissing {
	return &data.FillMissing{
		Mode: data.FillModeNull,
	}
}

func (s *BigQueryDatasource) Settings(_ backend.DataSourceInstanceSettings) sqlds.DriverSettings {
	return sqlds.DriverSettings{
		FillMode: &data.FillMissing{
			Mode: data.FillModeNull,
		},
	}
}

func (s *BigQueryDatasource) Datasets(ctx context.Context, options sqlds.Options) ([]string, error) {
	project, location := options["project"], options["location"]
	apiClient, err := s.getApi(ctx, project, location)
	if err != nil {
		return nil, errors.WithMessage(err, "Failed to retrieve BigQuery API client")
	}

	return apiClient.ListDatasets(ctx)
}

func (s *BigQueryDatasource) Tables(ctx context.Context, options sqlds.Options) ([]string, error) {
	project, dataset, location := options["project"], options["dataset"], options["location"]
	apiClient, err := s.getApi(ctx, project, location)

	if err != nil {
		return nil, errors.WithMessage(err, "Failed to retrieve BigQuery API client")
	}

	return apiClient.ListTables(ctx, dataset)
}

func (s *BigQueryDatasource) TableSchema(ctx context.Context, options sqlds.Options) (*types.TableMetadataResponse, error) {
	project, dataset, table, location := options["project"], options["dataset"], options["table"], options["location"]
	apiClient, err := s.getApi(ctx, project, location)
	if err != nil {
		return nil, errors.WithMessage(err, "Failed to retrieve BigQuery API client")
	}

	return apiClient.GetTableSchema(ctx, dataset, table)

}

func (s *BigQueryDatasource) getApi(ctx context.Context, project, location string) (*api.API, error) {
	datasourceID := getDatasourceID(ctx)
	clientId := fmt.Sprintf("%d/%s", datasourceID, project)
	settings, exists := s.config.Load(datasourceID)

	if !exists {
		return nil, fmt.Errorf("no settings for datasource: %d", datasourceID)
	}

	client, exists := s.apiClients.Load(clientId)

	if exists {
		if location != "" {
			client.(*api.API).SetLocation(location)
		} else {
			client.(*api.API).SetLocation(settings.(BigQuerySettings).ProcessingLocation)
		}
		return client.(*api.API), nil
	}

	credentials := Credentials{
		Type:        "service_account",
		ClientEmail: settings.(BigQuerySettings).ClientEmail,
		PrivateKey:  settings.(BigQuerySettings).PrivateKey,
		TokenURI:    settings.(BigQuerySettings).TokenUri,
		ProjectID:   project,
	}
	creds, err := json.Marshal(credentials)

	if err != nil {
		return nil, errors.WithMessage(err, "Invalid service account")
	}

	client, err = bq.NewClient(ctx, project, option.WithCredentialsJSON([]byte(creds)))

	if err != nil {
		return nil, errors.WithMessage(err, "Failed to initialize BigQuery client")
	}
	apiInstance := api.New(client.(*bq.Client))

	if location != "" {
		apiInstance.SetLocation(location)
	} else {
		apiInstance.SetLocation(settings.(BigQuerySettings).ProcessingLocation)
	}
	s.apiClients.Store(clientId, apiInstance)

	return apiInstance, nil

}

func getDatasourceID(ctx context.Context) int64 {
	plugin := httpadapter.PluginConfigFromContext(ctx)
	return plugin.DataSourceInstanceSettings.ID
}

func parseConnectionArgs(queryArgs json.RawMessage) (*ConnectionArgs, error) {
	args := &ConnectionArgs{}
	if queryArgs != nil {
		err := json.Unmarshal(queryArgs, args)
		if err != nil {
			return nil, fmt.Errorf("error reading query params: %s", err.Error())
		}
	}
	return args, nil
}
