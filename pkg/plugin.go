package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"

	"cloud.google.com/go/bigquery"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"

	"golang.org/x/oauth2/jwt"
)

type QueryModel struct {
	Format string `json:"format"`
	// Constant			string `json:"constant"`
	Dataset string `json:"dataset"`
	// Group            []Group `json:"group"`
	MetricColumn     string `json:"metricColumn"`
	OrderByCol       string/*int32*/ `json:"orderByCol"`
	OrderBySort      string/*int32*/ `json:"orderBySort"`
	Partitioned      bool   `json:"partitioned"`
	PartitionedField string `json:"partitionedField"`
	ProjectID        string `json:"project"`
	RawQuery         bool   `json:"rawQuery"`
	RawSQL           string `json:"rawSql"`
	RefID            string `json:"refId"`
	// Select           []string `json:"select"`
	Sharded        bool   `json:"sharded"`
	Table          string `json:"table"`
	TimeColumn     string `json:"timeColumn"`
	TimeColumnType string `json:"timeColumnType"`
	Location       string `json:"location"`
	// Where            []string `json:"where"`
}

// JSONData holds the req.PluginContext.DataSourceInstanceSettings.JSONData struct
type JSONData struct {
	AuthenticationType string `json:"authenticationType"`
	ClientEmail        string `json:"clientEmail"`
	DefaultProject     string `json:"defaultProject"`
	ProcessingLocation string `json:"processingLocation"`
	QueryPriority      string `json:"queryPriority"`
	TokenURI           string `json:"tokenUri"`
}

// BigQueryResult represents a full resultset.
// because the results are row based and the grafana api expects columnar values it is easier
// to first collect all the values then map that to the grafana expected format
type BigQueryResult struct {
	Schema bigquery.Schema
	Rows   []map[string]bigquery.Value
}

type instanceSettings struct {
	httpClient *http.Client
}

// BigQueryDatasource is an example datasource used to scaffold
// new datasource plugins with an backend.
type BigQueryDatasource struct {
	// The instance manager can help with lifecycle management
	// of datasource instances in plugins. It's not a requirements
	// but a best practice that we recommend that you follow.
	im instancemgmt.InstanceManager
}

// newDatasource returns datasource.ServeOpts.
func newDatasource() datasource.ServeOpts {
	// creates a instance manager for your plugin. The function passed
	// into `NewInstanceManger` is called when the instance is created
	// for the first time or when a datasource configuration changed.
	im := datasource.NewInstanceManager(newDataSourceInstance)
	ds := &BigQueryDatasource{
		im: im,
	}

	return datasource.ServeOpts{
		QueryDataHandler:   ds,
		CheckHealthHandler: ds,
	}
}

// QueryData handles multiple queries and returns multiple responses.
// req contains the queries []DataQuery (where each query contains RefID as a unique identifer).
// The QueryDataResponse contains a map of RefID to the response for each query, and each response
// contains Frames ([]*Frame).
func (td *BigQueryDatasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	// create response struct
	response := backend.NewQueryDataResponse()

	// loop over queries and execute them individually.
	for _, q := range req.Queries {
		res := td.query(ctx, q, req)
		// save the response in a hashmap
		// based on with RefID as identifier
		response.Responses[q.RefID] = res
	}

	return response, nil
}

// Define regex to add $__timeFilter support
var timeFilterRegex *regexp.Regexp = regexp.MustCompile("\\$__timeFilter\\((.*?)\\)")

func getTypeArray(typ string) interface{} {
	log.DefaultLogger.Debug("getTypeArray", "type", typ)
	switch t := typ; t {
	case "TIMESTAMP":
		return []time.Time{}
	case "INTEGER":
		return []int64{}
	case "FLOAT":
		return []float64{}
	default:
		return []string{}
	}
}

func toValue(val interface{}, typ string) interface{} {
	if val == nil {
		switch typ {
		case "STRING":
			return ""
		case "INTEGER":
			return 0
		case "FLOAT":
			return 0.0
		default:
			return nil;
		}
	}
	switch t := val.(type) {
	case float32, time.Time, string, int64, float64, bool, int16, int8:
		return t
	case int:
		return int64(t)
	default:
		r, err := json.Marshal(val)
		if err != nil {
			log.DefaultLogger.Info("Marshalling failed ", "err", err)
		}
		return string(r)
	}
}

