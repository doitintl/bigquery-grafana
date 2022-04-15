package routes

import (
	"net/http"

	"github.com/grafana/grafana-bigquery-datasource/pkg/bigquery"
	"github.com/grafana/grafana-bigquery-datasource/pkg/bigquery/utils"
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
		utils.SendResponse(nil, err, rw)
	}

	if s.AuthenticationType == "gce" {
		if s.DefaultProject != "" {
			utils.SendResponse(s.DefaultProject, nil, rw)
			return
		}
		res, err := r.ds.GetGCEDefaultProject(req.Context())
		utils.SendResponse(res, err, rw)
	} else {
		utils.SendResponse(s.DefaultProject, nil, rw)
	}
}

func (r *ResourceHandler) datasets(rw http.ResponseWriter, req *http.Request) {
	result := bigquery.DatasetsArgs{}
	err := utils.UnmarshalBody(req.Body, &result)

	if err != nil {
		rw.WriteHeader(http.StatusBadRequest)
		utils.WriteResponse(rw, []byte(err.Error()))
		return
	}
	res, err := r.ds.Datasets(req.Context(), result)

	utils.SendResponse(res, err, rw)
}

func (r *ResourceHandler) tableSchema(rw http.ResponseWriter, req *http.Request) {
	result := bigquery.TableSchemaArgs{}
	err := utils.UnmarshalBody(req.Body, &result)
	if err != nil {
		rw.WriteHeader(http.StatusBadRequest)
		utils.WriteResponse(rw, []byte(err.Error()))
		return
	}

	res, err := r.ds.TableSchema(req.Context(), result)
	rw.Header().Set("Content-Type", "application/json")
	utils.SendResponse(res, err, rw)
}

func (r *ResourceHandler) validateQuery(rw http.ResponseWriter, req *http.Request) {
	result := bigquery.ValidateQueryArgs{}
	err := utils.UnmarshalBody(req.Body, &result)
	if err != nil {
		rw.WriteHeader(http.StatusBadRequest)
		utils.WriteResponse(rw, []byte(err.Error()))
		return
	}
	result.Query.TimeRange = result.TimeRange

	res, err := r.ds.ValidateQuery(req.Context(), result)
	utils.SendResponse(res, err, rw)
}

func (r *ResourceHandler) Routes() map[string]func(http.ResponseWriter, *http.Request) {
	return map[string]func(http.ResponseWriter, *http.Request){
		"/defaultProjects":      r.defaultProjects,
		"/datasets":             r.datasets,
		"/dataset/table/schema": r.tableSchema,
		"/validateQuery":        r.validateQuery,
	}
}
