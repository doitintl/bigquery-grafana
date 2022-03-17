package bigquery

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend/gtime"
	"github.com/grafana/sqlds/v2"
)

func macroTable(query *sqlds.Query, args []string) (string, error) {
	var connArgs ConnectionArgs
	err := json.Unmarshal(query.ConnectionArgs, &connArgs)

	if err != nil {
		return "", err
	}

	return fmt.Sprintf("`%s.%s`", connArgs.Dataset, connArgs.Table), nil
}

// Example:
//   $__millisTimeFrom(time) => "time >= '1572480000000'"
func macroMillisTimeFrom(query *sqlds.Query, args []string) (string, error) {
	if len(args) != 1 {
		return "", fmt.Errorf("%w: expected 1 argument, received %d", errors.New("unexpected number of arguments"), len(args))
	}

	t := int64(time.Nanosecond) * query.TimeRange.From.UTC().UnixNano() / int64(time.Millisecond)
	return fmt.Sprintf("%s >= '%d'", args[0], t), nil
}

// Example:
// $__millisTimeTo(time) => "time <= '1572480000000'"
func macroMillisTimeTo(query *sqlds.Query, args []string) (string, error) {
	if len(args) != 1 {
		return "", fmt.Errorf("%w: expected 1 argument, received %d", errors.New("unexpected number of arguments"), len(args))
	}

	t := int64(time.Nanosecond) * query.TimeRange.To.UTC().UnixNano() / int64(time.Millisecond)
	return fmt.Sprintf("%s <= '%d'", args[0], t), nil
}

func macroTimeGroup(query *sqlds.Query, args []string) (string, error) {
	if len(args) < 2 {
		return "", fmt.Errorf("%w: expected 2 arguments, received %d", errors.New("macro $__timeGroup needs time column and interval"), len(args))
	}

	timeVar := args[0]
	intervalVar := strings.Trim(args[1], "'\"")
	last := intervalVar[len(intervalVar)-1:]

	// when month interval
	if last == "M" {
		return fmt.Sprintf("TIMESTAMP((PARSE_DATE(\"%%Y-%%m-%%d\",CONCAT( CAST((EXTRACT(YEAR FROM `%s`)) AS STRING),'-',CAST((EXTRACT(MONTH FROM `%s`)) AS STRING),'-','01'))))", timeVar, timeVar), nil
	}

	interval, err := gtime.ParseInterval(intervalVar)

	if err != nil {
		return "", fmt.Errorf("error parsing interval %v", intervalVar)

	}

	return fmt.Sprintf("TIMESTAMP_SECONDS(DIV(UNIX_SECONDS(`%s`), %v) * %v)", timeVar, interval.Seconds(), interval.Seconds()), nil
}

var macros = map[string]sqlds.MacroFunc{
	"table":          macroTable,
	"timeGroup":      macroTimeGroup,
	"millisTimeFrom": macroMillisTimeFrom,
	"millisTimeTo":   macroMillisTimeTo,
}

func (s *BigQueryDatasource) Macros() sqlds.Macros {
	return macros
}
