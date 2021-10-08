package bigquery

import (
	"context"
	"database/sql/driver"
	"os"
	"reflect"
	"strings"
	"testing"

	"cloud.google.com/go/bigquery"

	"github.com/stretchr/testify/mock"
)

const (
	testTableName = "table1"
)

var testConn *Conn
var testConfig *Config
var testClient *bigquery.Client
var testMockDataset *mockDataset

func init() {
	var err error
	ctx := context.TODO()
	if os.Getenv(ConnectionStringEnvKey) != "" {
		testConnectionString = os.Getenv(ConnectionStringEnvKey)
	} else {
		testConnectionString = mockConnectString
	}
	if err = setupConnections(); err != nil {
		panic("Can not setup connections to Google Cloud... Check credentials, and connection string")
	}

	ds := testConn.client.Dataset(testConfig.DatasetID)
	_, err = ds.Metadata(ctx)
	if err != nil {
		panic("Can not get dataset, check your connection string, permissions, and that it exists in your project")
	}
	// Check if the teable is there... if not let's create it
	t := ds.Table(testTableName)
	if _, err := t.Metadata(ctx); err != nil {
		// Table error
		if strings.HasSuffix(err.Error(), ", notFound") {
			// Need to create the table...
			err = t.Create(ctx, &bigquery.TableMetadata{
				Name:        testTableName,
				Description: "",
				Schema: bigquery.Schema{
					{
						Name: "name",
						Type: "STRING",
					}, {
						Name: "number",
						Type: "INT64",
					},
				},
			})
			if err != nil {
				panic(err)
			}

			// Add a single record for the test later
			q := testConn.client.Query("INSERT INTO dataset1.table1 (name, number) VALUES('hello',1);")
			_, err = q.Read(ctx)
			if err != nil {
				panic(err)
			}
		} else {
			panic(err)
		}

	}
}

func setupConnections() (err error) {
	testConfig, err = ConfigFromConnString(testConnectionString)
	if err != nil {
		return
	}
	ctx := context.TODO()
	testConn, err = NewConn(ctx, testConfig)
	if err != nil {
		return
	}
	testClient, err = bigquery.NewClient(ctx, testConfig.ProjectID)
	testConn.projectID = testConfig.ProjectID
	testConn.ds = testClient.Dataset(testConfig.DatasetID)
	testMockDataset = &mockDataset{}
	return
}

func setupConnTests(t testing.TB) func(t testing.TB) {
	if err := setupConnections(); err != nil {
		t.Fatal(err)
	}

	// Check if the dataset and test table are live...
	return func(t testing.TB) {

	}
}

func TestConfigFromConnString(t *testing.T) {
	teardown := setupConnTests(t)
	defer teardown(t)
	type args struct {
		in string
	}
	tests := []struct {
		name    string
		args    args
		wantCfg *Config
		wantErr bool
	}{
		{
			name: "OK",
			args: args{
				in: "bigquery://projectid/us/dataset1",
			},

			wantCfg: &Config{
				Location:  "us",
				DatasetID: "dataset1",
				ProjectID: "projectid",
			},
			wantErr: false,
		},
		{
			name: "Bad Prefix",
			args: args{
				in: "bigquey://projectid/us/dataset1",
			},

			wantCfg: nil,
			wantErr: true,
		},
		{
			name: "Bad Connection String",
			args: args{
				in: "bigquery://projectid/us/dataset1/table",
			},

			wantCfg: nil,
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotCfg, err := ConfigFromConnString(tt.args.in)
			if (err != nil) != tt.wantErr {
				t.Errorf("ConfigFromConnString() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(gotCfg, tt.wantCfg) {
				t.Errorf("ConfigFromConnString() gotCfg = %v, want %v", gotCfg, tt.wantCfg)
			}
		})
	}
}

