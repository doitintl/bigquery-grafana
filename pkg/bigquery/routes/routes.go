package routes

import (
	"encoding/json"
	"io"
	"io/ioutil"
	"net/http"

	"github.com/grafana/grafana-bigquery-datasource/pkg/bigquery"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter"
)

type ResourceHandler struct {
	ds bigquery.BigqueryDatasourceIface
}

func New(ds *bigquery.BigQueryDatasource) *ResourceHandler {
	return &ResourceHandler{ds: ds}
}

func (r *ResourceHandler) defaultProjects(rw http.ResponseWriter, req *http.Request) {
	p := httpadapter.PluginConfigFromContext(req.Context())
	s, err := bigquery.LoadSettings(p.DataSourceInstanceSettings)

	if err != nil {
		sendResponse(nil, err, rw)
	}

	if s.AuthenticationType == "gce" {
		res, err := r.ds.GetGCEDefaultProject(req.Context())
		sendResponse(res, err, rw)
	} else {
		sendResponse(s.DefaultProject, nil, rw)
	}
}

func (r *ResourceHandler) datasets(rw http.ResponseWriter, req *http.Request) {
	result := bigquery.DatasetsArgs{}
	err := parseBody(req.Body, &result)

	if err != nil {
		rw.WriteHeader(http.StatusBadRequest)
		write(rw, []byte(err.Error()))
		return
	}
	res, err := r.ds.Datasets(req.Context(), result)

	sendResponse(res, err, rw)
}

func (r *ResourceHandler) tables(rw http.ResponseWriter, req *http.Request) {
	result := bigquery.TablesArgs{}
	err := parseBody(req.Body, &result)

	if err != nil {
		rw.WriteHeader(http.StatusBadRequest)
		write(rw, []byte(err.Error()))
		return
	}

	res, err := r.ds.Tables(req.Context(), result)
	sendResponse(res, err, rw)
}

func (r *ResourceHandler) tableSchema(rw http.ResponseWriter, req *http.Request) {
	result := bigquery.TableSchemaArgs{}
	err := parseBody(req.Body, &result)
	if err != nil {
		rw.WriteHeader(http.StatusBadRequest)
		write(rw, []byte(err.Error()))
		return
	}

	res, err := r.ds.TableSchema(req.Context(), result)
	rw.Header().Set("Content-Type", "application/json")
	sendResponse(res, err, rw)
}

func (r *ResourceHandler) Routes() map[string]func(http.ResponseWriter, *http.Request) {
	return map[string]func(http.ResponseWriter, *http.Request){
		"/defaultProjects":      r.defaultProjects,
		"/datasets":             r.datasets,
		"/dataset/tables":       r.tables,
		"/dataset/table/schema": r.tableSchema,
	}
}

func parseBody(body io.ReadCloser, reqBody interface{}) error {
	b, err := ioutil.ReadAll(body)
	if err != nil {
		return err
	}
	err = json.Unmarshal(b, &reqBody)
	if err != nil {
		return err
	}
	return nil
}

func write(rw http.ResponseWriter, b []byte) {
	_, err := rw.Write(b)
	if err != nil {
		log.DefaultLogger.Error(err.Error())
	}
}

func sendResponse(res interface{}, err error, rw http.ResponseWriter) {
	if err != nil {
		rw.WriteHeader(http.StatusBadRequest)
		write(rw, []byte(err.Error()))
		return
	}
	bytes, err := json.Marshal(res)
	if err != nil {
		log.DefaultLogger.Error(err.Error())
		rw.WriteHeader(http.StatusInternalServerError)
		write(rw, []byte(err.Error()))
		return
	}
	rw.Header().Add("Content-Type", "application/json")
	write(rw, bytes)
}
