package bigquery

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strconv"
	"sync"

	bq "cloud.google.com/go/bigquery"
	"github.com/grafana/grafana-bigquery-datasource/pkg/bigquery/api"
	"github.com/grafana/grafana-bigquery-datasource/pkg/bigquery/driver"
	"github.com/grafana/grafana-bigquery-datasource/pkg/bigquery/types"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/grafana/grafana-plugin-sdk-go/data/sqlutil"
	"github.com/grafana/sqlds/v2"
	"github.com/pkg/errors"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/option"
)

var PluginConfigFromContext = httpadapter.PluginConfigFromContext

type BigqueryDatasourceIface interface {
	sqlds.Driver
	GetGCEDefaultProject(ctx context.Context) (string, error)
	Datasets(ctx context.Context, args DatasetsArgs) ([]string, error)
	TableSchema(ctx context.Context, args TableSchemaArgs) (*types.TableMetadataResponse, error)
	ValidateQuery(ctx context.Context, args ValidateQueryArgs) (*api.ValidateQueryResponse, error)
}

type conn struct {
	db     *sql.DB
	driver *driver.Driver
}

type bqServiceFactory func(ctx context.Context, projectID string, opts ...option.ClientOption) (*bq.Client, error)

type BigQueryDatasource struct {
	connections sync.Map
	apiClients  sync.Map
	bqFactory   bqServiceFactory
}

type ConnectionArgs struct {
	Dataset  string `json:"dataset,omitempty"`
	Table    string `json:"table,omitempty"`
	Location string `json:"location,omitempty"`
}

func New() *BigQueryDatasource {
	return &BigQueryDatasource{
		bqFactory: bq.NewClient,
	}
}

