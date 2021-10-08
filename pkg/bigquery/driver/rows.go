package bigquery

import (
	"database/sql/driver"
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
	columns []string
	types   []string
	rs      resultSet
	conn    *Conn
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
		dest[i] = bgValue
	}
	r.rs.num++
	return nil
}

func (r *rows) ColumnTypeDatabaseTypeName(index int) string {
	return r.types[index]
}

func (r *rows) bigqueryTypeOf(columnType *string) (reflect.Type, error) {
	switch *columnType {
	case "TINYINT":
		return reflect.TypeOf(int8(0)), nil
	case "SMALLINT":
		return reflect.TypeOf(int16(0)), nil
	case "INT", "INTEGER":
		return reflect.TypeOf(int32(0)), nil
	case "INT64":
		return reflect.TypeOf(int64(0)), nil
	case "BIGINT":
		return reflect.TypeOf(int64(0)), nil
	case "FLOAT":
		return reflect.TypeOf(float32(0)), nil
	case "FLOAT64":
		return reflect.TypeOf(float64(0)), nil
	case "STRING":
		return reflect.TypeOf(""), nil
	case "BOOLEAN":
		return reflect.TypeOf(false), nil
	case "TIMESTAMP":
		return reflect.TypeOf(time.Time{}), nil
	default:
		return nil, fmt.Errorf("unknown column type `%s`", *columnType)
	}
}

func (r *rows) ColumnTypeScanType(index int) reflect.Type {
	columnType := r.types[index]

	convertedBigqueryData, err := r.bigqueryTypeOf(&columnType)
	if err != nil {
		log.DefaultLogger.Error(err.Error())
	}

	return convertedBigqueryData
}
