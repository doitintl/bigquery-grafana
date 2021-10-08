package bigquery

import (
	"database/sql/driver"
	"os"
	"testing"
)

const mockConnectString = "bigquery://projectID/us/dataset1"

var (
	testConnectionString string
)

func init() {
	if os.Getenv(ConnectionStringEnvKey) != "" {
		testConnectionString = os.Getenv(ConnectionStringEnvKey)
	} else {
		testConnectionString = mockConnectString
	}

}

func TestDriver_Open(t *testing.T) {
	type args struct {
		connectionString string
	}
	tests := []struct {
		name    string
		args    args
		wantC   driver.Conn
		wantErr bool
	}{
		{
			name: "OK",
			args: args{
				connectionString: testConnectionString,
			},
			wantC: &Conn{
				cfg: &Config{
					Location:  "us",
					DatasetID: "dataset1",
					ProjectID: "projectid",
				},
			},
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			d := &Driver{}
			gotC, err := d.Open(tt.args.connectionString)
			if (err != nil) != tt.wantErr {
				t.Errorf("Open() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if gotC == nil {
				t.Error("Open() failed to return a connection")
			}

		})
	}
}
