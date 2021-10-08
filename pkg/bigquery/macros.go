package bigquery

import (
	"github.com/grafana/sqlds/v2"
)

var macros = map[string]sqlds.MacroFunc{}

func (s *BigQueryDatasource) Macros() sqlds.Macros {
	return macros
}
