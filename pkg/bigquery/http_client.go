package bigquery

import (
	"fmt"
	"net/http"

	"github.com/grafana/grafana-bigquery-datasource/pkg/bigquery/types"
	"github.com/grafana/grafana-google-sdk-go/pkg/tokenprovider"
	"github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
)

var bigqueryRoute = struct {
	path   string
	method string
	url    string
	scopes []string
}{
	path:   "bigquery",
	method: "GET",
	url:    "https://www.googleapis.com/auth/bigquery",
	scopes: []string{"https://www.googleapis.com/auth/bigquery",
		"https://www.googleapis.com/auth/bigquery.insertdata",
		"https://www.googleapis.com/auth/cloud-platform",
		"https://www.googleapis.com/auth/cloud-platform.read-only",
		"https://www.googleapis.com/auth/devstorage.full_control",
		"https://www.googleapis.com/auth/devstorage.read_only",
		"https://www.googleapis.com/auth/devstorage.read_write"},
}

func getMiddleware(settings types.BigQuerySettings) (httpclient.Middleware, error) {
	providerConfig := tokenprovider.Config{
		RoutePath:         bigqueryRoute.path,
		RouteMethod:       bigqueryRoute.method,
		DataSourceID:      settings.DatasourceId,
		DataSourceUpdated: settings.Updated,
		Scopes:            bigqueryRoute.scopes,
	}

	var provider tokenprovider.TokenProvider
	switch settings.AuthenticationType {
	case "gce":
		provider = tokenprovider.NewGceAccessTokenProvider(providerConfig)
	case "jwt":
		err := validateDataSourceSettings(settings)

		if err != nil {
			return nil, err
		}

		providerConfig.JwtTokenConfig = &tokenprovider.JwtTokenConfig{
			Email:      settings.ClientEmail,
			URI:        settings.TokenUri,
			PrivateKey: []byte(settings.PrivateKey),
		}
		provider = tokenprovider.NewJwtAccessTokenProvider(providerConfig)
	}

	return tokenprovider.AuthMiddleware(provider), nil
}

func newHTTPClient(settings types.BigQuerySettings, opts httpclient.Options) (*http.Client, error) {
	m, err := getMiddleware(settings)
	if err != nil {
		return nil, err
	}

	opts.Middlewares = append(opts.Middlewares, m)
	return httpclient.New(opts)
}

func validateDataSourceSettings(settings types.BigQuerySettings) error {
	if settings.DefaultProject == "" || settings.ClientEmail == "" || settings.PrivateKey == "" || settings.TokenUri == "" {
		return fmt.Errorf("datasource is missing authentication details")
	}

	return nil
}
