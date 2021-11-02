package main

import (
	"os"

	"github.com/grafana/grafana-bigquery-datasource/pkg/bigquery"
	"github.com/grafana/grafana-bigquery-datasource/pkg/bigquery/routes"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/sqlds/v2"
)

func main() {

	// Start listening to requests send from Grafana. This call is blocking so
	// it wont finish until Grafana shutsdown the process or the plugin choose
	// to exit close down by itself
	log.DefaultLogger.Info("Starting BQ plugin")

	s := bigquery.New()
	ds := sqlds.NewDatasource(s)
	ds.EnableMultipleConnections = true
	ds.CustomRoutes = routes.New(s).Routes()
	if err := datasource.Manage(
		"grafana-bigquery-datasource",
		ds.NewDatasource,
		datasource.ManageOpts{},
	); err != nil {
		log.DefaultLogger.Error(err.Error())
		os.Exit(1)
	}
}
