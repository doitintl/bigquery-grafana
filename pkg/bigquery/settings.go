package bigquery

import (
	b64 "encoding/base64"
	"encoding/json"
	"fmt"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/pkg/errors"
)

// Settings - data loaded from grafana settings database
type BigQuerySettings struct {
	ClientEmail        string `json:"clientEmail"`
	DefaultProject     string `json:"defaultProject"`
	DefaultDataset     string `json:"defaultDataset"`
	FlatRateProject    string `json:"flatRateProject"`
	TokenUri           string `json:"tokenUri"`
	QueryPriority      string `json:"queryPriority"`
	ProcessingLocation string `json:"processingLocation"`

	// Saved in secure JSON
	PrivateKey string `json:"-"`
}

type Credentials struct {
	Type        string `json:"type"`
	ProjectID   string `json:"project_id"`
	ClientEmail string `json:"client_email"`
	PrivateKey  string `json:"private_key"`
	TokenURI    string `json:"token_uri"`
}

// LoadSettings will read and validate Settings from the DataSourceConfg
func LoadSettings(config backend.DataSourceInstanceSettings) (BigQuerySettings, error) {
	settings := BigQuerySettings{}

	if err := json.Unmarshal(config.JSONData, &settings); err != nil {
		return settings, fmt.Errorf("could not unmarshal DataSourceInfo json: %w", err)
	}

	settings.PrivateKey = config.DecryptedSecureJSONData["privateKey"]

	return settings, nil
}

func getDSN(settings BigQuerySettings, queryArgs *ConnectionArgs) (string, error) {
	credentials := Credentials{
		Type:        "service_account",
		ClientEmail: settings.ClientEmail,
		PrivateKey:  settings.PrivateKey,
		TokenURI:    settings.TokenUri,
		ProjectID:   settings.DefaultProject,
	}

	if queryArgs.Project != "" {
		credentials.ProjectID = queryArgs.Project
	}

	creds, err := json.Marshal(credentials)

	if err != nil {
		return "", errors.WithMessage(err, "Invalid service account")
	}

	encodedCredentials := b64.StdEncoding.EncodeToString([]byte(creds))

	location := settings.ProcessingLocation
	if queryArgs.Location != "" {
		location = queryArgs.Location
	}

	dataset := settings.DefaultDataset
	if queryArgs.Dataset != "" {
		dataset = queryArgs.Dataset
	}

	project := settings.DefaultProject
	if queryArgs.Project != "" {
		project = queryArgs.Project
	}

	return fmt.Sprintf("bigquery://%s/%s/%s?credentials=%s", project, location, dataset, encodedCredentials), nil

}