func (td *BigQueryDatasource) query(ctx context.Context, query backend.DataQuery, req *backend.QueryDataRequest) backend.DataResponse {
	response := backend.DataResponse{}

	// Unmarshal the json into our queryModel
	var queryModel QueryModel
	response.Error = json.Unmarshal(query.JSON, &queryModel)
	if response.Error != nil {
		return response
	}

	// full resultset from the query
	var bigQueryResult *BigQueryResult
	bigQueryResult, response.Error = td.executeQuery(ctx, queryModel, query, req)
	if response.Error != nil {
		return response
	}

	// create data frame response
	frame := data.NewFrame("response")

	// new fields, time, metric, value
	for _, c := range bigQueryResult.Schema {
		log.DefaultLogger.Info("Adding Column", "name", c.Name, "type", c.Type)
		frame.Fields = append(frame.Fields,
			data.NewField(c.Name, nil, getTypeArray(string(c.Type))),
		)
	}

	// new fields, time's value, value's name and value's value
	for _, row := range bigQueryResult.Rows {
		// New map each iteration
		vals := make([]interface{}, 0)
		for _, c := range bigQueryResult.Schema {
			vals = append(vals, toValue(row[c.Name], string(c.Type)))
		}
		log.DefaultLogger.Debug(fmt.Sprintf("Adding vals, %v", vals...))
		frame.AppendRow(vals...)
	}

	// create a wide frame to support multi-series
	var wideFrame *data.Frame
	wideFrame, response.Error = data.LongToWide(frame, nil)

	if response.Error != nil {
		return response
	}

	response.Frames = append(response.Frames, wideFrame)
	return response
}

// CheckHealth handles health checks sent from Grafana to the plugin.
// The main use case for these health checks is the test button on the
// datasource configuration page which allows users to verify that
// a datasource is working as expected.
func (td *BigQueryDatasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	var status = backend.HealthStatusOk
	var message = "Data source is working"

	return &backend.CheckHealthResult{
		Status:  status,
		Message: message,
	}, nil
}

func newDataSourceInstance(setting backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	return &instanceSettings{
		httpClient: &http.Client{},
	}, nil
}

func (s *instanceSettings) Dispose() {}

// ExecuteQuery executes the query against BigQuery and returns an result iterator
func (td *BigQueryDatasource) executeQuery(ctx context.Context, queryModel QueryModel, originalQuery backend.DataQuery, req *backend.QueryDataRequest) (*BigQueryResult, error) {
	if !queryModel.RawQuery {
		return nil, errors.New("alerting queries only support raw sql")
	}

	// unmarshal the values provided by the datasource configuration
	var jsonData JSONData
	err := json.Unmarshal(req.PluginContext.DataSourceInstanceSettings.JSONData, &jsonData)
	if err != nil {
		return nil, err
	}

	// ensure a projectID is available
	projectID := jsonData.DefaultProject
	if projectID == "" {
		projectID = queryModel.ProjectID
	}
	if projectID == "" {
		return nil, errors.New("expected 'query.ProjectID' or 'req.PluginContext.DataSourceInstanceSettings.JSONData.defaultProject' to be set")
	}

	// ensure a location is available
	location := jsonData.ProcessingLocation
	if location == "" {
		location = queryModel.Location
	}
	if location == "" {
		return nil, errors.New("expected 'query.Location' or 'req.PluginContext.DataSourceInstanceSettings.JSONData.processingLocation' to be set")
	}

	// the client is going to be created depending on AuthenticationType
	var client *bigquery.Client

	switch jsonData.AuthenticationType {
	case "gce":
		client, err = bigquery.NewClient(ctx, projectID)
		if err != nil {
			log.DefaultLogger.Error("bigquery.NewClient", err)
			return nil, err
		}
	case "jwt":
		// test validity of required JSONData
		if jsonData.ClientEmail == "" {
			return nil, errors.New("expected req.PluginContext.DataSourceInstanceSettings.JSONData.clientEmail' to be set")
		}
		if jsonData.TokenURI == "" {
			return nil, errors.New("expected req.PluginContext.DataSourceInstanceSettings.JSONData.tokenUri' to be set")
		}

		// test validity of required DecryptedSecureJSONData
		privateKey, ok := req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData["privateKey"]
		if !ok {
			return nil, errors.New("expected 'req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData.privateKey' to be set")
		}

		conf := &jwt.Config{
			Email:      jsonData.ClientEmail,
			PrivateKey: []byte(privateKey),
			Scopes: []string{
				"https://www.googleapis.com/auth/bigquery",
			},
			TokenURL: jsonData.TokenURI,
		}

		// create the client
		client, err = bigquery.NewClient(ctx, projectID, option.WithHTTPClient(conf.Client(ctx)))
		if err != nil {
			log.DefaultLogger.Error("bigquery.NewClient", err)
			return nil, err
		}
	default:
		return nil, fmt.Errorf("unimplemented authenticationType '%s'", jsonData.AuthenticationType)
	}
	defer client.Close()

	// ensure we have a query to run
	if queryModel.RawSQL == "" {
		return nil, errors.New("expected 'req.PluginContext.DataSourceInstanceSettings.JSONData.rawSql' to be set")
	}

	// substituteVariables replaces any placeholder variables
	sql := substituteVariables(queryModel.RawSQL, originalQuery)
	log.DefaultLogger.Debug(fmt.Sprintf("query: %s\n", sql))

	// create the query
	query := client.Query(sql)
	query.Location = location

	// Run the query
	job, err := query.Run(ctx)
	if err != nil {
		log.DefaultLogger.Error("*bigquery.Query.Run", err)
		return nil, err
	}
	log.DefaultLogger.Debug("*bigquery.Query.Run", job.ID())
	status, err := job.Wait(ctx)
	if err != nil {
		log.DefaultLogger.Error("*bigquery.Job.Wait", err)
		return nil, err
	}
	if err := status.Err(); err != nil {
		log.DefaultLogger.Error("*bigquery.JobStatus", err)
		return nil, err
	}
	rowIterator, err := job.Read(ctx)
	if err != nil {
		log.DefaultLogger.Error("*bigquery.Job.Read", err)
		return nil, err
	}

	// create a structure to collect all the results
	rows := make([]map[string]bigquery.Value, 0)
	for {
		var row map[string]bigquery.Value
		err := rowIterator.Next(&row)
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.DefaultLogger.Error("*bigquery.RowIterator.Next", err)
			return nil, err
		}
		rows = append(rows, row)
	}

	return &BigQueryResult{rowIterator.Schema, rows}, nil
}