func Test_conn_Ping(t *testing.T) {
	teardown := setupConnTests(t)
	defer teardown(t)

	type args struct {
		ctx context.Context
	}
	tests := []struct {
		name    string
		dataset string
		args    args
		wantErr bool
	}{
		{
			name:    "OK",
			dataset: "dataset1",
			args: args{
				ctx: context.TODO(),
			},
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := testConn
			if err := c.Ping(tt.args.ctx); (err != nil) != tt.wantErr {
				t.Errorf("Ping() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestConn_Query(t *testing.T) {
	teardown := setupConnTests(t)
	defer teardown(t)
	type fields struct {
		cfg       *Config
		client    *bigquery.Client
		ds        *bigquery.Dataset
		projectID string
		bad       bool
		closed    bool
		ctx       context.Context
	}
	type args struct {
		query string
		args  []driver.Value
	}
	tests := []struct {
		name     string
		fields   fields
		args     args
		wantRows *bqRows
		wantErr  error
	}{
		{
			name: "SELECT *",
			args: args{
				query: "SELECT * FROM dataset1.table1;",
				args:  nil,
			},
			wantRows: &bqRows{
				columns: []string{"name", "number"},
				types:   []string{"STRING", "INTEGER"},
				rs: resultSet{
					data: [][]bigquery.Value{
						{"hello", int64(1)},
					},
					num: 0,
				},
				c: testConn,
			},
			wantErr: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := testConn

			gotRows, err := c.Query(tt.args.query, tt.args.args)
			if err != nil {
				if tt.wantErr != nil {
					if tt.wantErr.Error() != err.Error() {
						t.Errorf("Query() error = %v, wantErr %v", err, tt.wantErr)
						return
					}
					return
				} else {
					t.Errorf("Query() error = %v, wantErr %v", err, tt.wantErr)
					return
				}
			}
			if !reflect.DeepEqual(gotRows, tt.wantRows) {
				t.Errorf("Query() gotRows = %v, want %v", gotRows, tt.wantRows)
			}
		})
	}
}

func TestConnector_Connect(t *testing.T) {
	teardown := setupConnTests(t)
	defer teardown(t)
	type fields struct {
		Info             map[string]string
		Client           *bigquery.Client
		connectionString string
	}
	type args struct {
		ctx context.Context
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		want    driver.Conn
		wantErr bool
	}{
		{
			name: "OK",
			fields: fields{
				Info:             nil,
				Client:           testClient,
				connectionString: testConnectionString,
			},
			args: args{
				ctx: nil,
			},
			want: &Conn{
				cfg:    testConfig,
				client: testClient,
				ds: &bigquery.Dataset{
					ProjectID: testConfig.ProjectID,
					DatasetID: testConfig.DatasetID,
				},
				projectID: testConfig.ProjectID,
				bad:       false,
				closed:    false,
			},
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := &Connector{
				Info:             tt.fields.Info,
				Client:           tt.fields.Client,
				connectionString: tt.fields.connectionString,
			}
			got, err := c.Connect(tt.args.ctx)
			if (err != nil) != tt.wantErr {
				t.Errorf("Connect() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if reflect.TypeOf(got) != reflect.TypeOf(tt.want) {
				t.Errorf("Connect() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestConnector_Driver(t *testing.T) {
	teardown := setupConnTests(t)
	defer teardown(t)
	type fields struct {
		Info             map[string]string
		Client           *bigquery.Client
		connectionString string
	}
	tests := []struct {
		name   string
		fields fields
		want   driver.Driver
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := &Connector{
				Info:             tt.fields.Info,
				Client:           tt.fields.Client,
				connectionString: tt.fields.connectionString,
			}
			if got := c.Driver(); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("Driver() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestNewConnector(t *testing.T) {
	teardown := setupConnTests(t)
	defer teardown(t)
	type args struct {
		connectionString string
	}
	tests := []struct {
		name string
		args args
		want *Connector
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := NewConnector(tt.args.connectionString); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("NewConnector() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestNewStmt(t *testing.T) {
	teardown := setupConnTests(t)
	defer teardown(t)
	type args struct {
		query string
		c     *Conn
	}
	tests := []struct {
		name string
		args args
		want *stmt
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := NewStmt(tt.args.query, tt.args.c); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("NewStmt() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestConn_Begin(t *testing.T) {
	teardown := setupConnTests(t)
	defer teardown(t)
	type fields struct {
		cfg       *Config
		client    *bigquery.Client
		ds        *bigquery.Dataset
		projectID string
		bad       bool
		closed    bool
	}
	tests := []struct {
		name    string
		fields  fields
		want    driver.Tx
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := &Conn{
				cfg:       tt.fields.cfg,
				client:    tt.fields.client,
				ds:        tt.fields.ds,
				projectID: tt.fields.projectID,
				bad:       tt.fields.bad,
				closed:    tt.fields.closed,
			}
			got, err := c.Begin()
			if (err != nil) != tt.wantErr {
				t.Errorf("Begin() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("Begin() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestConn_Close(t *testing.T) {
	teardown := setupConnTests(t)
	defer teardown(t)
	type fields struct {
		cfg       *Config
		client    *bigquery.Client
		ds        *bigquery.Dataset
		projectID string
		bad       bool
		closed    bool
	}
	tests := []struct {
		name    string
		fields  fields
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := &Conn{
				cfg:       tt.fields.cfg,
				client:    tt.fields.client,
				ds:        tt.fields.ds,
				projectID: tt.fields.projectID,
				bad:       tt.fields.bad,
				closed:    tt.fields.closed,
			}
			if err := c.Close(); (err != nil) != tt.wantErr {
				t.Errorf("Close() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestConn_Exec(t *testing.T) {
	teardown := setupConnTests(t)
	defer teardown(t)
	type fields struct {
		cfg       *Config
		client    *bigquery.Client
		ds        *bigquery.Dataset
		projectID string
		bad       bool
		closed    bool
	}
	type args struct {
		query string
		args  []driver.Value
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		wantRes driver.Result
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := &Conn{
				cfg:       tt.fields.cfg,
				client:    tt.fields.client,
				ds:        tt.fields.ds,
				projectID: tt.fields.projectID,
				bad:       tt.fields.bad,
				closed:    tt.fields.closed,
			}
			gotRes, err := c.Exec(tt.args.query, tt.args.args)
			if (err != nil) != tt.wantErr {
				t.Errorf("Exec() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(gotRes, tt.wantRes) {
				t.Errorf("Exec() gotRes = %v, want %v", gotRes, tt.wantRes)
			}
		})
	}
}

func TestConn_Ping(t *testing.T) {
	teardown := setupConnTests(t)
	defer teardown(t)
	type fields struct {
		cfg       *Config
		client    *bigquery.Client
		ds        Dataset
		projectID string
		bad       bool
		closed    bool
	}
	type args struct {
		ctx context.Context
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		wantErr bool
	}{
		{
			name: "OK",
			fields: fields{
				cfg: testConfig,
				client: &bigquery.Client{
					Location: "us",
				},
				ds:        testMockDataset,
				projectID: testConfig.ProjectID,
			},
			args: args{
				ctx: context.TODO(),
			},
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := &Conn{
				cfg:       tt.fields.cfg,
				client:    tt.fields.client,
				ds:        tt.fields.ds,
				projectID: tt.fields.projectID,
				bad:       tt.fields.bad,
				closed:    tt.fields.closed,
			}
			testMockDataset.config = testConfig
			if err := c.Ping(tt.args.ctx); (err != nil) != tt.wantErr {
				t.Errorf("Ping() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestConn_Prepare(t *testing.T) {
	teardown := setupConnTests(t)
	defer teardown(t)

	type args struct {
		query string
	}
	tests := []struct {
		name     string
		args     args
		wantStmt driver.Stmt
		wantErr  bool
	}{
		{
			name: "OK",
			args: args{
				query: "SELECT * FROM SOMETHING test = ? ;",
			},
			wantStmt: NewStmt("SELECT * FROM SOMETHING test = ? ;", testConn),
			wantErr:  false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := testConn
			gotStmt, err := c.Prepare(tt.args.query)
			if (err != nil) != tt.wantErr {
				t.Errorf("Prepare() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(gotStmt, tt.wantStmt) {
				t.Errorf("Prepare() gotStmt = %v, want %v", gotStmt, tt.wantStmt)
			}
		})
	}
}

func TestConn_prepareQuery(t *testing.T) {
	teardown := setupConnTests(t)
	defer teardown(t)

	type args struct {
		query string
		args  []driver.Value
	}
	tests := []struct {
		name    string
		args    args
		wantOut string
		wantErr bool
	}{
		{
			name: "OK",
			args: args{
				query: "",
				args:  nil,
			},
			wantOut: "",
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotOut, err := prepareQuery(tt.args.query, tt.args.args)
			if (err != nil) != tt.wantErr {
				t.Errorf("prepareQuery() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if gotOut != tt.wantOut {
				t.Errorf("prepareQuery() gotOut = %v, want %v", gotOut, tt.wantOut)
			}
		})
	}
}

func TestNewConn(t *testing.T) {
	teardown := setupConnTests(t)
	defer teardown(t)
	type args struct {
		ctx context.Context
		cfg *Config
	}
	tests := []struct {
		name    string
		args    args
		wantC   *Conn
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotC, err := NewConn(tt.args.ctx, tt.args.cfg)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewConn() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(gotC, tt.wantC) {
				t.Errorf("NewConn() gotC = %v, want %v", gotC, tt.wantC)
			}
		})
	}
}

type mockDataset struct {
	mock.Mock
	*bigquery.Dataset
	config *Config
}

func (m *mockDataset) Metadata(ctx context.Context) (md *bigquery.DatasetMetadata, err error) {
	return &bigquery.DatasetMetadata{
		Name:     m.config.DatasetID,
		Location: m.config.Location,
	}, nil
}
