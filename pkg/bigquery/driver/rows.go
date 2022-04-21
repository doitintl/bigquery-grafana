package driver

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"io"
	"reflect"
	"time"

	"cloud.google.com/go/bigquery"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

type resultSet struct {
	data [][]bigquery.Value
	num  int
}

type rows struct {
	columns      []string
	fieldSchemas []*bigquery.FieldSchema
	types        []string
	rs           resultSet
	conn         *Conn
}

func (r *rows) Columns() []string {
	return r.columns
}

func (r *rows) Close() error {
	return r.conn.Close()
}

func (r *rows) Next(dest []driver.Value) error {

	if r.rs.num == len(r.rs.data) {
		return io.EOF
	}

	for i, bgValue := range r.rs.data[r.rs.num] {
		res, err := ConvertColumnValue(bgValue, r.fieldSchemas[i])

		if err != nil {
			return err
		}

		if r.fieldSchemas[i].Type == "RECORD" {
			json, err := json.Marshal(res)
			if err != nil {
				return err
			}
			dest[i] = string(json)
		} else {
			dest[i] = res
		}
	}
	r.rs.num++
	return nil
}

func (r *rows) ColumnTypeDatabaseTypeName(index int) string {
	return r.types[index]
}

func (r *rows) bigqueryTypeOf(columnType *string) (reflect.Type, error) {
	switch *columnType {
	case "TINYINT", "SMALLINT", "INT", "INTEGER", "INT64":
		return reflect.TypeOf(int64(0)), nil
	case "FLOAT", "FLOAT64", "NUMERIC", "BIGNUMERIC":
		return reflect.TypeOf(float64(0)), nil
	case "STRING", "BYTES":
		return reflect.TypeOf(""), nil
	case "BOOLEAN":
		return reflect.TypeOf(false), nil
	case "TIMESTAMP":
		return reflect.TypeOf(time.Time{}), nil
	case "DATE", "TIME", "DATETIME":
		return reflect.TypeOf(""), nil
	case "RECORD", "GEOGRAPHY":
		return reflect.TypeOf(""), nil
	default:
		return nil, fmt.Errorf("unknown column type `%s`", *columnType)
	}
}

func (r *rows) ColumnTypeScanType(index int) reflect.Type {
	columnType := r.types[index]

	if r.fieldSchemas[index].Repeated {
		return reflect.TypeOf("")
	}

	convertedBigqueryData, err := r.bigqueryTypeOf(&columnType)
	if err != nil {
		log.DefaultLogger.Error(err.Error())
	}

	return convertedBigqueryData
}
