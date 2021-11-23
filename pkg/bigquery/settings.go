package bigquery

import (
	"encoding/json"
	"fmt"

	"github.com/grafana/grafana-bigquery-datasource/pkg/bigquery/types"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// Settings - data loaded from grafana settings database

type Credentials struct {
	Type        string `json:"type"`
	ProjectID   string `json:"project_id"`
	ClientEmail string `json:"client_email"`
	PrivateKey  string `json:"private_key"`
	TokenURI    string `json:"token_uri"`
}

// LoadSettings will read and validate Settings from the DataSourceConfg
func LoadSettings(config *backend.DataSourceInstanceSettings) (types.BigQuerySettings, error) {
	settings := types.BigQuerySettings{}
	if err := json.Unmarshal(config.JSONData, &settings); err != nil {
		return settings, fmt.Errorf("could not unmarshal DataSourceInfo json: %w", err)
	}

	settings.PrivateKey = config.DecryptedSecureJSONData["privateKey"]
	settings.DatasourceId = config.ID
	settings.Updated = config.Updated

	if settings.ProcessingLocation == "" {
		settings.ProcessingLocation = "US"
	}

	return settings, nil
}

func getConnectionSettings(settings types.BigQuerySettings, queryArgs *ConnectionArgs) types.ConnectionSettings {
	connectionSettings := types.ConnectionSettings{
		Project:            settings.DefaultProject,
		Location:           settings.ProcessingLocation,
		AuthenticationType: settings.AuthenticationType,
	}

	if queryArgs.Location != "" {
		connectionSettings.Location = queryArgs.Location
	}

	if queryArgs.Dataset != "" {
		connectionSettings.Dataset = queryArgs.Dataset
	}

	return connectionSettings
}
