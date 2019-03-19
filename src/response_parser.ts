import _ from 'lodash';
import {each} from 'lodash-es';

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

    parseProjects(results): ResultFormat[] {
        const projects: ResultFormat[] = [];
        if (!results || !results.data || !results.data.projects || results.data.projects.length === 0) {
            return projects;
        }
        for (let prj of results.data.projects) {
            projects.push({value: prj.id, text: prj.id});
        }
        return projects;
    }

    parseDatasets(results): ResultFormat[] {
        const datasets: ResultFormat[] = [];
        if (!results || !results.data || !results.data.datasets || results.data.datasets.length === 0) {
            return datasets;
        }
        for (let ds of results.data.datasets) {
            datasets.push({value: ds.datasetReference.datasetId, text: ds.datasetReference.datasetId});
        }
        return datasets;
    }


    parseTabels(results): ResultFormat[] {
        const tabels: ResultFormat[] = [];
        if (!results || !results.data || !results.data.tables || results.data.tables.length === 0) {
            return tabels;
        }
        for (let tbl of results.data.tables) {
            tabels.push({
                value: tbl.tableReference.tableId,
                text: tbl.tableReference.tableId
            });
        }
        return tabels;
    }

    parseTabelFields(results, filter): ResultFormat[] {
        const fields: ResultFormat[] = [];
        if (!results || !results.data || !results.data.schema || !results.data.schema.fields || results.data.schema.fields.length === 0) {
            return fields;
        }
        for (let fl of results.data.schema.fields) {
            for (let i = 0; i < filter.length; i++) {
                if (filter[i] === fl.type) {
                    fields.push({
                        text: fl.name,
                        value: fl.type,
                    });
                }
            }
        }
        return fields;
    }


    parseDataQuery(results, format) {
        if (format === 'time_series') {
            return this._toTimeSeries(results);
        } else {
            return this._toTable(results);
        }
    }

    _toTimeSeries(results) {
        const data = [];
        if (!results.rows) {
            return {data: data};
        }
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
        for (const row of results.rows) {
            if (row) {
                const epoch = Number(row.f[timeIndex].v) * 1000;
                const metricName = metricIndex > -1 ? row.f[metricIndex].v : results.schema.fields[valueIndex].name;
                const bucket = ResponseParser.findOrCreateBucket(data, metricName);
                bucket.datapoints.push([row.f[valueIndex].v, epoch]);
            }
        }
        return {data: data};
    }

    _toTable(results) {
        const data = [];
        let columns = [];
        for (let i = 0; i < results.schema.fields.length; i++) {
            columns.push({"text": results.schema.fields[i].name, "type": results.schema.fields[i].type});
        }
        let rows = [];
        each(results.rows, function (ser) {
            let r = [];
            each(ser, function (v) {
                r.push(v);
            });
            rows.push(r);
        });
        data.push({
            "columns": columns,
            "rows": rows,
            "type": "table"
        });
        return {data: data};
    }

    static findOrCreateBucket(data, target): DataTarget {
        let dataTarget = _.find(data, ['target', target]);
        if (!dataTarget) {
            dataTarget = {target: target, datapoints: [], refId: '', query: ''};
            data.push(dataTarget);
        }

        return dataTarget;
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
