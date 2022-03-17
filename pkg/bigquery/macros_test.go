package bigquery

import (
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/sqlds/v2"
	"github.com/pkg/errors"
)

func Test_macros(t *testing.T) {
	from, _ := time.Parse(time.RFC3339, "2019-10-31T00:00:00.000Z")
	to, _ := time.Parse(time.RFC3339, "2019-11-30T00:00:00.000Z")
	timeRange := backend.TimeRange{
		From: from,
		To:   to,
	}

	tests := []struct {
		description string
		macro       string
		query       *sqlds.Query
		args        []string
		expected    string
		expectedErr error
	}{
		{
			"table",
			"table",
			&sqlds.Query{ConnectionArgs: []byte(
				`{
					"dataset" : "dataset",
					"table" : "table"
				}`,
			)},
			[]string{},
			"`dataset.table`",
			nil,
		},
		{
			"time groups 1w",
			"timeGroup",
			&sqlds.Query{},
			[]string{"created_at", "1w"},
			"TIMESTAMP_SECONDS(DIV(UNIX_SECONDS(`created_at`), 604800) * 604800)",
			nil,
		},
		{
			"time groups 1d",
			"timeGroup",
			&sqlds.Query{},
			[]string{"created_at", "1d"},
			"TIMESTAMP_SECONDS(DIV(UNIX_SECONDS(`created_at`), 86400) * 86400)",
			nil,
		},
		{
			"time groups 1M",
			"timeGroup",
			&sqlds.Query{},
			[]string{"created_at", "1M"},
			"TIMESTAMP((PARSE_DATE(\"%Y-%m-%d\",CONCAT( CAST((EXTRACT(YEAR FROM `created_at`)) AS STRING),'-',CAST((EXTRACT(MONTH FROM `created_at`)) AS STRING),'-','01'))))",
			nil,
		},
		{
			"time groups '1M'",
			"timeGroup",
			&sqlds.Query{},
			[]string{"created_at", "'1M'"},
			"TIMESTAMP((PARSE_DATE(\"%Y-%m-%d\",CONCAT( CAST((EXTRACT(YEAR FROM `created_at`)) AS STRING),'-',CAST((EXTRACT(MONTH FROM `created_at`)) AS STRING),'-','01'))))",
			nil,
		},
		{
			"time groups \"1M\"",
			"timeGroup",
			&sqlds.Query{},
			[]string{"created_at", "\"1M\""},
			"TIMESTAMP((PARSE_DATE(\"%Y-%m-%d\",CONCAT( CAST((EXTRACT(YEAR FROM `created_at`)) AS STRING),'-',CAST((EXTRACT(MONTH FROM `created_at`)) AS STRING),'-','01'))))",
			nil,
		},

		{
			"millist time from",
			"millisTimeFrom",
			&sqlds.Query{TimeRange: timeRange},
			[]string{"time"},
			"time >= '1572480000000'",
			nil,
		},

		{
			"millist time to",
			"millisTimeTo",
			&sqlds.Query{TimeRange: timeRange},
			[]string{"time"},
			"time <= '1575072000000'",
			nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.description, func(t *testing.T) {
			res, err := macros[tt.macro](tt.query, tt.args)
			if (err != nil || tt.expectedErr != nil) && !errors.Is(err, tt.expectedErr) {
				t.Errorf("unexpected error %v, expecting %v", err, tt.expectedErr)
			}
			if res != tt.expected {
				t.Errorf("unexpected result %v, expecting %v", res, tt.expected)
			}
		})
	}
}