func (s *BigQueryDatasource) Connect(config backend.DataSourceInstanceSettings, queryArgs json.RawMessage) (*sql.DB, error) {
	log.DefaultLogger.Debug("Connecting to BigQuery")

	settings, err := LoadSettings(&config)
	if err != nil {
		return nil, err
	}

	args, err := parseConnectionArgs(queryArgs)
	if err != nil {
		return nil, err
	}

	connectionSettings := getConnectionSettings(settings, args)

	if settings.AuthenticationType == "gce" {
		defaultProject, err := s.GetGCEDefaultProject(context.Background())
		if err != nil {
			return nil, errors.WithMessage(err, "Failed to retrieve default GCE project")
		}
		connectionSettings.Project = defaultProject
	}

	connectionKey := fmt.Sprintf("%d/%s:%s", config.ID, connectionSettings.Location, connectionSettings.Project)

	c, exists := s.connections.Load(connectionKey)

	if exists {
		connection := c.(conn)
		if !connection.driver.Closed() {
			log.DefaultLogger.Debug("Reusing existing connection to BigQuery")
			return connection.db, nil
		}
	} else {
		log.DefaultLogger.Debug("Creating new connection to BigQuery")
	}

	aC, exists := s.apiClients.Load(connectionKey)

	// If we have already instantiated API client for given connection details then reuse it's underlying big query
	// client for db connection.
	if exists {
		dr, db, err := driver.Open(connectionSettings, aC.(*api.API).Client)
		if err != nil {
			return nil, errors.WithMessage(err, "Failed to connect to database")
		}
		s.connections.Store(connectionKey, conn{db: db, driver: dr})
		return db, nil
	} else {
		client, err := newHTTPClient(settings, httpclient.Options{})
		if err != nil {
			return nil, errors.WithMessage(err, "Failed to crate http client")
		}

		bqClient, err := s.bqFactory(context.Background(), connectionSettings.Project, option.WithHTTPClient(client))
		if err != nil {
			return nil, errors.WithMessage(err, "Failed to crate BigQuery client")
		}

		dr, db, err := driver.Open(connectionSettings, bqClient)

		if err != nil {
			return nil, errors.WithMessage(err, "Failed to connect to database")
		}
		s.connections.Store(connectionKey, conn{db: db, driver: dr})

		apiInstance := api.New(bqClient)
		apiInstance.SetLocation(connectionSettings.Location)

		if err != nil {
			return nil, errors.WithMessage(err, "Failed to create BigQuery API client")
		}
		s.apiClients.Store(connectionKey, apiInstance)
		return db, nil
	}

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

func (s *BigQueryDatasource) GetGCEDefaultProject(ctx context.Context) (string, error) {
	defaultCredentials, err := google.FindDefaultCredentials(ctx, "https://www.googleapis.com/auth/bigquery")
	if err != nil {
		return "", fmt.Errorf("failed to retrieve default project from GCE metadata server: %w", err)
	}
	token, err := defaultCredentials.TokenSource.Token()
	if err != nil {
		return "", fmt.Errorf("failed to retrieve GCP credential token: %w", err)
	}
	if !token.Valid() {
		return "", errors.New("failed to validate GCP credentials")
	}

	return defaultCredentials.ProjectID, nil
}

type DatasetsArgs struct {
	Project  string `json:"project"`
	Location string `json:"location"`
}

func (s *BigQueryDatasource) Datasets(ctx context.Context, options DatasetsArgs) ([]string, error) {
	apiClient, err := s.getApi(ctx, options.Project, options.Location)
	if err != nil {
		return nil, errors.WithMessage(err, "Failed to retrieve BigQuery API client")
	}

	return apiClient.ListDatasets(ctx)
}

type TablesArgs struct {
	Project  string `json:"project"`
	Location string `json:"location"`
	Dataset  string `json:"dataset"`
}

// sqlds.Completable interface
func (s *BigQueryDatasource) Schemas(ctx context.Context, options sqlds.Options) ([]string, error) {
	return nil, nil
}

// sqlds.Completable interface
func (s *BigQueryDatasource) Tables(ctx context.Context, options sqlds.Options) ([]string, error) {
	args := TablesArgs{
		Project:  options["project"],
		Dataset:  options["dataset"],
		Location: options["location"],
	}

	if args.Project == "" || args.Dataset == "" || args.Location == "" {
		return nil, errors.New("project, dataset and location must be specified")
	}

	apiClient, err := s.getApi(ctx, args.Project, args.Location)

	if err != nil {
		return nil, errors.WithMessage(err, "Failed to retrieve BigQuery API client")
	}

	return apiClient.ListTables(ctx, args.Dataset)
}

// sqlds.Completable interface
func (s *BigQueryDatasource) Columns(ctx context.Context, options sqlds.Options) ([]string, error) {
	args := TableSchemaArgs{
		Project:  options["project"],
		Dataset:  options["dataset"],
		Table:    options["table"],
		Location: options["location"],
	}

	if args.Project == "" || args.Dataset == "" || args.Location == "" || args.Table == "" {
		return nil, errors.New("missing required arguments")
	}

	apiClient, err := s.getApi(ctx, args.Project, args.Location)

	if err != nil {
		return nil, errors.WithMessage(err, "Failed to retrieve BigQuery API client")
	}

	isOrderableString := options["isOrderable"]
	isOrderable, err := strconv.ParseBool(isOrderableString)

	if err != nil {
		return nil, errors.WithMessage(err, "Failed to parse isOrderable")
	}

	return apiClient.ListColumns(ctx, args.Dataset, args.Table, isOrderable)
}

type ValidateQueryArgs struct {
	Project   string            `json:"project"`
	Location  string            `json:"location"`
	Query     sqlds.Query       `json:"query"`
	TimeRange backend.TimeRange `json:"range"`
}

func (s *BigQueryDatasource) ValidateQuery(ctx context.Context, options ValidateQueryArgs) (*api.ValidateQueryResponse, error) {
	apiClient, err := s.getApi(ctx, options.Project, options.Location)

	if err != nil {
		return nil, errors.WithMessage(err, "Failed to retrieve BigQuery API client")
	}

	query, err := sqlds.Interpolate(s, &options.Query)

	if err != nil {
		return nil, errors.WithMessage(err, "Could not apply macros")
	}

	return apiClient.ValidateQuery(ctx, query), nil
}

type TableSchemaArgs struct {
	Project  string `json:"project"`
	Location string `json:"location"`
	Dataset  string `json:"dataset"`
	Table    string `json:"table"`
}

func (s *BigQueryDatasource) TableSchema(ctx context.Context, args TableSchemaArgs) (*types.TableMetadataResponse, error) {
	apiClient, err := s.getApi(ctx, args.Project, args.Location)
	if err != nil {
		return nil, errors.WithMessage(err, "Failed to retrieve BigQuery API client")
	}

	return apiClient.GetTableSchema(ctx, args.Dataset, args.Table)
}

func (s *BigQueryDatasource) getApi(ctx context.Context, project, location string) (*api.API, error) {
	datasourceSettings := getDatasourceSettings(ctx)
	connectionKey := fmt.Sprintf("%d/%s:%s", datasourceSettings.ID, location, project)
	cClient, exists := s.apiClients.Load(connectionKey)

	if exists {
		log.DefaultLogger.Debug("Reusing existing BigQuery API client")
		return cClient.(*api.API), nil
	}

	settings, err := LoadSettings(datasourceSettings)
	if err != nil {
		return nil, err
	}

	httpClient, err := newHTTPClient(settings, httpclient.Options{})

	if err != nil {
		return nil, errors.WithMessage(err, "Failed to crate http client")
	}

	client, err := s.bqFactory(ctx, project, option.WithHTTPClient(httpClient))
	if err != nil {
		return nil, errors.WithMessage(err, "Failed to initialize BigQuery client")
	}
	apiInstance := api.New(client)

	if location != "" {
		apiInstance.SetLocation(location)
	} else {
		apiInstance.SetLocation(settings.ProcessingLocation)
	}

	s.apiClients.Store(connectionKey, apiInstance)

	return apiInstance, nil

}

func getDatasourceSettings(ctx context.Context) *backend.DataSourceInstanceSettings {
	plugin := PluginConfigFromContext(ctx)
	return plugin.DataSourceInstanceSettings
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
