package utils

import (
	"testing"

	bq "cloud.google.com/go/bigquery"
	"github.com/stretchr/testify/assert"
)

func Test_ColumnsFromTableSchema(t *testing.T) {
	t.Run("simple schema", func(t *testing.T) {
		schema := bq.Schema{
			{Name: "field1"},
			{Name: "field2"},
			{Name: "field3"},
		}
		result := ColumnsFromTableSchema(schema)
		assert.Len(t, result, 3)
		assert.Equal(t, []string{"field1", "field2", "field3"}, result)
	})

	t.Run("nesed schema", func(t *testing.T) {
		schema := bq.Schema{
			{Name: "field1"},
			{
				Name: "field2",
				Schema: bq.Schema{
					{Name: "field2_1"},
					{Name: "field2_2", Schema: bq.Schema{{Name: "field2_2_1"}}},
				},
			},
			{Name: "field3"},
		}
		result := ColumnsFromTableSchema(schema)
		assert.Len(t, result, 6)
		assert.Equal(t, []string{"field1", "field2", "field2.field2_1", "field2.field2_2", "field2.field2_2.field2_2_1", "field3"}, result)
	})
}
