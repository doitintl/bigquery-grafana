package types

import (
	bq "cloud.google.com/go/bigquery"
)

type TableFieldSchema struct {
	Name        string       `json:"name"`
	Description string       `json:"description,omitempty"`
	Type        bq.FieldType `json:"type"`
	Schema      TableSchema  `json:"schema,omitempty"`
}

type TableSchema []*TableFieldSchema

type TableMetadataResponse struct {
	Schema TableSchema `json:"schema,omitempty"`
}
