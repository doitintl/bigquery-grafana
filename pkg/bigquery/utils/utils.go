package utils

import (
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"

	bq "cloud.google.com/go/bigquery"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/sqlds/v2"
	"google.golang.org/api/googleapi"
)

func ColumnsFromTableSchema(schema bq.Schema, isOrderable bool) []string {
	result := []string{}

	for _, field := range schema {
		if field.Schema != nil {
			nestedSchema := ColumnsFromTableSchema(field.Schema, isOrderable)
			result = append(result, field.Name)
			for _, nestedField := range nestedSchema {
				if isOrderable {
					if isFieldOrderable(field) {
						result = append(result, fmt.Sprintf("%s.%s", field.Name, nestedField))
					}
				} else {
					result = append(result, fmt.Sprintf("%s.%s", field.Name, nestedField))

				}
			}
		} else {
			if isOrderable {
				if isFieldOrderable(field) {
					result = append(result, field.Name)
				}
			} else {
				result = append(result, field.Name)
			}
		}
	}

	return result
}

// Filters out fields that are not orderable GEOGRAPHY, ARRAY, STRUCT, RECORD
// See https://cloud.google.com/bigquery/docs/reference/standard-sql/data-types#orderable_data_types
func isFieldOrderable(f *bq.FieldSchema) bool {
	return f.Type != bq.GeographyFieldType && f.Type != bq.RecordFieldType
}

func ParseBody(body io.ReadCloser) (sqlds.Options, error) {
	reqBody := sqlds.Options{}
	b, err := ioutil.ReadAll(body)
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(b, &reqBody)
	if err != nil {
		return nil, err
	}
	return reqBody, nil
}

func UnmarshalBody(body io.ReadCloser, reqBody interface{}) error {
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

func WriteResponse(rw http.ResponseWriter, b []byte) {
	_, err := rw.Write(b)
	if err != nil {
		log.DefaultLogger.Error(err.Error())
	}
}

func SendResponse(res interface{}, err error, rw http.ResponseWriter) {
	if err != nil {
		rw.WriteHeader(http.StatusBadRequest)
		googleApiError, success := err.(*googleapi.Error)
		if !success {
			WriteResponse(rw, []byte(err.Error()))
			return
		}
		marshaledError, err := json.Marshal(googleApiError)
		if err != nil {
			WriteResponse(rw, []byte(err.Error()))
			return
		}
		WriteResponse(rw, marshaledError)
		return
	}
	bytes, err := json.Marshal(res)
	if err != nil {
		log.DefaultLogger.Error(err.Error())
		rw.WriteHeader(http.StatusInternalServerError)
		WriteResponse(rw, []byte(err.Error()))
		return
	}
	rw.Header().Add("Content-Type", "application/json")
	WriteResponse(rw, bytes)
}
