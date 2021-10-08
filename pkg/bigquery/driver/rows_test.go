package bigquery

import (
	"context"
	"database/sql/driver"
	"reflect"
	"testing"

	"cloud.google.com/go/bigquery"
)

func setupRowsTest(t testing.TB) func(t testing.TB) {
	cfg, err := ConfigFromConnString(testConnectionString)
	if err != nil {
		t.Fatal(err)
	}
	testConn, err = NewConn(context.TODO(), cfg)
	if err != nil {
		t.Fatal(err)
	}
	return func(t testing.TB) {

	}
}
func Test_bqRows_Close(t *testing.T) {
	teardown := setupRowsTest(t)
	defer teardown(t)
	type fields struct {
		columns []string
		rs      resultSet
		c       *Conn
	}
	tests := []struct {
		name    string
		fields  fields
		wantErr bool
	}{
		{
			name: "OK",
			fields: fields{
				columns: []string{"name", "number"},
				rs: resultSet{
					data: [][]bigquery.Value{
						{"hello", int64(1)},
					},
					num: 0,
				},
				c: testConn,
			},
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			b := &bqRows{
				columns: tt.fields.columns,
				rs:      tt.fields.rs,
				c:       tt.fields.c,
			}
			if err := b.Close(); (err != nil) != tt.wantErr {
				t.Errorf("Close() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func Test_bqRows_Columns(t *testing.T) {
	teardown := setupRowsTest(t)
	defer teardown(t)
	type fields struct {
		columns []string
		rs      resultSet
		c       *Conn
	}
	tests := []struct {
		name   string
		fields fields
		want   []string
	}{
		{
			name: "OK",
			fields: fields{
				columns: []string{"name", "number"},
				rs:      resultSet{},
				c:       testConn,
			},
			want: []string{"name", "number"},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			b := &bqRows{
				columns: tt.fields.columns,
				rs:      tt.fields.rs,
				c:       tt.fields.c,
			}
			if got := b.Columns(); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("Columns() = %v, want %v", got, tt.want)
			}
		})
	}
}

func Test_bqRows_Next(t *testing.T) {
	type fields struct {
		columns []string
		rs      resultSet
		c       *Conn
	}
	type args struct {
		dest []driver.Value
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			b := &bqRows{
				columns: tt.fields.columns,
				rs:      tt.fields.rs,
				c:       tt.fields.c,
			}
			if err := b.Next(tt.args.dest); (err != nil) != tt.wantErr {
				t.Errorf("Next() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
