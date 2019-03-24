import moment from 'moment';
import {BigQueryDatasource} from '../datasource';
import ResponseParser, {ResultFormat} from '../response_parser';
import BigQueryQuery from "../bigquery_query";

describe('BigQueryDatasource', () => {
    const instanceSettings = {name: 'bigquery', jsonData: {authenticationType: 'jwt'}};
    const backendSrv = {};
    const templateSrv = {
        replace: jest.fn(text => text),
    };
    const raw = {
        from: moment.utc('2018-04-25 10:00'),
        to: moment.utc('2018-04-25 11:00'),
    };
    const ctx = {
        backendSrv,
        timeSrvMock: {
            timeRange: () => ({
                from: raw.from,
                to: raw.to,
                raw: raw,
            }),
        },
    } as any;

    beforeEach(() => {
        ctx.ds = new BigQueryDatasource(instanceSettings, backendSrv, {}, templateSrv, ctx.timeSrvMock);
        ctx.ds.projectName = "my project";
    });

    describe('formatBigqueryError', () => {
        let error = {
            statusText: 'status text',
        };

        let res = BigQueryDatasource.formatBigqueryError(error);
        expect(res).toBe('BigQuery: status text: Cannot connect to BigQuery API');
        let error_1 = {
            statusText: 'status text',
            data: {error: 'error txt'}
        };
        res = BigQueryDatasource.formatBigqueryError(error_1);
        expect(res).toBe('BigQuery: status text: error txt');

    });


    describe('When performing do request', () => {
        let results;
        const response = {
            "kind": "bigquery#queryResponse",
            "schema": {
                "fields": [
                    {
                        "name": "time",
                        "type": "TIMESTAMP",
                        "mode": "NULLABLE"
                    },
                    {
                        "name": "start_station_latitude",
                        "type": "FLOAT",
                        "mode": "NULLABLE"
                    }
                ]
            },
            "jobReference": {
                "projectId": "aviv-playground",
                "jobId": "job_fB4qCDAO-TKg1Orc-OrkdIRxCGN5",
                "location": "US"
            },
            "totalRows": "3",
            "rows": [
                {
                    "f": [
                        {
                            "v": "1.521578851E9"
                        },
                        {
                            "v": "37.7753058"
                        }
                    ]
                },
                {
                    "f": [
                        {
                            "v": "1.521578916E9"
                        },
                        {
                            "v": "37.3322326"
                        }
                    ]
                },
                {
                    "f": [
                        {
                            "v": "1.521578927E9"
                        },
                        {
                            "v": "37.781752"
                        }
                    ]
                }
            ],
            "totalBytesProcessed": "23289520",
            "jobComplete": true,
            "cacheHit": false
        };
        beforeEach(() => {
            ctx.backendSrv.datasourceRequest = jest.fn(options => {
                return Promise.resolve({data: response, status: 200});
            });
        });

        it('should return expected data', async () => {
            await ctx.ds.doQuery('select * from table', "id-1").then(data => {
                results = data;
            });
            expect(results.rows.length).toBe(3);
            expect(results.schema.fields.length).toBe(2);
        });
    });


    describe('_waitForJobComplete', () => {
        let results;
        const response = {
            "kind": "bigquery#queryResponse",
            "schema": {
                "fields": [
                    {
                        "name": "time",
                        "type": "TIMESTAMP",
                        "mode": "NULLABLE"
                    },
                    {
                        "name": "start_station_latitude",
                        "type": "FLOAT",
                        "mode": "NULLABLE"
                    }
                ]
            },
            "jobReference": {
                "projectId": "aviv-playground",
                "jobId": "job_fB4qCDAO-TKg1Orc-OrkdIRxCGN5",
                "location": "US"
            },
            "totalRows": "3",
            "rows": [
                {
                    "f": [
                        {
                            "v": "1.521578851E9"
                        },
                        {
                            "v": "37.7753058"
                        }
                    ]
                },
                {
                    "f": [
                        {
                            "v": "1.521578916E9"
                        },
                        {
                            "v": "37.3322326"
                        }
                    ]
                },
                {
                    "f": [
                        {
                            "v": "1.521578927E9"
                        },
                        {
                            "v": "37.781752"
                        }
                    ]
                }
            ],
            "totalBytesProcessed": "23289520",
            "jobComplete": true,
            "cacheHit": false
        };
        let queryResults = {
            data: {
            "totalBytesProcessed": "23289520",
            "jobComplete": false,
            "cacheHit": false
            }
        };
        beforeEach(() => {
            ctx.backendSrv.datasourceRequest = jest.fn(options => {
                return Promise.resolve({data: response, status: 200});
            });
        });

        it('should return expected data', async () => {
            await ctx.ds._waitForJobComplete(queryResults, "requestId", "job_fB4qCDAO-TKg1Orc-OrkdIRxCGN5").then(data => {
                results = data;
            });
            console.log(results)
            expect(results.data.rows.length).toBe(3);
            expect(results.data.schema.fields.length).toBe(2);
        });
    });


    describe('When performing annotationQuery', () => {
        let results;

        const annotationName = 'MyAnno';

        const options = {
            annotation: {
                name: annotationName,
                rawQuery: 'select time, title, text, tags from table;',
            },
            range: {
                from: moment(1432288354),
                to: moment(1432288401),
            },
        };

        const response = {
            results: {
                MyAnno: {
                    refId: annotationName,
                    tables: [
                        {
                            columns: [{text: 'time'}, {text: 'text'}, {text: 'tags'}],
                            rows: [
                                [1432288355, 'some text', 'TagA,TagB'],
                                [1432288390, 'some text2', ' TagB , TagC'],
                                [1432288400, 'some text3'],
                            ],
                        },
                    ],
                },
            },
        };

        beforeEach(() => {
            ctx.backendSrv.datasourceRequest = jest.fn(options => {
                return Promise.resolve({data: response, status: 200});
            });
            ctx.ds.annotationQuery(options).then(data => {
                results = data;
            });
        });

        it('should return annotation list', () => {
            expect(results.length).toBe(3);

            expect(results[0].text).toBe('some text');
            expect(results[0].tags[0]).toBe('TagA');
            expect(results[0].tags[1]).toBe('TagB');

            expect(results[1].tags[0]).toBe('TagB');
            expect(results[1].tags[1]).toBe('TagC');

            expect(results[2].tags.length).toBe(0);
        });
    });

    describe('When performing getProjects', () => {
        let results;
        const response = {
            "kind": "bigquery#projectList",
            "etag": "o48iuUgjDrXb++kcLl2yeQ==",
            "projects": [
                {
                    "kind": "bigquery#project",
                    "id": "prj-1",
                    "numericId": "1",
                    "projectReference": {
                        "projectId": "prj-1"
                    },
                    "friendlyName": "prj-1"
                },
                {
                    "kind": "bigquery#project",
                    "id": "prj-2",
                    "numericId": "2",
                    "projectReference": {
                        "projectId": "prj-2"
                    },
                    "friendlyName": "prj-2"
                }, {
                    "kind": "bigquery#project",
                    "id": "prj-3",
                    "numericId": "3",
                    "projectReference": {
                        "projectId": "prj-3"
                    },
                    "friendlyName": "prj-3"
                },

            ],
            "totalItems": 3
        };

        beforeEach(() => {
            ctx.backendSrv.datasourceRequest = jest.fn(options => {
                return Promise.resolve({data: response, status: 200});
            });
            ctx.ds.getProjects().then(data => {
                results = data;
            });
        });

        it('should return list of projects', () => {
            expect(results.length).toBe(3);
            expect(results[0].text).toBe('prj-1');
            expect(results[2].text).toBe('prj-3');
        });
    });

    describe('When performing getDatasets', () => {
        let results;
        const response = {
            "kind": "bigquery#datasetList",
            "etag": "q6TrWWJHEC7v8Vt1T4+geg==",
            "datasets": [
                {
                    "kind": "bigquery#dataset",
                    "id": "prj-1:ds-1",
                    "datasetReference": {
                        "datasetId": "ds-1",
                        "projectId": "prj-1"
                    },
                    "location": "US"
                },
                {
                    "kind": "bigquery#dataset",
                    "id": "prj-1:ds-2",
                    "datasetReference": {
                        "datasetId": "ds-2",
                        "projectId": "prj-1"
                    },
                    "labels": {
                        "otag": "ds-2",
                    },
                    "location": "US"
                }
            ]
        };

        beforeEach(() => {
            ctx.backendSrv.datasourceRequest = jest.fn(options => {
                return Promise.resolve({data: response, status: 200});
            });
            ctx.ds.getDatasets('prj-1').then(data => {
                results = data;
            });
        });

        it('should return list of datasets', () => {
            expect(results.length).toBe(2);
            expect(results[0].text).toBe('ds-1');
            expect(results[1].text).toBe('ds-2');
        });
    });

    describe('When performing getTables', () => {
        let results;
        const response = {
            "kind": "bigquery#tableList",
            "etag": "Qfgo3cWRRPb3c+XmsrC+OA==",
            "tables": [
                {
                    "kind": "bigquery#table",
                    "id": "prj-1:ds-1.click_64",
                    "tableReference": {
                        "projectId": "prj-1",
                        "datasetId": "ds-1",
                        "tableId": "click_64"
                    },
                    "type": "TABLE",
                    "creationTime": "1525943213994"
                },
                {
                    "kind": "bigquery#table",
                    "id": "prj-1:ds-1.error",
                    "tableReference": {
                        "projectId": "prj-1",
                        "datasetId": "ds-1",
                        "tableId": "error"
                    },
                    "type": "TABLE",
                    "creationTime": "1525941785282"
                }
            ],
            "totalItems": 2
        };

        beforeEach(() => {
            ctx.backendSrv.datasourceRequest = jest.fn(options => {
                return Promise.resolve({data: response, status: 200});
            });
            ctx.ds.getTables('prj-1', 'ds-1').then(data => {
                results = data;
            });
        });

        it('should return list of tabels', () => {
            expect(results.length).toBe(2);
            expect(results[0].text).toBe('click_64');
            expect(results[1].text).toBe('error');
        });
    });

    describe('When performing getTableFields for Date Fields', () => {
        let results;
        const response = {
            "kind": "bigquery#table",
            "etag": "3UHbvhc/35v2P8ZhsjrRtw==",
            "id": "ds-1:ds-1.newtable",
            "selfLink": "https://content.googleapis.com/bigquery/v2/projects/ds-1/datasets/ds-1/tables/newtable",
            "tableReference": {
                "projectId": "ds-1",
                "datasetId": "ds-1",
                "tableId": "newtable"
            },
            "description": "a table partitioned by transaction_date",
            "schema": {
                "fields": [
                    {
                        "name": "transaction_id",
                        "type": "INTEGER"
                    },
                    {
                        "name": "transaction_date",
                        "type": "DATE"
                    },
                    {
                        "name": "My_datetime",
                        "type": "DATETIME"
                    },
                    {
                        "name": "My_Timestamp",
                        "type": "TIMESTAMP"
                    },
                    {
                        "name": "My_STRING",
                        "type": "STRING"
                    }
                ]
            },
            "timePartitioning": {
                "type": "DAY",
                "expirationMs": "259200000",
                "field": "transaction_date"
            },
            "numBytes": "0",
            "numLongTermBytes": "0",
            "numRows": "0",
            "creationTime": "1551211795415",
            "lastModifiedTime": "1551623603909",
            "type": "TABLE",
            "location": "US"
        };


        beforeEach(() => {
            ctx.backendSrv.datasourceRequest = jest.fn(options => {
                return Promise.resolve({data: response, status: 200});
            });
            ctx.ds.getTableFields('prj-1', 'ds-1', 'newtable', ['DATE', 'TIMESTAMP', 'DATETIME']).then(data => {
                results = data;
            });
        });

        it('should return list of dare fields', () => {
            expect(results.length).toBe(3);
            expect(results[0].text).toBe('transaction_date');
            expect(results[1].text).toBe('My_datetime');
            expect(results[2].text).toBe('My_Timestamp');
        });
    });
    describe('When performing getTableFields for Numeric Fields', () => {
        let results;
        const response = {
            "kind": "bigquery#table",
            "etag": "3UHbvhc/35v2P8ZhsjrRtw==",
            "id": "ds-1:ds-1.newtable",
            "selfLink": "https://content.googleapis.com/bigquery/v2/projects/ds-1/datasets/ds-1/tables/newtable",
            "tableReference": {
                "projectId": "ds-1",
                "datasetId": "ds-1",
                "tableId": "newtable"
            },
            "description": "a table partitioned by transaction_date",
            "schema": {
                "fields": [
                    {
                        "name": "transaction_id",
                        "type": "INTEGER"
                    },
                    {
                        "name": "transaction_date",
                        "type": "DATE"
                    },
                    {
                        "name": "My_datetime",
                        "type": "DATETIME"
                    },
                    {
                        "name": "My_Timestamp",
                        "type": "TIMESTAMP"
                    },
                    {
                        "name": "My_STRING",
                        "type": "STRING"
                    },
                    {
                        "name": "My_FLOAT",
                        "type": "FLOAT64"
                    }

                ]
            },
            "timePartitioning": {
                "type": "DAY",
                "expirationMs": "259200000",
                "field": "transaction_date"
            },
            "numBytes": "0",
            "numLongTermBytes": "0",
            "numRows": "0",
            "creationTime": "1551211795415",
            "lastModifiedTime": "1551623603909",
            "type": "TABLE",
            "location": "US"
        };


        beforeEach(() => {
            ctx.backendSrv.datasourceRequest = jest.fn(options => {
                return Promise.resolve({data: response, status: 200});
            });
            ctx.ds.getTableFields('prj-1', 'ds-1', 'newtable', ['INT64', 'NUMERIC', 'FLOAT64', 'FLOAT', 'INT', 'INTEGER']).then(data => {
                results = data;
            });
        });

        it('should return list of numeric', () => {
            expect(results.length).toBe(2);
            expect(results[0].text).toBe('transaction_id');
            expect(results[1].text).toBe('My_FLOAT');
        });
    });

    describe('When performing getTableFields for All Fields', () => {
        let results;
        const response = {
            "kind": "bigquery#table",
            "etag": "3UHbvhc/35v2P8ZhsjrRtw==",
            "id": "ds-1:ds-1.newtable",
            "selfLink": "https://content.googleapis.com/bigquery/v2/projects/ds-1/datasets/ds-1/tables/newtable",
            "tableReference": {
                "projectId": "ds-1",
                "datasetId": "ds-1",
                "tableId": "newtable"
            },
            "description": "a table partitioned by transaction_date",
            "schema": {
                "fields": [
                    {
                        "name": "transaction_id",
                        "type": "INTEGER"
                    },
                    {
                        "name": "transaction_date",
                        "type": "DATE"
                    },
                    {
                        "name": "My_datetime",
                        "type": "DATETIME"
                    },
                    {
                        "name": "My_Timestamp",
                        "type": "TIMESTAMP"
                    },
                    {
                        "name": "My_STRING",
                        "type": "STRING"
                    },
                    {
                        "name": "My_FLOAT",
                        "type": "FLOAT64"
                    }

                ]
            },
            "timePartitioning": {
                "type": "DAY",
                "expirationMs": "259200000",
                "field": "transaction_date"
            },
            "numBytes": "0",
            "numLongTermBytes": "0",
            "numRows": "0",
            "creationTime": "1551211795415",
            "lastModifiedTime": "1551623603909",
            "type": "TABLE",
            "location": "US"
        };


        beforeEach(() => {
            ctx.backendSrv.datasourceRequest = jest.fn(options => {
                return Promise.resolve({data: response, status: 200});
            });
            ctx.ds.getTableFields('prj-1', 'ds-1', 'newtable', []).then(data => {
                results = data;
            });
        });

        it('should return list of all fields', () => {
            expect(results.length).toBe(6);
            expect(results[0].text).toBe('transaction_id');
            expect(results[5].text).toBe('My_FLOAT');
        });
    });
    describe('When interpolating variables', () => {
        beforeEach(() => {
            ctx.variable = {};
        });

        describe('and value is a string', () => {
            it('should return an unquoted value', () => {
                expect(ctx.ds.interpolateVariable('abc', ctx.variable)).toEqual('abc');
            });
        });
        describe('and value is a number', () => {
            it('should return an unquoted value', () => {
                expect(ctx.ds.interpolateVariable(1000, ctx.variable)).toEqual(1000);
            });
        });
        describe('and value is an array of strings', () => {
            it('should return comma separated quoted values', () => {
                expect(ctx.ds.interpolateVariable(['a', 'b', 'c'], ctx.variable)).toEqual("'a','b','c'");
            });
        });

        describe('and variable allows multi-value and is a string', () => {
            it('should return a quoted value', () => {
                ctx.variable.multi = true;
                expect(ctx.ds.interpolateVariable('abc', ctx.variable)).toEqual("'abc'");
            });
        });

        describe('and variable contains single quote', () => {
            it('should return a quoted value', () => {
                ctx.variable.multi = true;
                expect(ctx.ds.interpolateVariable("a'bc", ctx.variable)).toEqual("'a''bc'");
                expect(ctx.ds.interpolateVariable("a'b'c", ctx.variable)).toEqual("'a''b''c'");
            });
        });

        describe('and variable allows all and is a string', () => {
            it('should return a quoted value', () => {
                ctx.variable.includeAll = true;
                expect(ctx.ds.interpolateVariable('abc', ctx.variable)).toEqual("'abc'");
            });
        });
    });
    describe('When performing parseDataQuery for table', () => {
        let results;
        const response = {
            "kind": "bigquery#queryResponse",
            "schema": {
                "fields": [
                    {
                        "name": "time",
                        "type": "TIMESTAMP",
                        "mode": "NULLABLE"
                    },
                    {
                        "name": "start_station_latitude",
                        "type": "FLOAT",
                        "mode": "NULLABLE"
                    }
                ]
            },
            "jobReference": {
                "projectId": "proj-1",
                "jobId": "job_fB4qCDAO-TKg1Orc-OrkdIRxCGN5",
                "location": "US"
            },
            "totalRows": "3",
            "rows": [
                {
                    "f": [
                        {
                            "v": "1.521578851E9"
                        },
                        {
                            "v": "37.7753058"
                        }
                    ]
                },
                {
                    "f": [
                        {
                            "v": "1.521578916E9"
                        },
                        {
                            "v": "37.3322326"
                        }
                    ]
                },
                {
                    "f": [
                        {
                            "v": "1.521578927E9"
                        },
                        {
                            "v": "37.781752"
                        }
                    ]
                }
            ],
            "totalBytesProcessed": "23289520",
            "jobComplete": true,
            "cacheHit": false
        };


        results = new ResponseParser(null).parseDataQuery(response, 'table');
        it('should return a table', () => {
            expect(results.data[0].columns.length).toBe(2);
            expect(results.data[0].rows.length).toBe(3);
            expect(results.data[0].columns[0].text).toBe('time');
            expect(results.data[0].columns[0].type).toBe('TIMESTAMP');

        });
    });
    describe('When performing parseDataQuery for time_series', () => {
        let results;
        const response = {
            "kind": "bigquery#queryResponse",
            "schema": {
                "fields": [
                    {
                        "name": "time",
                        "type": "TIMESTAMP",
                        "mode": "NULLABLE"
                    },
                    {
                        "name": "start_station_latitude",
                        "type": "FLOAT",
                        "mode": "NULLABLE"
                    }
                ]
            },
            "jobReference": {
                "projectId": "proj-1",
                "jobId": "job_fB4qCDAO-TKg1Orc-OrkdIRxCGN5",
                "location": "US"
            },
            "totalRows": "3",
            "rows": [
                {
                    "f": [
                        {
                            "v": "1.521578851E9"
                        },
                        {
                            "v": "37.7753058"
                        }
                    ]
                },
                {
                    "f": [
                        {
                            "v": "1.521578916E9"
                        },
                        {
                            "v": "37.3322326"
                        }
                    ]
                },
                {
                    "f": [
                        {
                            "v": "1.521578927E9"
                        },
                        {
                            "v": "37.781752"
                        }
                    ]
                }
            ],
            "totalBytesProcessed": "23289520",
            "jobComplete": true,
            "cacheHit": false
        };


        results = new ResponseParser(null).parseDataQuery(response, 'time_series');
        it('should return a table', () => {
            expect(results.data[0].datapoints.length).toBe(3);
            expect(results.data[0].datapoints[0][0]).toBe("37.7753058");
            expect(results.data[0].datapoints[0][1]).toBe(1521578851000);
            expect(results.data[0].datapoints[2][0]).toBe("37.781752");
            expect(results.data[0].datapoints[2][1]).toBe(1521578927000);

        });
    });

    describe('When performing testDatasource', () => {
        let results;
        const response = {
            "kind": "bigquery#datasetList",
            "etag": "q6TrWWJHEC7v8Vt1T4+geg==",
            "datasets": [
                {
                    "kind": "bigquery#dataset",
                    "id": "prj-1:ds-1",
                    "datasetReference": {
                        "datasetId": "ds-1",
                        "projectId": "prj-1"
                    },
                    "location": "US"
                },
                {
                    "kind": "bigquery#dataset",
                    "id": "prj-1:ds-2",
                    "datasetReference": {
                        "datasetId": "ds-2",
                        "projectId": "prj-1"
                    },
                    "labels": {
                        "otag": "ds-2",
                    },
                    "location": "US"
                }
            ]
        };

        beforeEach(() => {
            ctx.backendSrv.datasourceRequest = jest.fn(options => {
                return Promise.resolve({data: response, status: 200});
            });
        });

        it('should test datasource', async () => {
            await ctx.ds.testDatasource().then(data => {
                results = data;
            });
            expect(results.status).toBe("success");
        });

    });
    describe('When performing testDatasource', () => {
        let results;
        const response = {
            statusText: "Failed"
        };

        beforeEach(() => {
            ctx.backendSrv.datasourceRequest = jest.fn(options => {
                return Promise.resolve({data: response, status: 400});
            });
        });

        it('should test datasource', async () => {
            await ctx.ds.testDatasource().then(data => {
                results = data;
            });
            expect(results.status).toBe("error");
            expect(results.message).toBe("Cannot connect to BigQuery API");
        });

    });
    describe('When performing getDefaultProject', () => {
        let results;
        const response = {
            "kind": "bigquery#projectList",
            "etag": "o48iuUgjDrXb++kcLl2yeQ==",
            "projects": [
                {
                    "kind": "bigquery#project",
                    "id": "prj-1",
                    "numericId": "1",
                    "projectReference": {
                        "projectId": "prj-1"
                    },
                    "friendlyName": "prj-1"
                },
                {
                    "kind": "bigquery#project",
                    "id": "prj-2",
                    "numericId": "2",
                    "projectReference": {
                        "projectId": "prj-2"
                    },
                    "friendlyName": "prj-2"
                }, {
                    "kind": "bigquery#project",
                    "id": "prj-3",
                    "numericId": "3",
                    "projectReference": {
                        "projectId": "prj-3"
                    },
                    "friendlyName": "prj-3"
                },

            ],
            "totalItems": 3
        };
        beforeEach(() => {
            ctx.ds.projectName = "";
            ctx.backendSrv.datasourceRequest = jest.fn(options => {
                return Promise.resolve({data: response, status: 200});
            });
        });


        it('should return  default projects', async() => {
            await ctx.ds.getDefaultProject().then(data => {
                results = data;
            });
            expect(results).toBe('prj-1');
        });
    });

});
