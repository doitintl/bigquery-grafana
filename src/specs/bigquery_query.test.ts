import BigQueryQuery from "../bigquery_query";

describe("BigQueryQuery", () => {
  const templateSrv = {
    replace: jest.fn(text => text)
  };

  describe("When initializing", () => {
    it("should not be in SQL mode", () => {
      const query = new BigQueryQuery({}, templateSrv);
      expect(query.target.rawQuery).toBe(false);
    });
    it("should be in SQL mode for pre query builder queries", () => {
      const query = new BigQueryQuery({ rawSql: "SELECT 1" }, templateSrv);
      expect(query.target.rawQuery).toBe(true);
    });
  });

  describe("When generating time column SQL", () => {
    const query = new BigQueryQuery({}, templateSrv);

    query.target.timeColumn = "time";
    expect(query.buildTimeColumn()).toBe("`time` AS time");
    query.target.timeColumn = '"time"';
    expect(query.buildTimeColumn()).toBe( "`\"time\"` AS time");
  });

  describe("When generating time column SQL with group by time", () => {
    let query = new BigQueryQuery(
      { timeColumn: "time", group: [{ type: "time", params: ["5m", "none"] }] },
      templateSrv
    );
    expect(query.buildTimeColumn()).toBe("$__timeGroupAlias(time,5m)");
    expect(query.buildTimeColumn(false)).toBe("$__timeGroup(time,5m)");

    query = new BigQueryQuery(
      { timeColumn: "time", group: [{ type: "time", params: ["5m", "NULL"] }] },
      templateSrv
    );
    expect(query.buildTimeColumn()).toBe("$__timeGroupAlias(time,5m,NULL)");

    query = new BigQueryQuery(
      {
        group: [{ type: "time", params: ["5m", "none"] }],
        timeColumn: "time",
        timeColumnType: "int4"
      },
      templateSrv
    );
  });

  describe("When generating metric column SQL", () => {
    const query = new BigQueryQuery({}, templateSrv);
    expect(query.buildMetricColumn()).toBe("");
    query.target.metricColumn = "host";
    expect(query.buildMetricColumn()).toBe("CAST (`host`AS String ) AS metric");
    query.target.metricColumn = '"host"';
    expect(query.buildMetricColumn()).toBe( "CAST (`\"host\"`AS String ) AS metric");
  });

  describe("When generating value column SQL", () => {
    const query = new BigQueryQuery({}, templateSrv);
    let column = [{ type: "column", params: ["value"] }];
    expect(query.buildValueColumn(column)).toBe("`value`");
    column = [
      { type: "column", params: ["value"] },
      { type: "alias", params: ["alias"] }
    ];
    expect(query.buildValueColumn(column)).toBe("`value` AS alias");
    column = [
      { type: "column", params: ["v"] },
      { type: "alias", params: ["a"] },
      { type: "aggregate", params: ["max"] }
    ];
    expect(query.buildValueColumn(column)).toBe("max(`v`) AS a");
    column = [
      { type: "column", params: ["v"] },
      { type: "alias", params: ["a"] },
      { type: "window", params: ["increase"] }
    ];
    expect(query.buildValueColumn(column)).toBe(
      "`v` as tmpv, (CASE WHEN `v` >= lag(`v`) OVER (PARTITION BY -- time -- ORDER BY `-- time --`) " +
        "THEN `v` - lag(`v`) OVER (PARTITION BY -- time -- ORDER BY `-- time --`) " +
        "WHEN lag(`v`) OVER (PARTITION BY -- time -- ORDER BY `-- time --`) IS NULL THEN NULL ELSE `v` END) AS a"
    );

    column = [
      { type: "column", params: ["v"] },
      { type: "alias", params: ["a"] },
      { type: "window", params: ["delta"] }
    ];
    expect(query.buildValueColumn(column)).toBe(
      "`v` as tmpv, `v` - lag(`v`) OVER (PARTITION BY -- time -- ORDER BY `-- time --`) AS a"
    );
    column = [
      { type: "column", params: ["v"] },
      { type: "alias", params: ["a"] },
      { type: "window", params: ["rate"] }
    ];
    query.target.timeColumn = "timC";
    expect(query.buildValueColumn(column)).toBe(
      "`v` as tmpv, (CASE WHEN `v` >= lag(`v`) OVER (PARTITION BY timC ORDER BY `timC`) THEN `v` - lag(`v`) OVER (PARTITION BY timC ORDER BY `timC`) WHEN lag(`v`) OVER (PARTITION BY timC ORDER BY `timC`) IS NULL THEN NULL ELSE `v` END)/(UNIX_SECONDS(`timC`) -UNIX_SECONDS(  lag(`timC`) OVER (PARTITION BY timC ORDER BY `timC`))) AS a"
    );
    column = [
      { type: "column", params: ["v"] },
      { type: "alias", params: ["a"] },
      { type: "window", params: ["rate"] },
      { type: "aggregate", params: ["first"] }
    ];
    query.target.timeColumn = "timC";
    expect(query.buildValueColumn(column)).toBe(
      "first(`v`,timC) as tmpv, (CASE WHEN first(`v`,timC) >= lag(first(`v`,timC)) OVER (PARTITION BY timC ORDER BY `timC`) THEN first(`v`,timC) - lag(first(`v`,timC)) OVER (PARTITION BY timC ORDER BY `timC`) WHEN lag(first(`v`,timC)) OVER (PARTITION BY timC ORDER BY `timC`) IS NULL THEN NULL ELSE first(`v`,timC) END)/(UNIX_SECONDS(`timC`) -UNIX_SECONDS(  lag(`timC`) OVER (PARTITION BY timC ORDER BY `timC`))) AS a"
    );
    column = [
      { type: "column", params: ["v"] },
      { type: "alias", params: ["a"] },
      { type: "window", params: ["rate"] },
      { type: "percentile", params: ["p1", "p2"] }
    ];
    query.target.timeColumn = "timC";
    expect(query.buildValueColumn(column)).toBe(
      "p1(p2) WITHIN GROUP (ORDER BY `v`) as tmpv, (CASE WHEN p1(p2) WITHIN GROUP (ORDER BY `v`) >= lag(p1(p2) WITHIN GROUP (ORDER BY `v`)) OVER (PARTITION BY timC ORDER BY `timC`) THEN p1(p2) WITHIN GROUP (ORDER BY `v`) - lag(p1(p2) WITHIN GROUP (ORDER BY `v`)) OVER (PARTITION BY timC ORDER BY `timC`) WHEN lag(p1(p2) WITHIN GROUP (ORDER BY `v`)) OVER (PARTITION BY timC ORDER BY `timC`) IS NULL THEN NULL ELSE p1(p2) WITHIN GROUP (ORDER BY `v`) END)/(UNIX_SECONDS(`timC`) -UNIX_SECONDS(  lag(`timC`) OVER (PARTITION BY timC ORDER BY `timC`))) AS a"
    );

    column = [
      { type: "column", params: ["v"] },
      { type: "alias", params: ["a"] },
      { type: "moving_window", params: ["moving_window"] }
    ];
    expect(query.buildValueColumn(column)).toBe(
      "`v` as tmpv, `v` as tmp`v`, moving_window(`v`) OVER (PARTITION BY timC ORDER BY `timC` ROWS undefined PRECEDING) AS a"
    );
    column = [
      { type: "column", params: ["v"] },
      { type: "alias", params: ["a"] },
      { type: "moving_window", params: ["moving_window"] },
      { type: "timeshift", params: ["zz"] }
    ];
    expect(query.buildValueColumn(column)).toBe(
      "`v` as tmpv, `v` as tmp`v`, moving_window(`v`) OVER (PARTITION BY timC ORDER BY `timC` ROWS undefined PRECEDING) AS a $__timeShifting(zz)"
    );
  });

  describe("When generating value column SQL with metric column", () => {
    const query = new BigQueryQuery({}, templateSrv);
    query.target.metricColumn = "host";

    let column = [{ type: "column", params: ["value"] }];
    expect(query.buildValueColumn(column)).toBe("`value`");
    column = [
      { type: "column", params: ["value"] },
      { type: "alias", params: ["alias"] }
    ];
    expect(query.buildValueColumn(column)).toBe("`value` AS alias");
    column = [
      { type: "column", params: ["v"] },
      { type: "alias", params: ["a"] },
      { type: "aggregate", params: ["max"] }
    ];
    expect(query.buildValueColumn(column)).toBe("max(`v`) AS a");
    column = [
      { type: "column", params: ["v"] },
      { type: "alias", params: ["a"] },
      { type: "window", params: ["increase"] }
    ];
    expect(query.buildValueColumn(column)).toBe(
      "`v` as tmpv, (CASE WHEN `v` >= lag(`v`) OVER (PARTITION BY -- time --,host ORDER BY `-- time --`) THEN `v` - lag(`v`) OVER (PARTITION BY -- time --,host ORDER BY `-- time --`) WHEN lag(`v`) OVER (PARTITION BY -- time --,host ORDER BY `-- time --`) IS NULL THEN NULL ELSE `v` END) AS a"
    );
    column = [
      { type: "column", params: ["v"] },
      { type: "alias", params: ["a"] },
      { type: "aggregate", params: ["max"] },
      { type: "window", params: ["increase"] }
    ];
    expect(query.buildValueColumn(column)).toBe(
      "max(`v`) as tmpv, (CASE WHEN max(`v`) >= lag(max(`v`)) OVER (PARTITION BY -- time --,host ORDER BY `-- time --`) THEN max(`v`) - lag(max(`v`)) OVER (PARTITION BY -- time --,host ORDER BY `-- time --`) WHEN lag(max(`v`)) OVER (PARTITION BY -- time --,host ORDER BY `-- time --`) IS NULL THEN NULL ELSE max(`v`) END) AS a"
    );
  });

  describe("When generating WHERE clause", () => {
    const query = new BigQueryQuery({ where: [] }, templateSrv);

    expect(query.buildWhereClause()).toBe("");

    query.target.timeColumn = "t";
    query.target.where = [{ type: "macro", name: "$__timeFilter" }];
    expect(query.buildWhereClause()).toBe("\nWHERE\n  $__timeFilter(t)");

    query.target.where = [{ type: "expression", params: ["v", "=", "1"] }];
    expect(query.buildWhereClause()).toBe("\nWHERE\n  v = 1");

    query.target.where = [
      { type: "macro", name: "$__timeFilter" },
      { type: "expression", params: ["v", "=", "1"] }
    ];
    expect(query.buildWhereClause()).toBe(
      "\nWHERE\n  $__timeFilter(t) AND\n  v = 1"
    );
  });

  describe("When generating GROUP BY clause", () => {
    const query = new BigQueryQuery(
      { group: [], metricColumn: "none" },
      templateSrv
    );

    expect(query.buildGroupClause()).toBe("");
    query.target.group = [{ type: "time", params: ["5m"] }];
    expect(query.buildGroupClause()).toBe("\nGROUP BY 1,2");
    query.target.metricColumn = "m";
    query.isAggregate = true;
    expect(query.buildGroupClause()).toBe("\nGROUP BY 1,2");
  });

  describe("When generating complete statement", () => {
    const target = {
      select: [[{ type: "column", params: ["value"] }]],
      table: "table",
      timeColumn: "t",
      where: [],
    };
    let result =
      "#standardSQL\nSELECT\n `t` AS time,\n  `value`\nFROM `undefined.undefined.table`\nORDER BY 1";
    const query = new BigQueryQuery(target, templateSrv);

    expect(query.buildQuery()).toBe(result);

    query.target.metricColumn = "m";
    result =
      "#standardSQL\nSELECT\n `t` AS time,\n  CAST (`m`AS String ) AS metric,\n  `value`\nFROM `undefined.undefined.table`\nORDER BY 1,2";
    expect(query.buildQuery()).toBe(result);
  });

  describe("escapeLiteral", () => {
    const res = BigQueryQuery.escapeLiteral("'a");
    expect(BigQueryQuery.escapeLiteral("'a")).toBe("''a");
  });
  describe("macros", () => {
    const target = {
      rawSql:
        "$__timeGroupAlias(start_date,1d), $__timeGroup(start_date,1min) WHERE $__timeFilter(start_date)",
      select: [[{ type: "column", params: ["value"] }]],
      table: "table",
      timeColumn: "t",
      where: []
    };
    const query = new BigQueryQuery(target, templateSrv);
    const options = {
      dashboardId: null,
      interval: "12h",
      intervalMs: 43200000,
      panelId: 2,
      range: {
        from: "2017-03-24T07:20:12.788Z",
        raw: { from: "now-2y", to: "now" },
        to: "2019-03-24T08:20:12.788Z"
      },
      rangeRaw: { from: "now-2y", to: "now" },
      timezone: "browser",
      targets: [
        {
          refId: "A",
          format: "time_series",
          timeColumn: "start_date",
          metricColumn: "none",
          group: [{ type: "time", params: ["$__interval", "none"] }],
          where: [{ type: "macro", name: "$__timeFilter", params: [] }],
          select: [
            [
              { type: "column", params: ["trip_id"] },
              { type: "aggregate", params: ["count"] },
              {
                params: ["trip_id"],
                type: "alias"
              }
            ]
          ],
          rawQuery: false,
          rawSql:
            "#standardSQL\nSELECT\n $__timeGroupAlias(start_date,$__interval),\n  count(trip_id) AS trip_id\nFROM sss.bikeshare_trips\nWHERE\n  $__timeFilter(start_date)\nGROUP BY 1\nORDER BY 1",
          project: "aviv-playground",
          dataset: "sss",
          table: "bikeshare_trips"
        }
      ],
      maxDataPoints: 960,
      scopedVars: {
        __interval: { text: "12h", value: "12h" },
        __interval_ms: { text: 43200000, value: 43200000 }
      }
    };
    it("Check macros", () => {
      expect(query.expend_macros(options)).toBe(
        "TIMESTAMP_SECONDS(DIV(UNIX_SECONDS(`t`), 86400) * 86400)"
      );
      target.rawSql =
        "$__timeGroupAlias(start_date,1min)";
      expect(query.expend_macros(options)).toBe(
        "TIMESTAMP_SECONDS(DIV(UNIX_SECONDS(`t`), 60) * 60)"
      );
      target.rawSql =
        "$__timeGroup(start_date,1w)";
      expect(query.expend_macros(options)).toBe(
        "TIMESTAMP_SECONDS(DIV(UNIX_SECONDS(`t`), 604800) * 604800))"
      );
      target.rawSql =
        "$__timeGroupAlias(start_date,1h)";
      expect(query.expend_macros(options)).toBe(
        "TIMESTAMP_SECONDS(DIV(UNIX_SECONDS(`t`), 3600) * 3600)"
      );
    });
  });

  describe("formatDateToString", () => {
    const date1 = new Date("December 17, 1995 03:24:00");
    expect(BigQueryQuery.formatDateToString(date1, "-", true)).toBe(
      "1995-12-17 03:24:00"
    );
  });

  describe("getIntervalStr", () => {
    const target = {
      rawSql:
        "$__timeGroupAlias(start_date,1d), $__timeGroup(start_date,1min) WHERE $__timeFilter(start_date)",
      select: [[{ type: "column", params: ["value"] }]],
      table: "table",
      timeColumn: "my_data",
      where: []
    };
    const query = new BigQueryQuery(target, templateSrv);
    expect(query.getIntervalStr("1s", "0")).toBe(
      "TIMESTAMP_SECONDS(DIV(UNIX_SECONDS(`my_data`), 1) * 1)"
    );
    expect(query.getIntervalStr("1min", "0")).toBe(
      "TIMESTAMP_SECONDS(DIV(UNIX_SECONDS(`my_data`), 60) * 60)"
    );
    expect(query.getIntervalStr("1h", "1s")).toBe(
      "TIMESTAMP_SECONDS(DIV(UNIX_SECONDS(`my_data`), 3600) * 3600)"
    );
    expect(query.getIntervalStr("1d", "1s")).toBe(
      "TIMESTAMP_SECONDS(DIV(UNIX_SECONDS(`my_data`), 86400) * 86400)"
    );
    expect(query.getIntervalStr("1w", "1d")).toBe(
      "TIMESTAMP_SECONDS(DIV(UNIX_SECONDS(`my_data`), 604800) * 604800)"
    );
    expect(query.getIntervalStr("1m", "1d")).toBe(
      "TIMESTAMP(  (PARSE_DATE( \"%Y-%m-%d\",CONCAT( CAST((EXTRACT(YEAR FROM `my_data`)) AS STRING),'-',CAST((EXTRACT(MONTH FROM `my_data`)) AS STRING),'-','01'))))"
    );
    expect(query.getIntervalStr("1y", "2d")).toBe(
      "TIMESTAMP_SECONDS(DIV(UNIX_SECONDS(`my_data`), 31536000) * 31536000)"
    );
  });

  describe("getUnixSecondsFromString", () => {
    expect(BigQueryQuery.getUnixSecondsFromString("5s")).toBe(5);
    expect(BigQueryQuery.getUnixSecondsFromString("2min")).toBe(120);
    expect(BigQueryQuery.getUnixSecondsFromString("1h")).toBe(3600);
    expect(BigQueryQuery.getUnixSecondsFromString("1d")).toBe(86400);
    expect(BigQueryQuery.getUnixSecondsFromString("1w")).toBe(604800);
    expect(BigQueryQuery.getUnixSecondsFromString("1m")).toBe(2629743);
    expect(BigQueryQuery.getUnixSecondsFromString("1y")).toBe(31536000);
    expect(BigQueryQuery.getUnixSecondsFromString("1z")).toBe(0);
  });

  describe("replaceTimeShift", () => {
    expect(BigQueryQuery.replaceTimeShift("$__timeShifting(1d)")).toBe("");
  });
  describe("getTimeShift", () => {
    expect(BigQueryQuery.getTimeShift("$__timeShifting(1d)")).toBe("1d");
    expect(BigQueryQuery.getTimeShift("$__timeShifting(1d")).toBe(null);
  });
});