// substituteVariables replaces standard grafana variables in an input string and returns the result
func substituteVariables(sql string, originalQuery backend.DataQuery) string {
	// __from
	sql = strings.Replace(sql, "${__from}", fmt.Sprintf("%d", originalQuery.TimeRange.From.UnixNano()/int64(time.Millisecond)), -1)
	sql = strings.Replace(sql, "${__from:date}", originalQuery.TimeRange.From.Format(time.RFC3339), -1)
	sql = strings.Replace(sql, "${__from:date:iso}", originalQuery.TimeRange.From.Format(time.RFC3339), -1)
	sql = strings.Replace(sql, "${__from:date:seconds}", fmt.Sprintf("%d", originalQuery.TimeRange.From.Unix()), -1)
	sql = strings.Replace(sql, "${__from:date:YYYY-MM}", originalQuery.TimeRange.From.Format("2006-01"), -1)
	sql = strings.Replace(sql, "${__from:date:YYYY-MM-DD}", originalQuery.TimeRange.From.Format("2006-01-02"), -1)

	// __to
	sql = strings.Replace(sql, "${__to}", fmt.Sprintf("%d", originalQuery.TimeRange.To.UnixNano()/int64(time.Millisecond)), -1)
	sql = strings.Replace(sql, "${__to:date}", originalQuery.TimeRange.To.Format(time.RFC3339), -1)
	sql = strings.Replace(sql, "${__to:date:iso}", originalQuery.TimeRange.To.Format(time.RFC3339), -1)
	sql = strings.Replace(sql, "${__to:date:seconds}", fmt.Sprintf("%d", originalQuery.TimeRange.To.Unix()), -1)
	sql = strings.Replace(sql, "${__to:date:YYYY-MM}", originalQuery.TimeRange.To.Format("2006-01"), -1)
	sql = strings.Replace(sql, "${__to:date:YYYY-MM-DD}", originalQuery.TimeRange.To.Format("2006-01-02"), -1)

	// __timeFormat
	match := timeFilterRegex.FindStringSubmatch(sql)
	if match != nil {
		sql = timeFilterRegex.ReplaceAllString(sql, fmt.Sprintf("%s BETWEEN '%s' AND '%s'",
			match[1], originalQuery.TimeRange.From.UTC().Format(time.RFC3339Nano),
			originalQuery.TimeRange.To.UTC().Format(time.RFC3339Nano)))
	}
	return sql
}
