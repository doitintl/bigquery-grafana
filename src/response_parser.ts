import _ from 'lodash';
import {compact, each} from 'lodash-es';

// API interfaces
export interface ResultFormat {
    text: string;
    value: string;
}

export interface DataTarget {
    target: string;
    datapoints: any[];
    refId: string;
    query: any;
}


export default class ResponseParser {
    constructor(private $q) {
    }

    static parseProjects(results): ResultFormat[] {
        const projects: ResultFormat[] = [];
        if (!results || results.length === 0) {
            return projects;
        }
        for (let prj of results) {
            projects.push({text: prj.id, value: prj.id});
        }
        return projects;
    }

    static parseDatasets(results): ResultFormat[] {
        const datasets: ResultFormat[] = [];
        if (!results || results.length === 0) {
            return datasets;
        }
        for (let ds of results) {
            datasets.push({value: ds.datasetReference.datasetId, text: ds.datasetReference.datasetId});
        }
        return datasets;
    }


    parseTabels(results): ResultFormat[] {
        let tables: ResultFormat[] = [];
        if (!results || results.length === 0) {
            return tables;
        }
        for (let tbl of results) {
            tables.push({
                value: tbl.tableReference.tableId,
                text: tbl.tableReference.tableId
            });
        }
        return this._handelWildCardTables(tables);
    }

    _handelWildCardTables(tables) {
        let sorted = new Map();
        let new_tables = [];
        for (let t of tables) {
            if (!t.value.match(/_(?<!\d)(?:(?:20\d{2})(?:(?:(?:0[13578]|1[02])31)|(?:(?:0[1,3-9]|1[0-2])(?:29|30)))|(?:(?:20(?:0[48]|[2468][048]|[13579][26]))0229)|(?:20\d{2})(?:(?:0?[1-9])|(?:1[0-2]))(?:0?[1-9]|1\d|2[0-8]))(?!\d)$/g)) {
                sorted = sorted.set(t.value, t.text);
            } else {
                sorted.set(t.text.substring(0, t.text.length - 8) + 'YYYYMMDD', t.text.substring(0, t.text.length - 8) + 'YYYYMMDD');
            }
        }
        sorted.forEach(function (value, key) {

            new_tables = new_tables.concat({key: key, text: value});
        });
        return new_tables;
    }


    static _handleRecordFileds(results, res) {
        for (let fl of results) {
            if (fl.type === "RECORD") {
                for (let f of fl.fields) {
                    if (f.type !== "RECORD") {
                        res.push({name: fl.name + "." + f.name, type: f.type});
                    } else {
                        for (let ff of f.fields) {
                            ff.name = fl.name + "." + f.name + "." + ff.name;
                        }
                        res = ResponseParser._handleRecordFileds(f.fields, res);
                    }
                }
            } else {
                res.push({name: fl.name, type: fl.type});
            }
        }
        return res;
    }

    static parseTableFields(results, filter): ResultFormat[] {
        const fields: ResultFormat[] = [];
        if (!results || results.length === 0) {
            return fields;
        }
        let res = [];
        results = ResponseParser._handleRecordFileds(results, res);
        for (let fl of results) {
            if (filter.length > 0) {
                for (let i = 0; i < filter.length; i++) {
                    if (filter[i] === fl.type) {
                        fields.push({
                            text: fl.name,
                            value: fl.type,
                        });
                    }
                }
            } else {
                fields.push({
                    text: fl.name,
                    value: fl.type,
                });
            }
        }
        return fields;
    }


    static parseDataQuery(results, format) {
        if (format === 'time_series') {
            if (!results.rows) {
                return {data: []};
            }
            return ResponseParser._toTimeSeries(results);
        } else {
            return ResponseParser._toTable(results);
        }
    }

    static _toTimeSeries(results) {
        let timeIndex = -1;
        let metricIndex = -1;
        let valueIndex = -1;
        for (let i = 0; i < results.schema.fields.length; i++) {
            if (timeIndex === -1 && ['DATE', 'TIMESTAMP', 'DATETIME'].includes(results.schema.fields[i].type)) {
                timeIndex = i;
            }
            if (metricIndex === -1 && results.schema.fields[i].type === 'STRING') {
                metricIndex = i;
            }
            if (valueIndex === -1 && ['INT64', 'NUMERIC', 'FLOAT64', 'FLOAT', 'INT', 'INTEGER'].includes(results.schema.fields[i].type)) {
                valueIndex = i;
            }
        }
        if (timeIndex === -1) {
            throw new Error('No datetime column found in the result. The Time Series format requires a time column.');
        }
        return ResponseParser._buildDataPoints(results, timeIndex, metricIndex, valueIndex);
    }

    static _buildDataPoints(results, timeIndex, metricIndex, valueIndex) {
        const dataPoints  = [];
        let metricName = '';
        for (const row of results.rows) {
            if (row) {
                const epoch = Number(row.f[timeIndex].v) * 1000;
                metricName = metricIndex > -1 ? row.f[metricIndex].v : results.schema.fields[valueIndex].name;
                //const bucket = ResponseParser.findOrCreateBucket(data, metricName);
                dataPoints.push([Number(row.f[valueIndex].v), epoch]);
                //bucket.refId = 'A';
            }
        }
        return {target: metricName, datapoints: dataPoints};
    }

    static _toTable(results) {
        let columns = [];
        for (let i = 0; i < results.schema.fields.length; i++) {
            columns.push({
                "text": results.schema.fields[i].name,
                "type": results.schema.fields[i].type
            });
        }
        let rows = [];
        each(results.rows, function (ser) {
            let r = [];
            each(ser, function (v) {
                for (let i = 0; i < v.length; i++) {
                    r.push(v[i].v);
                }
            });
            rows.push(r);
        });
        return  {
                "columns": columns,
                "rows": rows,
                "type": "table"
            };
    }


    transformAnnotationResponse(options, data) {
        const table = data.data.results[options.annotation.name].tables[0];
        let timeColumnIndex = -1;
        const titleColumnIndex = -1;
        let textColumnIndex = -1;
        let tagsColumnIndex = -1;

        for (let i = 0; i < table.columns.length; i++) {
            if (table.columns[i].text === 'time') {
                timeColumnIndex = i;
            } else if (table.columns[i].text === 'text') {
                textColumnIndex = i;
            } else if (table.columns[i].text === 'tags') {
                tagsColumnIndex = i;
            }
        }

        if (timeColumnIndex === -1) {
            return this.$q.reject({
                message: 'Missing mandatory time column in annotation query.',
            });
        }

        const list = [];
        for (let i = 0; i < table.rows.length; i++) {
            const row = table.rows[i];
            list.push({
                annotation: options.annotation,
                time: Math.floor(row[timeColumnIndex]),
                title: row[titleColumnIndex],
                text: row[textColumnIndex],
                tags: row[tagsColumnIndex] ? row[tagsColumnIndex].trim().split(/\s*,\s*/) : [],
            });
        }

        return list;
    }
}
