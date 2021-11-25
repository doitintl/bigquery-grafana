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
)

func ColumnsFromTableSchema(schema bq.Schema) []string {
	result := []string{}

	for _, field := range schema {
		if field.Schema != nil {
			nestedSchema := ColumnsFromTableSchema(field.Schema)
			result = append(result, field.Name)
			for _, nestedField := range nestedSchema {
				result = append(result, fmt.Sprintf("%s.%s", field.Name, nestedField))
			}
		} else {
			result = append(result, field.Name)
		}
	}

	return result
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
		WriteResponse(rw, []byte(err.Error()))
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
