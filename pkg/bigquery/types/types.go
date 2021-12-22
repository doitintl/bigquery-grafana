package types

import (
	"time"

	bq "cloud.google.com/go/bigquery"
)

type BigQuerySettings struct {
	DatasourceId       int64  `json:"datasourceId"`
	ClientEmail        string `json:"clientEmail"`
	DefaultProject     string `json:"defaultProject"`
	FlatRateProject    string `json:"flatRateProject"`
	TokenUri           string `json:"tokenUri"`
	QueryPriority      string `json:"queryPriority"`
	ProcessingLocation string `json:"processingLocation"`
	Updated            time.Time
	AuthenticationType string `json:"authenticationType"`

	// Saved in secure JSON
	PrivateKey string `json:"-"`
}

type ConnectionSettings struct {
	AuthenticationType string
	Location           string
	Project            string
	Dataset            string
}
type TableFieldSchema struct {
	Name        string       `json:"name"`
	Description string       `json:"description,omitempty"`
	Type        bq.FieldType `json:"type"`
	Repeated    bool         `json:"repeated"`
	Schema      TableSchema  `json:"schema,omitempty"`
}

type TableSchema []*TableFieldSchema

type TableMetadataResponse struct {
	Schema TableSchema `json:"schema,omitempty"`
}
