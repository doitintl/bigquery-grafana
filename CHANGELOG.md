# Changelog

## 0.1.10

- **Code editor**: Add option to format the query.
- **Code editor**: Do not run the query when user blurs the code editor.
- **Query validation**: Do not re-validate query if it hasn's changed.

## 0.1.9

- **Autocomplete**: Add suggestions for columns in WHERE clause.
- **Query validation**: Actively run query validation on query change rather than on blur.
- **Code editor**: Run query when CTRL/CMD+Return is pressed.

## 0.1.8

- **Autocomplete**: Improve tables suggestions.
- **Query validation**: Interpolate template variables and macros before performing dry run.

## 0.1.7

- **Autocomplete**: Add suggestions for ingestion-time partitioned table filters.
- **Code editor**: Make autocomplete case insentive for keywords and operators.
- **Code editor**: Make query bytes estimate more user friendly.

## 0.1.6

- **Code editor**: Add validation with query dry run.

## 0.1.5

- **Autocomplete**: Fixed the broken dataset/table suggestions.

## 0.1.4

- **Visual Query Builder**: Introducing visual query builder.
- **Code editor**: Make raw query editor work in Grafana < 8.2.x.

## 0.1.3

- **Autocomplete**: Deduplicate logical operators.
- **Code editor**: Do not run query on blur, improve query header component.

## 0.1.2

- **Data types support**: Handle NUMERIC data type.

## 0.1.1

- **Autocomplete**: Fixed the broken dataset/table suggestions if project id or dataset id contains a keyword defined in Monaco's default SQL language definition.

## 0.1.0

Initial Beta release.
