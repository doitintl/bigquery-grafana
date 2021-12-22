package driver

import (
	"context"
	"database/sql/driver"
	"encoding/base64"
	"fmt"
	"reflect"
	"strings"
	"time"

	"cloud.google.com/go/bigquery"
	bq "cloud.google.com/go/bigquery"
	"github.com/grafana/grafana-bigquery-datasource/pkg/bigquery/types"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"google.golang.org/api/iterator"
)

type Dataset interface {
	// Create creates a dataset in the BigQuery service. An error will be returned if the
	// dataset already exists. Pass in a DatasetMetadata value to configure the dataset.
	Create(ctx context.Context, md *bigquery.DatasetMetadata) (err error)
	// Delete deletes the dataset.  Delete will fail if the dataset is not empty.
	Delete(ctx context.Context) (err error)
	// DeleteWithContents deletes the dataset, as well as contained resources.
	DeleteWithContents(ctx context.Context) (err error)
	// Metadata fetches the metadata for the dataset.
	Metadata(ctx context.Context) (md *bigquery.DatasetMetadata, err error)
	// Update modifies specific Dataset metadata fields.
	// To perform a read-modify-write that protects against intervening reads,
	// set the etag argument to the DatasetMetadata.ETag field from the read.
	// Pass the empty string for etag for a "blind write" that will always succeed.
	Update(ctx context.Context, dm bigquery.DatasetMetadataToUpdate, etag string) (md *bigquery.DatasetMetadata, err error)
	// Table creates a handle to a BigQuery table in the dataset.
	// To determine if a table exists, call Table.Metadata.
	// If the table does not already exist, use Table.Create to create it.
	Table(tableID string) *bigquery.Table
	// Tables returns an iterator over the tables in the Dataset.
	Tables(ctx context.Context) *bigquery.TableIterator
	// Model creates a handle to a BigQuery model in the dataset.
	// To determine if a model exists, call Model.Metadata.
	// If the model does not already exist, you can create it via execution
	// of a CREATE MODEL query.
	Model(modelID string) *bigquery.Model
	// Models returns an iterator over the models in the Dataset.
	Models(ctx context.Context) *bigquery.ModelIterator
	// Routine creates a handle to a BigQuery routine in the dataset.
	// To determine if a routine exists, call Routine.Metadata.
	Routine(routineID string) *bigquery.Routine
	// Routines returns an iterator over the routines in the Dataset.
	Routines(ctx context.Context) *bigquery.RoutineIterator
}

type Conn struct {
	cfg    *types.ConnectionSettings
	client *bigquery.Client
	bad    bool
	closed bool
}

func namedValueToValue(named []driver.NamedValue) ([]driver.Value, error) {
	args := make([]driver.Value, len(named))
	for n, param := range named {
		if len(param.Name) > 0 {
			return nil, fmt.Errorf("driver does not support the use of Named Parameters")
		}
		args[n] = param.Value
	}
	return args, nil
}

func prepareQuery(query string, args []driver.Value) (out string, err error) {
	if len(args) > 0 {
		for _, arg := range args {
			switch value := arg.(type) {
			case string:
				query = strings.Replace(query, "?", fmt.Sprintf("'%s'", value), 1)
			case int, int64, int8, int32, int16:
				query = strings.Replace(query, "?", fmt.Sprintf("%d", value), 1)
			case float32, float64:
				query = strings.Replace(query, "?", fmt.Sprintf("%f", value), 1)
			case time.Time:
				query = strings.Replace(query, "?", fmt.Sprintf("'%s'", value.Format("2006-01-02T15:04:05Z07:00")), 1)
			case bool:
				query = strings.Replace(query, "?", fmt.Sprintf("%t", value), 1)
			case []byte:
				if len(value) == 0 {
					query = strings.Replace(query, "?", "NULL", 1)
				} else {
					data64 := base64.StdEncoding.EncodeToString(value)
					query = strings.Replace(query, "?", fmt.Sprintf("FROM_BASE64('%s')", data64), 1)
				}
			default:
				log.DefaultLogger.Info("unknown type: %s", reflect.TypeOf(value).String())
				query = strings.Replace(query, "?", fmt.Sprintf("'%s'", value), 1)
			}

		}
		out = query

	} else {
		out = query
	}
	return
}

// Deprecated: Drivers should implement ExecerContext instead.
func (c *Conn) Exec(query string, args []driver.Value) (res driver.Result, err error) {
	return c.execContext(context.Background(), query, args)
}

