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

type TimePartitioning struct {
	// Defines the partition interval type.  Supported values are "DAY" or "HOUR".
	Type bq.TimePartitioningType `json:"type,omitempty"`

	// The amount of time to keep the storage for a partition.
	// If the duration is empty (0), the data in the partitions do not expire.
	Expiration time.Duration `json:"expiration,omitempty"`

	// If empty, the table is partitioned by pseudo column '_PARTITIONTIME'; if set, the
	// table is partitioned by this field. The field must be a top-level TIMESTAMP or
	// DATE field. Its mode must be NULLABLE or REQUIRED.
	Field string `json:"field,omitempty"`

	// If set to true, queries that reference this table must specify a
	// partition filter (e.g. a WHERE clause) that can be used to eliminate
	// partitions. Used to prevent unintentional full data scans on large
	// partitioned tables.
	// DEPRECATED: use the top-level RequirePartitionFilter in TableMetadata.
	RequirePartitionFilter bool `json:"requirePartitionFilter,omitempty"`
}

type RangePartitioning struct {
	// The field by which the table is partitioned.
	// This field must be a top-level field, and must be typed as an
	// INTEGER/INT64.
	Field string `json:"field,omitempty"`
	// The details of how partitions are mapped onto the integer range.
	Range *bq.RangePartitioningRange `json:"range,omitempty"`
}

type TableMetadataResponse struct {
	Schema                 TableSchema       `json:"schema,omitempty"`
	TimePartitioning       TimePartitioning  `json:"timePartitioning,omitempty"`
	RangePartitioning      RangePartitioning `json:"rangePartitioning,omitempty"`
	RequirePartitionFilter bool              `json:"requirePartitionFilter,omitempty"`
}
