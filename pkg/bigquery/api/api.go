package api

import (
	"context"
	"encoding/json"
	"fmt"

	bq "cloud.google.com/go/bigquery"
	"github.com/grafana/grafana-bigquery-datasource/pkg/bigquery/types"
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
