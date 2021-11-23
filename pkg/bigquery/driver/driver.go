package driver

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"fmt"
	"sync"

	bq "cloud.google.com/go/bigquery"
	"github.com/grafana/grafana-bigquery-datasource/pkg/bigquery/types"
)

const (
	ConnectionStringEnvKey = "BIGQUERY_CONNECTION_STRING"
)

var (
	openFromSessionMutex sync.Mutex
	openFromSessionCount int
)

type Driver struct {
	connector *BigQueryConnector
	bqClient  *bq.Client
	settings  types.ConnectionSettings
}

func (d *Driver) Open(_ string) (c driver.Conn, err error) {
	connector, err := d.OpenConnector()
	if err != nil {
		return
	}
	connection, err := connector.Connect(context.Background())
	if err != nil {
		return nil, err
	}

	d.connector = connector

	return connection, nil
}

func (d *Driver) OpenConnector() (c *BigQueryConnector, err error) {
	return NewConnector(d.settings, d.bqClient), nil
}

func (d *Driver) Closed() bool {
	return d.connector == nil || d.connector.connection.closed
}

// Open registers a new driver with a unique name
func Open(settings types.ConnectionSettings, bqClient *bq.Client) (*Driver, *sql.DB, error) {
	openFromSessionMutex.Lock()
	openFromSessionCount++
	name := fmt.Sprintf("%s-%d", "bigquery", openFromSessionCount)
	openFromSessionMutex.Unlock()

	d := &Driver{
		bqClient: bqClient,
		settings: settings,
	}
	sql.Register(name, d)
	db, err := sql.Open(name, "")

	return d, db, err
}
