package api

import (
	"context"
	"encoding/json"
	"fmt"

	bq "cloud.google.com/go/bigquery"
	"github.com/grafana/grafana-bigquery-datasource/pkg/bigquery/types"
	"github.com/grafana/grafana-bigquery-datasource/pkg/bigquery/utils"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/pkg/errors"
	"google.golang.org/api/iterator"
)

type API struct {
	Client *bq.Client
}

func New(client *bq.Client) *API {
	return &API{client}
}

func (a *API) ListDatasets(ctx context.Context) ([]string, error) {

	result := []string{}

	it := a.Client.Datasets(ctx)
	for {
		dataset, err := it.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}

		result = append(result, dataset.DatasetID)
	}

	return result, nil
}

func (a *API) ListTables(ctx context.Context, dataset string) ([]string, error) {
	datasetRef := a.Client.Dataset(dataset)
	result := []string{}

	it := datasetRef.Tables(ctx)
	for {
		table, err := it.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}

		result = append(result, table.TableID)
	}

	return result, nil
}

func (a *API) ListColumns(ctx context.Context, dataset string, table string, isOrderable bool) ([]string, error) {
	tableMeta, err := a.Client.Dataset(dataset).Table(table).Metadata(ctx)

	if err != nil {
		return nil, errors.WithMessage(err, fmt.Sprintf("Failed to retrieve %s table columns", table))
	}

	result := utils.ColumnsFromTableSchema(tableMeta.Schema, isOrderable)
	return result, nil

}

func (a *API) GetTableSchema(ctx context.Context, dataset, table string) (*types.TableMetadataResponse, error) {
	tableMeta, err := a.Client.Dataset(dataset).Table(table).Metadata(ctx)
	if err != nil {
		return nil, errors.WithMessage(err, fmt.Sprintf("Failed to retrieve %s table metadata", table))
	}

	response, _ := json.Marshal(tableMeta)
	result := &types.TableMetadataResponse{}

	if err := json.Unmarshal(response, result); err != nil {
		return nil, errors.WithMessage(err, fmt.Sprintf("Failed to parse %s table metadata", table))
	}

	return result, nil
}

func (a *API) SetLocation(location string) {
	a.Client.Location = location
}

type ValidateQueryResponse struct {
	IsValid    bool              `json:"isValid"`
	IsError    bool              `json:"isError"`
	Error      string            `json:"error"`
	Statistics *bq.JobStatistics `json:"statistics"`
}

func (a *API) ValidateQuery(ctx context.Context, query string) *ValidateQueryResponse {
	q := a.Client.Query(query)
	q.DryRun = true
	job, err := q.Run(ctx)
	response := &ValidateQueryResponse{}

	backend.Logger.Debug("Validating query", "job", job, "err", err, "query", query)

	if err != nil {
		response.IsError = true
		response.Error = err.Error()
	} else {
		status := job.LastStatus()
		response.IsValid = true
		response.Statistics = status.Statistics
	}

	return response
}
