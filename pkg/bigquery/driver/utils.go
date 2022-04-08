package driver

import (
	"database/sql/driver"
	b64 "encoding/base64"
	"fmt"
	"math/big"

	"cloud.google.com/go/bigquery"
	"cloud.google.com/go/civil"
)

// Converts an arbitrary bigquery.Value to a driver.Value
func ConvertColumnValue(v bigquery.Value, fieldSchema *bigquery.FieldSchema) (driver.Value, error) {
	if v == nil {
		return nil, nil
	}

	switch fieldSchema.Type {
	case "TINYINT", "SMALLINT", "INT", "INTEGER", "INT64", "BIGINT":
		// Ref https://github.com/googleapis/google-cloud-go/blob/1063c601a4c4a99217b45be0b25caa460e7157a1/datastore/load.go#L266
		return v.(int64), nil
	case "FLOAT", "FLOAT64":
		return v.(float64), nil
	case "STRING":
		return v.(string), nil
	case "BYTES":
		return b64.StdEncoding.EncodeToString(v.([]byte)), nil
	case "BOOLEAN":
		return v.(bool), nil
	case "TIME":
		return bigquery.CivilTimeString(v.(civil.Time)), nil
	case "DATE":
		res := v.(civil.Date)
		if !res.IsValid() {
			return nil, nil
		}
		return res.String(), nil

	case "DATETIME":
		return bigquery.CivilDateTimeString(v.(civil.DateTime)), nil

	case "RECORD":
		res, err := ConvertRecordValue(v.([]bigquery.Value), fieldSchema)
		if err != nil {
			return nil, err
		}
		return res, nil
	case "NUMERIC", "BIGNUMERIC":
		conv, _ := v.(*big.Rat).Float64()
		return conv, nil
	case "GEOGRAPHY":
		return v.(string), nil
	default:
		return v, nil
	}
}

// Converts RECORD field to a map or array of maps (for repeated records)
func ConvertRecordValue(v []bigquery.Value, schema *bigquery.FieldSchema) (driver.Value, error) {
	if schema.Repeated {
		res := make([]interface{}, len(v))

		for i, val := range v {
			if val == nil {
				res[i] = nil
			} else {
				if len(val.([]bigquery.Value)) != len(schema.Schema) {
					return nil, fmt.Errorf("invalid length of values vs schema")
				}

				fs := bigquery.FieldSchema{Schema: schema.Schema}
				record, err := ConvertRecordValue((val.([]bigquery.Value)), &fs)

				if err != nil {
					return "", err
				}
				res[i] = record

			}
		}

		return res, nil
	}

	res := make(map[string]interface{})

	for i, field := range schema.Schema {
		if v[i] == nil {
			res[field.Name] = nil
		} else {
			record, err := ConvertColumnValue(v[i], field)

			if err != nil {
				return "", err
			}
			res[field.Name] = record
		}

	}
	return res, nil

}