func (c *Conn) ExecContext(ctx context.Context, query string, args []driver.NamedValue) (driver.Result, error) {
	_args, err := namedValueToValue(args)
	if err != nil {
		return nil, err
	}
	return c.execContext(ctx, query, _args)
}

func (c *Conn) execContext(ctx context.Context, query string, args []driver.Value) (res driver.Result, err error) {
	if query, err = prepareQuery(query, args); err != nil {
		return nil, err
	}

	q := c.client.Query(query)
	// q.DefaultProjectID = c.cfg.Project // allows omitting project in table reference
	// q.DefaultDatasetID = c.cfg.Dataset // allows omitting dataset in table reference

	it, err := q.Read(ctx)
	if err != nil {
		return nil, err
	}

	for {
		var row []bigquery.Value
		err := it.Next(&row)
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
	}

	res = &result{
		rowsAffected: int64(it.TotalRows),
	}

	return
}

// NewConn returns a connection for this Config
func NewConn(ctx context.Context, cfg types.ConnectionSettings, client *bq.Client) (c *Conn, err error) {
	c = &Conn{
		cfg: &cfg,
	}

	// c.client, err = bigquery.NewClient(ctx, cfg.Project, option.WithHTTPClient(client))
	c.client = client

	// if err != nil {
	// 	return nil, err
	// }
	return
}

type BigQueryConnector struct {
	Info       map[string]string
	Client     *bigquery.Client
	settings   types.ConnectionSettings
	connection *Conn
	bqClient   *bq.Client
}

func NewConnector(settings types.ConnectionSettings, client *bq.Client) *BigQueryConnector {
	return &BigQueryConnector{settings: settings, bqClient: client}
}

func (c *BigQueryConnector) Connect(ctx context.Context) (driver.Conn, error) {
	conn, err := NewConn(ctx, c.settings, c.bqClient)

	if err != nil {
		return nil, err
	}
	c.connection = conn

	return conn, nil
}

func (c *BigQueryConnector) Driver() driver.Driver {
	return &Driver{}
}

// Ping the BigQuery service and make sure it's reachable
func (c *Conn) Ping(ctx context.Context) (err error) {
	q := c.client.Query("SELECT 1")

	q.QueryConfig.DryRun = true
	job, err := q.Run(ctx)

	if err != nil {
		log.DefaultLogger.Info("Failed to connect with BigQuery")
		return
	}

	log.DefaultLogger.Info("Successful Ping", job.LastStatus().State)
	return
}

// Deprecated: Drivers should implement QueryerContext instead.
func (c *Conn) Query(query string, args []driver.Value) (rows driver.Rows, err error) {
	return c.queryContext(context.Background(), query, args)
}

func (c *Conn) QueryContext(ctx context.Context, query string, args []driver.NamedValue) (driver.Rows, error) {
	log.DefaultLogger.Info("QueryContext")
	_args, err := namedValueToValue(args)
	if err != nil {
		return nil, err
	}
	return c.queryContext(ctx, query, _args)
}

func (c *Conn) queryContext(ctx context.Context, query string, args []driver.Value) (driver.Rows, error) {
	q := c.client.Query(query)

	// q.DefaultProjectID = c.cfg.Project // allows omitting project in table reference
	// q.DefaultDatasetID = c.cfg.Dataset // allows omitting dataset in table reference

	rowsIterator, err := q.Read(ctx)
	if err != nil {
		return nil, err
	}

	res := &rows{
		rs:   resultSet{},
		conn: c,
	}
	for _, column := range rowsIterator.Schema {
		res.columns = append(res.columns, column.Name)
		res.fieldSchemas = append(res.fieldSchemas, column)
		res.types = append(res.types, fmt.Sprintf("%v", column.Type))
	}
	for {
		var row []bigquery.Value
		err := rowsIterator.Next(&row)
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		res.rs.data = append(res.rs.data, row)
	}

	return res, nil
}

// Prepare is stubbed out and not used
func (c *Conn) Prepare(query string) (stmt driver.Stmt, err error) {
	stmt = NewStmt(query, c)
	return
}

// Begin  is stubbed out and not used
func (c *Conn) Begin() (driver.Tx, error) {
	return newTx(c)
}

// Close closes the connection
func (c *Conn) Close() (err error) {
	if c.closed {
		return nil
	}
	if c.bad {
		return driver.ErrBadConn
	}
	c.closed = true
	return c.client.Close()
}
