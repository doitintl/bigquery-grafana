package bigquery

import (
	"fmt"
	"strings"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

func TestConnection_bigqueryConnectionString(t *testing.T) {
	defaultLocation := "us-west1"
	defaultProject := "foo"
	defaultDataset := "bar"

	config := backend.DataSourceInstanceSettings{
		JSONData: []byte(fmt.Sprintf(
			`{"defaultProject":"%s","defaultDataset":"%s","processingLocation":"%s"}`,
			defaultProject,
			defaultDataset,
			defaultLocation,
		),
		),
	}

	tests := []struct {
		description              string
		args                     *ConnectionArgs
		expectedSettings         *BigQuerySettings
		expectedConnectionString string
	}{
		{
			description:              "it retrieves default settings",
			args:                     &ConnectionArgs{},
			expectedConnectionString: "bigquery://foo/us-west1/bar?credentials=",
		},
		{
			description:              "it modifies project",
			args:                     &ConnectionArgs{Project: "project"},
			expectedConnectionString: "bigquery://project/us-west1/bar?credentials=",
		},
		{
			description:              "it modifies dataset",
			args:                     &ConnectionArgs{Dataset: "dataset"},
			expectedConnectionString: "bigquery://foo/us-west1/dataset?credentials=",
		},
		{
			description:              "it modifies location",
			args:                     &ConnectionArgs{Location: "location"},
			expectedConnectionString: "bigquery://foo/location/bar?credentials=",
		},
	}

	for _, tt := range tests {
		t.Run(tt.description, func(t *testing.T) {
			defaultSettings, err := LoadSettings(config)

			if err != nil {
				t.Fatalf("unexpected error %v", err)
			}
			connectionString, err := getDSN(defaultSettings, tt.args)

			if err != nil {
				t.Fatalf("unexpected error %v", err)
			}

			idx := strings.Index(connectionString, "=")
			connectionPath := connectionString[0 : idx+1]

			if !cmp.Equal(connectionPath, tt.expectedConnectionString) {
				t.Errorf("unexpected result: %v", cmp.Diff(connectionPath, tt.expectedConnectionString))
			}

		})
	}
}
