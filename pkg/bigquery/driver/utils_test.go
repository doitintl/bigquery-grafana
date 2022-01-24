package driver

import (
	"encoding/json"
	"fmt"
	"math/big"
	"testing"

	"cloud.google.com/go/bigquery"
	"cloud.google.com/go/civil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_ConvertColumnValue(t *testing.T) {
	bigRatFromString, _ := new(big.Rat).SetString("11.111111111")

	tests := []struct {
		name          string
		columnType    string
		schema        *bigquery.FieldSchema
		value         bigquery.Value
		expectedType  string
		expectedValue string
		Err           require.ErrorAssertionFunc
	}{
		{
			name:          "numeric type TINYINT",
			value:         bigquery.Value(int64(1.000)),
			columnType:    "TINYINT",
			schema:        &bigquery.FieldSchema{Type: "TINYINT"},
			expectedType:  "int64",
			expectedValue: "1",
		},
		{
			name:          "numeric type SMALLINT",
			value:         bigquery.Value(int64(1.0)),
			columnType:    "TINYINT",
			schema:        &bigquery.FieldSchema{Type: "SMALLINT"},
			expectedType:  "int64",
			expectedValue: "1",
		},
		{
			name:          "numeric type INT",
			value:         bigquery.Value(int64(1.000)),
			columnType:    "INT",
			schema:        &bigquery.FieldSchema{Type: "INT"},
			expectedType:  "int64",
			expectedValue: "1",
		},
		{
			name:          "numeric type INTEGER",
			value:         bigquery.Value(int64(1.000)),
			columnType:    "INT",
			schema:        &bigquery.FieldSchema{Type: "INTEGER"},
			expectedType:  "int64",
			expectedValue: "1",
		},
		{
			name:          "numeric type INT64",
			value:         bigquery.Value(int64(1.00)),
			columnType:    "INT",
			schema:        &bigquery.FieldSchema{Type: "INT64"},
			expectedType:  "int64",
			expectedValue: "1",
		},
		{
			name:          "numeric type FLOAT",
			value:         bigquery.Value(float64(1.99999)),
			columnType:    "FLOAT",
			schema:        &bigquery.FieldSchema{Type: "FLOAT"},
			expectedType:  "float64",
			expectedValue: "1.99999",
		},
		{
			name:          "numeric type FLOAT64",
			value:         bigquery.Value(float64(1.99999)),
			columnType:    "FLOAT64",
			schema:        &bigquery.FieldSchema{Type: "FLOAT64"},
			expectedType:  "float64",
			expectedValue: "1.99999",
		},
		{
			name:          "numeric type NUMERIC",
			value:         bigquery.Value((&big.Rat{}).SetInt64(2)),
			columnType:    "NUMERIC",
			schema:        &bigquery.FieldSchema{Type: "NUMERIC"},
			expectedType:  "float64",
			expectedValue: "2",
		},
		{
			name:          "numeric type NUMERIC",
			value:         bigquery.Value((&big.Rat{}).SetFloat64(1.99999)),
			columnType:    "NUMERIC",
			schema:        &bigquery.FieldSchema{Type: "NUMERIC"},
			expectedType:  "float64",
			expectedValue: "1.99999",
		},
		{
			name:          "numeric type NUMERIC",
			value:         bigquery.Value(bigRatFromString),
			columnType:    "NUMERIC",
			schema:        &bigquery.FieldSchema{Type: "NUMERIC"},
			expectedType:  "float64",
			expectedValue: "11.111111111",
		},
		{
			name:          "DATE",
			value:         bigquery.Value(civil.Date{Year: 2019, Month: 1, Day: 1}),
			columnType:    "DATE",
			schema:        &bigquery.FieldSchema{Type: "DATE"},
			expectedType:  "string",
			expectedValue: "2019-01-01",
		},
		{
			name:          "DATETIME",
			value:         bigquery.Value(civil.DateTime{Date: civil.Date{Year: 2019, Month: 1, Day: 1}, Time: civil.Time{Hour: 1, Minute: 1, Second: 1}}),
			columnType:    "DATETIME",
			schema:        &bigquery.FieldSchema{Type: "DATETIME"},
			expectedType:  "string",
			expectedValue: "2019-01-01 01:01:01",
		},
		{
			name:          "TIME",
			value:         bigquery.Value(civil.Time{Hour: 1, Minute: 1, Second: 1}),
			columnType:    "TIME",
			schema:        &bigquery.FieldSchema{Type: "TIME"},
			expectedType:  "string",
			expectedValue: "01:01:01",
		},
		{
			name: "RECORD",
			value: bigquery.Value([]bigquery.Value{
				bigquery.Value(int64(1)),
				bigquery.Value(float64(1.99999)),
				bigquery.Value("text value"),
				bigquery.Value(civil.Time{Hour: 1, Minute: 1, Second: 1}),
				bigquery.Value(civil.DateTime{Date: civil.Date{Year: 2019, Month: 1, Day: 1}, Time: civil.Time{Hour: 1, Minute: 1, Second: 1}}),
				[]bigquery.Value{
					bigquery.Value(int64(1)),
					bigquery.Value(float64(1.99999)),
					bigquery.Value("text value"),
					bigquery.Value(civil.Time{Hour: 1, Minute: 1, Second: 1}),
					bigquery.Value(civil.DateTime{Date: civil.Date{Year: 2019, Month: 1, Day: 1}, Time: civil.Time{Hour: 1, Minute: 1, Second: 1}}),
				},
			}),
			columnType: "RECORD",
			schema: &bigquery.FieldSchema{
				Type: "RECORD",
				Schema: bigquery.Schema{
					{Name: "col1", Type: "INT"},
					{Name: "col2", Type: "FLOAT64"},
					{Name: "col3", Type: "STRING"},
					{Name: "col4", Type: "TIME"},
					{Name: "col5", Type: "DATETIME"},
					{Name: "col6", Type: "RECORD", Schema: bigquery.Schema{
						{Name: "nested1", Type: "INT"},
						{Name: "nested2", Type: "FLOAT64"},
						{Name: "nested3", Type: "STRING"},
						{Name: "nested4", Type: "TIME"},
						{Name: "nested5", Type: "DATETIME"},
					}},
				},
			},
			expectedType:  "map[string]interface {}",
			expectedValue: "{\"col1\":1,\"col2\":1.99999,\"col3\":\"text value\",\"col4\":\"01:01:01\",\"col5\":\"2019-01-01 01:01:01\",\"col6\":{\"nested1\":1,\"nested2\":1.99999,\"nested3\":\"text value\",\"nested4\":\"01:01:01\",\"nested5\":\"2019-01-01 01:01:01\"}}",
		},

		{
			name: "RECORD repeated",
			value: bigquery.Value([]bigquery.Value{
				[]bigquery.Value{
					bigquery.Value(int64(1)),
					bigquery.Value(float64(1.99999)),
					bigquery.Value("text value"),
					bigquery.Value(civil.Time{Hour: 1, Minute: 1, Second: 1}),
					bigquery.Value(civil.DateTime{Date: civil.Date{Year: 2019, Month: 1, Day: 1}, Time: civil.Time{Hour: 1, Minute: 1, Second: 1}}),
				},
				[]bigquery.Value{
					bigquery.Value(int64(2)),
					bigquery.Value(float64(2.99999)),
					bigquery.Value("text value 2"),
					bigquery.Value(civil.Time{Hour: 2, Minute: 2, Second: 2}),
					bigquery.Value(civil.DateTime{Date: civil.Date{Year: 2019, Month: 2, Day: 2}, Time: civil.Time{Hour: 1, Minute: 1, Second: 1}}),
				},
			}),
			columnType: "RECORD",
			schema: &bigquery.FieldSchema{
				Type:     "RECORD",
				Repeated: true,
				Schema: bigquery.Schema{
					{Name: "col1", Type: "INT"},
					{Name: "col2", Type: "FLOAT64"},
					{Name: "col3", Type: "STRING"},
					{Name: "col4", Type: "TIME"},
					{Name: "col5", Type: "DATETIME"},
				},
			},
			expectedType:  "[]interface {}",
			expectedValue: "[{\"col1\":1,\"col2\":1.99999,\"col3\":\"text value\",\"col4\":\"01:01:01\",\"col5\":\"2019-01-01 01:01:01\"},{\"col1\":2,\"col2\":2.99999,\"col3\":\"text value 2\",\"col4\":\"02:02:02\",\"col5\":\"2019-02-02 01:01:01\"}]",
		},
		{
			name: "RECORD repeated with nil values",
			value: bigquery.Value([]bigquery.Value{
				nil,
				[]bigquery.Value{
					bigquery.Value(int64(2)),
					bigquery.Value(float64(2.99999)),
					bigquery.Value("text value 2"),
					bigquery.Value(civil.Time{Hour: 2, Minute: 2, Second: 2}),
					bigquery.Value(civil.DateTime{Date: civil.Date{Year: 2019, Month: 2, Day: 2}, Time: civil.Time{Hour: 1, Minute: 1, Second: 1}}),
				},
			}),
			columnType: "RECORD",
			schema: &bigquery.FieldSchema{
				Type:     "RECORD",
				Repeated: true,
				Schema: bigquery.Schema{
					{Name: "col1", Type: "INT"},
					{Name: "col2", Type: "FLOAT64"},
					{Name: "col3", Type: "STRING"},
					{Name: "col4", Type: "TIME"},
					{Name: "col5", Type: "DATETIME"},
				},
			},
			expectedType:  "[]interface {}",
			expectedValue: "[null,{\"col1\":2,\"col2\":2.99999,\"col3\":\"text value 2\",\"col4\":\"02:02:02\",\"col5\":\"2019-02-02 01:01:01\"}]",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			v, err := ConvertColumnValue(tt.value, tt.schema)
			require.NoError(t, err)

			assert.Equal(t, tt.expectedType, fmt.Sprintf("%T", v))

			if tt.schema.Type == "RECORD" {
				json, err := json.Marshal(v)
				require.NoError(t, err)
				v = string(json)
			}

			assert.Equal(t, tt.expectedValue, fmt.Sprintf("%v", v))
		})
	}
}
