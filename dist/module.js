define(["app/core/app_events","app/plugins/sdk","lodash"], function(__WEBPACK_EXTERNAL_MODULE_grafana_app_core_app_events__, __WEBPACK_EXTERNAL_MODULE_grafana_app_plugins_sdk__, __WEBPACK_EXTERNAL_MODULE_lodash__) { return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./module.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../node_modules/tslib/tslib.es6.js":
/*!******************************************!*\
  !*** ../node_modules/tslib/tslib.es6.js ***!
  \******************************************/
/*! exports provided: __extends, __assign, __rest, __decorate, __param, __metadata, __awaiter, __generator, __exportStar, __values, __read, __spread, __await, __asyncGenerator, __asyncDelegator, __asyncValues, __makeTemplateObject, __importStar, __importDefault */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__extends", function() { return __extends; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__assign", function() { return __assign; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__rest", function() { return __rest; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__decorate", function() { return __decorate; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__param", function() { return __param; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__metadata", function() { return __metadata; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__awaiter", function() { return __awaiter; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__generator", function() { return __generator; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__exportStar", function() { return __exportStar; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__values", function() { return __values; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__read", function() { return __read; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__spread", function() { return __spread; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__await", function() { return __await; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__asyncGenerator", function() { return __asyncGenerator; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__asyncDelegator", function() { return __asyncDelegator; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__asyncValues", function() { return __asyncValues; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__makeTemplateObject", function() { return __makeTemplateObject; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__importStar", function() { return __importStar; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__importDefault", function() { return __importDefault; });
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    }
    return __assign.apply(this, arguments);
}

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __exportStar(m, exports) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}

function __values(o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};

function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result.default = mod;
    return result;
}

function __importDefault(mod) {
    return (mod && mod.__esModule) ? mod : { default: mod };
}


/***/ }),

/***/ "./bigquery_query.ts":
/*!***************************!*\
  !*** ./bigquery_query.ts ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = __webpack_require__(/*! lodash */ "lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var BigQueryQuery =
/** @class */
function () {
  /** @ngInject */
  function BigQueryQuery(target, templateSrv, scopedVars) {
    this.target = target;
    this.templateSrv = templateSrv;
    this.scopedVars = scopedVars;
    target.format = target.format || 'time_series';
    target.timeColumn = target.timeColumn || 'time';
    target.metricColumn = target.metricColumn || 'none';
    target.group = target.group || [];
    target.where = target.where || [{
      type: 'macro',
      name: '$__timeFilter',
      params: []
    }];
    target.select = target.select || [[{
      type: 'column',
      params: ['value']
    }]]; // handle pre query gui panels gracefully

    if (!('rawQuery' in this.target)) {
      if ('rawSql' in target) {
        // pre query gui panel
        target.rawQuery = true;
      } else {
        // new panel
        target.rawQuery = false;
      }
    } // give interpolateQueryStr access to this


    this.interpolateQueryStr = this.interpolateQueryStr.bind(this);
  } // remove identifier quoting from identifier to use in metadata queries


  BigQueryQuery.prototype.unquoteIdentifier = function (value) {
    if (value[0] === '"' && value[value.length - 1] === '"') {
      return value.substring(1, value.length - 1).replace(/""/g, '"');
    } else {
      return value;
    }
  };

  BigQueryQuery.prototype.quoteIdentifier = function (value) {
    return '"' + String(value).replace(/"/g, '""') + '"';
  };

  BigQueryQuery.prototype.quoteLiteral = function (value) {
    return "'" + String(value).replace(/'/g, "''") + "'";
  };

  BigQueryQuery.prototype.escapeLiteral = function (value) {
    return String(value).replace(/'/g, "''");
  };

  BigQueryQuery.prototype.hasTimeGroup = function () {
    return _lodash2.default.find(this.target.group, function (g) {
      return g.type === 'time';
    });
  };

  BigQueryQuery.prototype.hasMetricColumn = function () {
    return this.target.metricColumn !== 'none';
  };

  BigQueryQuery.prototype.interpolateQueryStr = function (value, variable, defaultFormatFn) {
    // if no multi or include all do not regexEscape
    if (!variable.multi && !variable.includeAll) {
      return this.escapeLiteral(value);
    }

    if (typeof value === 'string') {
      return this.quoteLiteral(value);
    }

    var escapedValues = _lodash2.default.map(value, this.quoteLiteral);

    return escapedValues.join(',');
  };

  BigQueryQuery.prototype.render = function (interpolate) {
    var target = this.target; // new query with no table set yet

    if (!this.target.rawQuery && !('table' in this.target)) {
      return '';
    }

    if (!target.rawQuery) {
      target.rawSql = this.buildQuery();
    }

    if (interpolate) {
      return this.templateSrv.replace(target.rawSql, this.scopedVars, this.interpolateQueryStr);
    } else {
      return target.rawSql;
    }
  };

  BigQueryQuery.prototype.hasUnixEpochTimecolumn = function () {
    return ['int4', 'int8', 'float4', 'float8', 'numeric'].indexOf(this.target.timeColumnType) > -1;
  };

  BigQueryQuery.prototype.buildTimeColumn = function (alias) {
    if (alias === void 0) {
      alias = true;
    }

    var timeGroup = this.hasTimeGroup();
    var query;
    var macro = '$__timeGroup';

    if (timeGroup) {
      var args = void 0;

      if (timeGroup.params.length > 1 && timeGroup.params[1] !== 'none') {
        args = timeGroup.params.join(',');
      } else {
        args = timeGroup.params[0];
      }

      if (this.hasUnixEpochTimecolumn()) {
        macro = '$__unixEpochGroup';
      }

      if (alias) {
        macro += 'Alias';
      }

      query = macro + '(' + this.target.timeColumn + ',' + args + ')';
    } else {
      query = this.target.timeColumn;

      if (alias) {
        query += ' AS time';
      }
    }

    return query;
  };

  BigQueryQuery.prototype.buildMetricColumn = function () {
    if (this.hasMetricColumn()) {
      return this.target.metricColumn + ' AS metric';
    }

    return '';
  };

  BigQueryQuery.prototype.buildValueColumns = function () {
    var query = '';

    for (var _i = 0, _a = this.target.select; _i < _a.length; _i++) {
      var column = _a[_i];
      query += ',\n  ' + this.buildValueColumn(column);
    }

    return query;
  };

  BigQueryQuery.prototype.buildValueColumn = function (column) {
    var query = '';

    var columnName = _lodash2.default.find(column, function (g) {
      return g.type === 'column';
    });

    query = columnName.params[0];

    var aggregate = _lodash2.default.find(column, function (g) {
      return g.type === 'aggregate' || g.type === 'percentile';
    });

    var windows = _lodash2.default.find(column, function (g) {
      return g.type === 'window' || g.type === 'moving_window';
    });

    if (aggregate) {
      var func = aggregate.params[0];

      switch (aggregate.type) {
        case 'aggregate':
          if (func === 'first' || func === 'last') {
            query = func + '(' + query + ',' + this.target.timeColumn + ')';
          } else {
            query = func + '(' + query + ')';
          }

          break;

        case 'percentile':
          query = func + '(' + aggregate.params[1] + ') WITHIN GROUP (ORDER BY ' + query + ')';
          break;
      }
    }

    if (windows) {
      var overParts = [];

      if (this.hasMetricColumn()) {
        overParts.push('PARTITION BY ' + this.target.metricColumn);
      }

      overParts.push('ORDER BY ' + this.buildTimeColumn(false));
      var over = overParts.join(' ');
      var curr = void 0;
      var prev = void 0;

      switch (windows.type) {
        case 'window':
          switch (windows.params[0]) {
            case 'delta':
              curr = query;
              prev = 'lag(' + curr + ') OVER (' + over + ')';
              query = curr + ' - ' + prev;
              break;

            case 'increase':
              curr = query;
              prev = 'lag(' + curr + ') OVER (' + over + ')';
              query = '(CASE WHEN ' + curr + ' >= ' + prev + ' THEN ' + curr + ' - ' + prev;
              query += ' WHEN ' + prev + ' IS NULL THEN NULL ELSE ' + curr + ' END)';
              break;

            case 'rate':
              var timeColumn = this.target.timeColumn;

              if (aggregate) {
                timeColumn = 'min(' + timeColumn + ')';
              }

              curr = query;
              prev = 'lag(' + curr + ') OVER (' + over + ')';
              query = '(CASE WHEN ' + curr + ' >= ' + prev + ' THEN ' + curr + ' - ' + prev;
              query += ' WHEN ' + prev + ' IS NULL THEN NULL ELSE ' + curr + ' END)';
              query += '/extract(epoch from ' + timeColumn + ' - lag(' + timeColumn + ') OVER (' + over + '))';
              break;

            default:
              query = windows.params[0] + '(' + query + ') OVER (' + over + ')';
              break;
          }

          break;

        case 'moving_window':
          query = windows.params[0] + '(' + query + ') OVER (' + over + ' ROWS ' + windows.params[1] + ' PRECEDING)';
          break;
      }
    }

    var alias = _lodash2.default.find(column, function (g) {
      return g.type === 'alias';
    });

    if (alias) {
      query += ' AS ' + this.quoteIdentifier(alias.params[0]);
    }

    return query;
  };

  BigQueryQuery.prototype.buildWhereClause = function () {
    var _this = this;

    var query = '';

    var conditions = _lodash2.default.map(this.target.where, function (tag, index) {
      switch (tag.type) {
        case 'macro':
          return tag.name + '(' + _this.target.timeColumn + ')';
          break;

        case 'expression':
          return tag.params.join(' ');
          break;
      }
    });

    if (conditions.length > 0) {
      query = '\nWHERE\n  ' + conditions.join(' AND\n  ');
    }

    return query;
  };

  BigQueryQuery.prototype.buildGroupClause = function () {
    var query = '';
    var groupSection = '';

    for (var i = 0; i < this.target.group.length; i++) {
      var part = this.target.group[i];

      if (i > 0) {
        groupSection += ', ';
      }

      if (part.type === 'time') {
        groupSection += '1';
      } else {
        groupSection += part.params[0];
      }
    }

    if (groupSection.length) {
      query = '\nGROUP BY ' + groupSection;

      if (this.hasMetricColumn()) {
        query += ',2';
      }
    }

    return query;
  };

  BigQueryQuery.prototype.buildQuery = function () {
    var query = '#standardSQL';
    query += '\n  ' + 'SELECT';
    query += '\n  ' + this.buildTimeColumn();

    if (this.hasMetricColumn()) {
      query += ',\n  ' + this.buildMetricColumn();
    }

    query += this.buildValueColumns();
    query += '\nFROM ' + this.target.dataset + "." + this.target.table;
    query += this.buildWhereClause();
    query += this.buildGroupClause();
    query += '\nORDER BY 1';

    if (this.hasMetricColumn()) {
      query += ',2';
    }

    query += '\nLIMIT 10שפן צשס מוצנקר םכ רקדוךאד' + '00';
    console.log(query);
    return query;
  };

  BigQueryQuery.prototype.expend_macros = function (options) {
    if (this.target.rawSql) {
      var q = this.replaceTimeFilters(options);
      return q;
    }
  };

  BigQueryQuery.prototype.replaceTimeFilters = function (options) {
    var from = "TIMESTAMP_MILLIS (" + options.range.from.valueOf().toString() + ")";
    var to = "TIMESTAMP_MILLIS (" + options.range.to.valueOf().toString() + ")";
    var range = this.target.timeColumn + ' BETWEEN ' + from + ' AND ' + to;
    return this.target.rawSql.replace(/\$__timeFilter\(([\w_]+)\)/g, range);
  };

  return BigQueryQuery;
}();

exports.default = BigQueryQuery;

/***/ }),

/***/ "./config_ctrl.ts":
/*!************************!*\
  !*** ./config_ctrl.ts ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var BigQueryConfigCtrl =
/** @class */
function () {
  /** @ngInject */
  function BigQueryConfigCtrl(datasourceSrv) {
    this.validationErrors = [];
    this.defaultAuthenticationType = 'jwt';
    this.datasourceSrv = datasourceSrv;
    this.current.jsonData = this.current.jsonData || {};
    this.current.jsonData.authenticationType = this.current.jsonData.authenticationType ? this.current.jsonData.authenticationType : this.defaultAuthenticationType;
    this.current.secureJsonData = this.current.secureJsonData || {};
    this.current.secureJsonFields = this.current.secureJsonFields || {};
    this.authenticationTypes = [{
      key: this.defaultAuthenticationType,
      value: 'Google JWT File'
    }, {
      key: 'gce',
      value: 'GCE Default Service Account'
    }];
  }

  BigQueryConfigCtrl.prototype.save = function (jwt) {
    this.current.secureJsonData.privateKey = jwt.private_key;
    this.current.jsonData.tokenUri = jwt.token_uri;
    this.current.jsonData.clientEmail = jwt.client_email;
    this.current.jsonData.defaultProject = jwt.project_id;
  };

  BigQueryConfigCtrl.prototype.validateJwt = function (jwt) {
    this.resetValidationMessages();

    if (!jwt.private_key || jwt.private_key.length === 0) {
      this.validationErrors.push('Private key field missing in JWT file.');
    }

    if (!jwt.token_uri || jwt.token_uri.length === 0) {
      this.validationErrors.push('Token URI field missing in JWT file.');
    }

    if (!jwt.client_email || jwt.client_email.length === 0) {
      this.validationErrors.push('Client Email field missing in JWT file.');
    }

    if (!jwt.project_id || jwt.project_id.length === 0) {
      this.validationErrors.push('Project Id field missing in JWT file.');
    }

    if (this.validationErrors.length === 0) {
      this.inputDataValid = true;
      return true;
    }

    return false;
  };

  BigQueryConfigCtrl.prototype.onUpload = function (json) {
    this.jsonText = '';

    if (this.validateJwt(json)) {
      this.save(json);
    }
  };

  BigQueryConfigCtrl.prototype.onPasteJwt = function (e) {
    try {
      var json = JSON.parse(e.originalEvent.clipboardData.getData('text/plain') || this.jsonText);

      if (this.validateJwt(json)) {
        this.save(json);
      }
    } catch (error) {
      this.resetValidationMessages();
      this.validationErrors.push("Invalid json: " + error.message);
    }
  };

  BigQueryConfigCtrl.prototype.resetValidationMessages = function () {
    this.validationErrors = [];
    this.inputDataValid = false;
    this.jsonText = '';
    this.current.jsonData = Object.assign({}, {
      authenticationType: this.current.jsonData.authenticationType
    });
    this.current.secureJsonData = {};
    this.current.secureJsonFields = {};
  };

  BigQueryConfigCtrl.templateUrl = 'partials/config.html';
  return BigQueryConfigCtrl;
}();

exports.BigQueryConfigCtrl = BigQueryConfigCtrl;

/***/ }),

/***/ "./datasource.ts":
/*!***********************!*\
  !*** ./datasource.ts ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BigQueryDatasource = undefined;

var _tslib = __webpack_require__(/*! tslib */ "../node_modules/tslib/tslib.es6.js");

var tslib_1 = _interopRequireWildcard(_tslib);

var _lodash = __webpack_require__(/*! lodash */ "lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _response_parser = __webpack_require__(/*! ./response_parser */ "./response_parser.ts");

var _response_parser2 = _interopRequireDefault(_response_parser);

var _bigquery_query = __webpack_require__(/*! ./bigquery_query */ "./bigquery_query.ts");

var _bigquery_query2 = _interopRequireDefault(_bigquery_query);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

var BigQueryDatasource =
/** @class */
function () {
  /** @ngInject */
  function BigQueryDatasource(instanceSettings, backendSrv, $q, templateSrv, timeSrv) {
    var _this = this;

    this.backendSrv = backendSrv;
    this.$q = $q;
    this.templateSrv = templateSrv;
    this.timeSrv = timeSrv;

    this.interpolateVariable = function (value, variable) {
      if (typeof value === 'string') {
        if (variable.multi || variable.includeAll) {
          return _this.queryModel.quoteLiteral(value);
        } else {
          return value;
        }
      }

      if (typeof value === 'number') {
        return value;
      }

      var quotedValues = _lodash2.default.map(value, function (v) {
        return _this.queryModel.quoteLiteral(v);
      });

      return quotedValues.join(',');
    };

    this.name = instanceSettings.name;
    this.id = instanceSettings.id;
    this.jsonData = instanceSettings.jsonData;
    this.responseParser = new _response_parser2.default(this.$q);
    this.queryModel = new _bigquery_query2.default({});
    this.baseUrl = "/bigquery/";
    this.url = instanceSettings.url;
    this.interval = (instanceSettings.jsonData || {}).timeInterval || '1m';
    this.authenticationType = instanceSettings.jsonData.authenticationType || 'jwt';
    this.projectName = instanceSettings.jsonData.defaultProject || '';
  }

  BigQueryDatasource.prototype.doRequest = function (url, maxRetries) {
    if (maxRetries === void 0) {
      maxRetries = 1;
    }

    return tslib_1.__awaiter(this, void 0, void 0, function () {
      var _this = this;

      return tslib_1.__generator(this, function (_a) {
        return [2
        /*return*/
        , this.backendSrv.datasourceRequest({
          url: this.url + url,
          method: 'GET'
        }).catch(function (error) {
          if (maxRetries > 0) {
            return _this.doRequest(url, maxRetries - 1);
          }

          console.log(error);
          throw error;
        })];
      });
    });
  };

  BigQueryDatasource.prototype.doQueryRequest = function (url, query, maxRetries) {
    if (maxRetries === void 0) {
      maxRetries = 1;
    }

    return tslib_1.__awaiter(this, void 0, void 0, function () {
      var _this = this;

      return tslib_1.__generator(this, function (_a) {
        return [2
        /*return*/
        , this.backendSrv.datasourceRequest({
          url: this.url + url,
          method: 'POST',
          data: {
            query: query,
            useLegacySql: false
          }
        }).catch(function (error) {
          if (maxRetries > 0) {
            return _this.doQueryRequest(url, query, maxRetries - 1);
          }

          throw error;
        })];
      });
    });
  };

  BigQueryDatasource.prototype.query = function (options) {
    var _this = this;

    var queries = _lodash2.default.filter(options.targets, function (target) {
      return target.hide !== true;
    }).map(function (target) {
      var queryModel = new _bigquery_query2.default(target, _this.templateSrv, options.scopedVars);
      _this.queryModel = queryModel;
      return {
        refId: target.refId,
        intervalMs: options.intervalMs,
        maxDataPoints: options.maxDataPoints,
        datasourceId: _this.id,
        rawSql: queryModel.render(_this.interpolateVariable),
        format: target.format
      };
    });

    if (queries.length === 0) {
      return this.$q.when({
        data: []
      });
    }

    var q = this.queryModel.expend_macros(options);
    var path = "v2/projects/" + this.projectName + "/queries";
    return this.doQueryRequest("" + this.baseUrl + path, q).then(function (response) {
      return new _response_parser2.default(_this.$q).parseDataQuery(response);
    });
  };

  BigQueryDatasource.prototype.annotationQuery = function (options) {
    var _this = this;

    if (!options.annotation.rawQuery) {
      return this.$q.reject({
        message: 'Query missing in annotation definition'
      });
    }

    var query = {
      refId: options.annotation.name,
      datasourceId: this.id,
      rawSql: this.templateSrv.replace(options.annotation.rawQuery, options.scopedVars, this.interpolateVariable),
      format: 'table'
    };
    return this.backendSrv.datasourceRequest({
      url: '/api/tsdb/query',
      method: 'POST',
      data: {
        from: options.range.from.valueOf().toString(),
        to: options.range.to.valueOf().toString(),
        queries: [query]
      }
    }).then(function (data) {
      return _this.responseParser.transformAnnotationResponse(options, data);
    });
  };

  BigQueryDatasource.prototype.getProjects = function () {
    var _this = this;

    var path = "v2/projects";
    return this.doRequest("" + this.baseUrl + path).then(function (response) {
      return new _response_parser2.default(_this.$q).parseProjects(response);
    });
  };

  BigQueryDatasource.prototype.getDatasets = function (projectName) {
    var _this = this;

    var path = "v2/projects/" + projectName + "/datasets";
    return this.doRequest("" + this.baseUrl + path).then(function (response) {
      return new _response_parser2.default(_this.$q).parseDatasets(response);
    });
  };

  BigQueryDatasource.prototype.getTables = function (projectName, datasetName) {
    var _this = this;

    var path = "v2/projects/" + projectName + "/datasets/" + datasetName + "/tables";
    return this.doRequest("" + this.baseUrl + path).then(function (response) {
      return new _response_parser2.default(_this.$q).parseTabels(response);
    });
  };

  BigQueryDatasource.prototype.getTableFields = function (projectName, datasetName, tableName, filter) {
    var _this = this;

    var path = "v2/projects/" + projectName + "/datasets/" + datasetName + "/tables/" + tableName;
    return this.doRequest("" + this.baseUrl + path).then(function (response) {
      return new _response_parser2.default(_this.$q).parseTabelFields(response, filter);
    });
  };

  BigQueryDatasource.prototype.metricFindQuery = function (query, optionalOptions) {
    var _this = this;

    var refId = 'tempvar';

    if (optionalOptions && optionalOptions.variable && optionalOptions.variable.name) {
      refId = optionalOptions.variable.name;
    }

    var interpolatedQuery = {
      refId: refId,
      datasourceId: this.id,
      rawSql: this.templateSrv.replace(query, {}, this.interpolateVariable),
      format: 'table'
    };
    var range = this.timeSrv.timeRange();
    var data = {
      queries: [interpolatedQuery],
      from: range.from.valueOf().toString(),
      to: range.to.valueOf().toString()
    };
    return this.backendSrv.datasourceRequest({
      url: '/api/tsdb/query',
      method: 'POST',
      data: data
    }).then(function (data) {
      return _this.responseParser.parseMetricFindQueryResult(refId, data);
    });
  };

  BigQueryDatasource.prototype.getDefaultProject = function () {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
      var data, error_1;
      return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 4,, 5]);

            if (!(this.authenticationType === 'gce' || !this.projectName)) return [3
            /*break*/
            , 2];
            return [4
            /*yield*/
            , this.backendSrv.datasourceRequest({
              url: '/api/tsdb/query',
              method: 'POST',
              data: {
                queries: [{
                  refId: 'ensureDefaultProjectQuery',
                  type: 'ensureDefaultProjectQuery',
                  datasourceId: this.id
                }]
              }
            })];

          case 1:
            data = _a.sent().data;
            this.projectName = data.results.ensureDefaultProjectQuery.meta.defaultProject;
            return [2
            /*return*/
            , this.projectName];

          case 2:
            return [2
            /*return*/
            , this.projectName];

          case 3:
            return [3
            /*break*/
            , 5];

          case 4:
            error_1 = _a.sent();
            throw BigQueryDatasource.formatBigqueryError(error_1);

          case 5:
            return [2
            /*return*/
            ];
        }
      });
    });
  };

  BigQueryDatasource.prototype.testDatasource = function () {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
      var status, message, defaultErrorMessage, projectName, path, response, error_2;
      return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            defaultErrorMessage = 'Cannot connect to BigQuery API';
            _a.label = 1;

          case 1:
            _a.trys.push([1, 4, 5, 6]);

            return [4
            /*yield*/
            , this.getDefaultProject()];

          case 2:
            projectName = _a.sent();
            path = "v2/projects/" + projectName + "/datasets";
            return [4
            /*yield*/
            , this.doRequest("" + this.baseUrl + path)];

          case 3:
            response = _a.sent();

            if (response.status === 200) {
              status = 'success';
              message = 'Successfully queried the BigQuery API.';
            } else {
              status = 'error';
              message = response.statusText ? response.statusText : defaultErrorMessage;
            }

            return [3
            /*break*/
            , 6];

          case 4:
            error_2 = _a.sent();
            console.log(error_2);
            status = 'error';

            if (_lodash2.default.isString(error_2)) {
              message = error_2;
            } else {
              message = 'BigQuery: ';
              message += error_2.statusText ? error_2.statusText : defaultErrorMessage;

              if (error_2.data && error_2.data.error && error_2.data.error.code) {
                message += ': ' + error_2.data.error.code + '. ' + error_2.data.error.message;
              }
            }

            return [3
            /*break*/
            , 6];

          case 5:
            return [2
            /*return*/
            , {
              status: status,
              message: message
            }];

          case 6:
            return [2
            /*return*/
            ];
        }
      });
    });
  };

  BigQueryDatasource.formatBigqueryError = function (error) {
    var message = 'BigQuery: ';
    message += error.statusText ? error.statusText + ': ' : '';

    if (error.data && error.data.error) {
      try {
        var res = JSON.parse(error.data.error);
        message += res.error.code + '. ' + res.error.message;
      } catch (err) {
        message += error.data.error;
      }
    } else {
      message += 'Cannot connect to BigQuery API';
    }

    return message;
  };

  return BigQueryDatasource;
}();

exports.BigQueryDatasource = BigQueryDatasource;

/***/ }),

/***/ "./meta_query.ts":
/*!***********************!*\
  !*** ./meta_query.ts ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var BigQueryMetaQuery =
/** @class */
function () {
  function BigQueryMetaQuery(target, queryModel) {
    this.target = target;
    this.queryModel = queryModel;
  }

  BigQueryMetaQuery.prototype.getOperators = function (datatype) {
    switch (datatype) {
      case 'float4':
      case 'float8':
        {
          return ['=', '!=', '<', '<=', '>', '>='];
        }

      case 'text':
      case 'varchar':
      case 'char':
        {
          return ['=', '!=', '<', '<=', '>', '>=', 'IN', 'NOT IN', 'LIKE', 'NOT LIKE', '~', '~*', '!~', '!~*'];
        }

      default:
        {
          return ['=', '!=', '<', '<=', '>', '>=', 'IN', 'NOT IN'];
        }
    }
  }; // quote identifier as literal to use in metadata queries


  BigQueryMetaQuery.prototype.quoteIdentAsLiteral = function (value) {
    return this.queryModel.quoteLiteral(this.queryModel.unquoteIdentifier(value));
  };

  BigQueryMetaQuery.prototype.buildSchemaConstraint = function () {
    var query = "\ntable_schema IN (\n  SELECT\n    CASE WHEN trim(s[i]) = '\"$user\"' THEN user ELSE trim(s[i]) END\n  FROM\n    generate_series(\n      array_lower(string_to_array(current_setting('search_path'),','),1),\n      array_upper(string_to_array(current_setting('search_path'),','),1)\n    ) as i,\n    string_to_array(current_setting('search_path'),',') s\n)";
    return query;
  };

  BigQueryMetaQuery.prototype.buildTableConstraint = function (table) {
    var query = ''; // check for schema qualified table

    if (table.includes('.')) {
      var parts = table.split('.');
      query = 'table_schema = ' + this.quoteIdentAsLiteral(parts[0]);
      query += ' AND table_name = ' + this.quoteIdentAsLiteral(parts[1]);
      return query;
    } else {
      query = this.buildSchemaConstraint();
      query += ' AND table_name = ' + this.quoteIdentAsLiteral(table);
      return query;
    }
  };

  BigQueryMetaQuery.prototype.buildTableQuery = function () {
    var query = 'SELECT quote_ident(table_name) FROM information_schema.tables WHERE ';
    query += this.buildSchemaConstraint();
    query += ' ORDER BY table_name';
    return query;
  };

  BigQueryMetaQuery.prototype.buildColumnQuery = function (type) {
    var query = 'SELECT quote_ident(column_name) FROM information_schema.columns WHERE ';
    query += this.buildTableConstraint(this.target.table);

    switch (type) {
      case 'time':
        {
          query += " AND data_type IN ('timestamp without time zone','timestamp with time zone','bigint','integer','double precision','real')";
          break;
        }

      case 'metric':
        {
          query += " AND data_type IN ('text','character','character varying')";
          break;
        }

      case 'value':
        {
          query += " AND data_type IN ('bigint','integer','double precision','real')";
          query += ' AND column_name <> ' + this.quoteIdentAsLiteral(this.target.timeColumn);
          break;
        }

      case 'group':
        {
          query += " AND data_type IN ('text','character','character varying')";
          break;
        }
    }

    query += ' ORDER BY column_name';
    return query;
  };

  BigQueryMetaQuery.prototype.buildValueQuery = function (column) {
    console.log('buildValueQuery(column: string)');
    var query = 'SELECT DISTINCT quote_literal(' + column + ')';
    query += ' FROM ' + this.target.table;
    query += ' WHERE $__timeFilter(' + this.target.timeColumn + ')';
    query += ' AND ' + column + ' IS NOT NULL';
    query += ' ORDER BY 1 LIMIT 100';
    return query;
  };

  BigQueryMetaQuery.prototype.buildDatatypeQuery = function (column) {
    console.log('buildDatatypeQuery(column: string)');
    var query = 'SELECT udt_name FROM information_schema.columns WHERE ';
    query += this.buildTableConstraint(this.target.table);
    query += ' AND column_name = ' + this.quoteIdentAsLiteral(column);
    return query;
  };

  BigQueryMetaQuery.prototype.buildAggregateQuery = function () {
    var query = 'SELECT DISTINCT proname FROM pg_aggregate ';
    query += 'INNER JOIN pg_proc ON pg_aggregate.aggfnoid = pg_proc.oid ';
    query += 'INNER JOIN pg_type ON pg_type.oid=pg_proc.prorettype ';
    query += "WHERE pronargs=1 AND typname IN ('float8') AND aggkind='n' ORDER BY 1";
    return query;
  };

  return BigQueryMetaQuery;
}();

exports.BigQueryMetaQuery = BigQueryMetaQuery;

/***/ }),

/***/ "./module.ts":
/*!*******************!*\
  !*** ./module.ts ***!
  \*******************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AnnotationsQueryCtrl = exports.ConfigCtrl = exports.QueryCtrl = exports.Datasource = exports.BigQueryDatasource = undefined;

var _datasource = __webpack_require__(/*! ./datasource */ "./datasource.ts");

var _query_ctrl = __webpack_require__(/*! ./query_ctrl */ "./query_ctrl.ts");

var _config_ctrl = __webpack_require__(/*! ./config_ctrl */ "./config_ctrl.ts");

var defaultQuery = "SELECT\n  extract(epoch from time_column) AS time,\n  text_column as text,\n  tags_column as tags\nFROM\n  metric_table\nWHERE\n  $__timeFilter(time_column)\n";

var BigQueryAnnotationsQueryCtrl =
/** @class */
function () {
  /** @ngInject */
  function BigQueryAnnotationsQueryCtrl() {
    this.annotation.rawQuery = this.annotation.rawQuery || defaultQuery;
  }

  BigQueryAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';
  return BigQueryAnnotationsQueryCtrl;
}();

exports.BigQueryDatasource = _datasource.BigQueryDatasource;
exports.Datasource = _datasource.BigQueryDatasource;
exports.QueryCtrl = _query_ctrl.BigQueryQueryCtrl;
exports.ConfigCtrl = _config_ctrl.BigQueryConfigCtrl;
exports.AnnotationsQueryCtrl = BigQueryAnnotationsQueryCtrl;

/***/ }),

/***/ "./query_ctrl.ts":
/*!***********************!*\
  !*** ./query_ctrl.ts ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BigQueryQueryCtrl = undefined;

var _tslib = __webpack_require__(/*! tslib */ "../node_modules/tslib/tslib.es6.js");

var tslib_1 = _interopRequireWildcard(_tslib);

var _lodash = __webpack_require__(/*! lodash */ "lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _app_events = __webpack_require__(/*! grafana/app/core/app_events */ "grafana/app/core/app_events");

var _app_events2 = _interopRequireDefault(_app_events);

var _meta_query = __webpack_require__(/*! ./meta_query */ "./meta_query.ts");

var _sdk = __webpack_require__(/*! grafana/app/plugins/sdk */ "grafana/app/plugins/sdk");

var _bigquery_query = __webpack_require__(/*! ./bigquery_query */ "./bigquery_query.ts");

var _bigquery_query2 = _interopRequireDefault(_bigquery_query);

var _sql_part = __webpack_require__(/*! ./sql_part */ "./sql_part.ts");

var _sql_part2 = _interopRequireDefault(_sql_part);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

var defaultQuery = "SELECT\n  $__time(time_column),\n  value1\nFROM\n  metric_table\nWHERE\n  $__timeFilter(time_column)\n";

var BigQueryQueryCtrl =
/** @class */
function (_super) {
  tslib_1.__extends(BigQueryQueryCtrl, _super);
  /** @ngInject */


  function BigQueryQueryCtrl($scope, $injector, templateSrv, $q, uiSegmentSrv) {
    var _this = _super.call(this, $scope, $injector) || this;

    _this.templateSrv = templateSrv;
    _this.$q = $q;
    _this.uiSegmentSrv = uiSegmentSrv;
    _this.target = _this.target;
    _this.queryModel = new _bigquery_query2.default(_this.target, templateSrv, _this.panel.scopedVars);
    _this.metaBuilder = new _meta_query.BigQueryMetaQuery(_this.target, _this.queryModel);

    _this.updateProjection();

    _this.formats = [{
      text: 'Time series',
      value: 'time_series'
    }, {
      text: 'Table',
      value: 'table'
    }];

    if (!_this.target.rawSql) {
      // special handling when in table panel
      if (_this.panelCtrl.panel.type === 'table') {
        _this.target.format = 'table';
        _this.target.rawSql = 'SELECT 1';
        _this.target.rawQuery = true;
      } else {
        _this.target.rawSql = defaultQuery;
      }
    }

    if (!_this.target.project) {
      _this.projectSegment = uiSegmentSrv.newSegment({
        value: 'select project',
        fake: true
      });
    } else {
      _this.projectSegment = uiSegmentSrv.newSegment(_this.target.project);
    }

    if (!_this.target.dataset) {
      _this.datasetSegment = uiSegmentSrv.newSegment({
        value: 'select dataset',
        fake: true
      });
    } else {
      _this.datasetSegment = uiSegmentSrv.newSegment(_this.target.dataset);
    }

    if (!_this.target.table) {
      _this.tableSegment = uiSegmentSrv.newSegment({
        value: 'select table',
        fake: true
      });
    } else {
      _this.tableSegment = uiSegmentSrv.newSegment(_this.target.table);
    }

    _this.timeColumnSegment = uiSegmentSrv.newSegment(_this.target.timeColumn);
    _this.metricColumnSegment = uiSegmentSrv.newSegment(_this.target.metricColumn);

    _this.buildSelectMenu();

    _this.whereAdd = _this.uiSegmentSrv.newPlusButton();
    _this.groupAdd = _this.uiSegmentSrv.newPlusButton();

    _this.panelCtrl.events.on('data-received', _this.onDataReceived.bind(_this), $scope);

    _this.panelCtrl.events.on('data-error', _this.onDataError.bind(_this), $scope);

    return _this;
  }

  BigQueryQueryCtrl.prototype.updateProjection = function () {
    this.selectParts = _lodash2.default.map(this.target.select, function (parts) {
      return _lodash2.default.map(parts, _sql_part2.default.create).filter(function (n) {
        return n;
      });
    });
    this.whereParts = _lodash2.default.map(this.target.where, _sql_part2.default.create).filter(function (n) {
      return n;
    });
    this.groupParts = _lodash2.default.map(this.target.group, _sql_part2.default.create).filter(function (n) {
      return n;
    });
  };

  BigQueryQueryCtrl.prototype.updatePersistedParts = function () {
    this.target.select = _lodash2.default.map(this.selectParts, function (selectParts) {
      return _lodash2.default.map(selectParts, function (part) {
        return {
          type: part.def.type,
          datatype: part.datatype,
          params: part.params
        };
      });
    });
    this.target.where = _lodash2.default.map(this.whereParts, function (part) {
      return {
        type: part.def.type,
        datatype: part.datatype,
        name: part.name,
        params: part.params
      };
    });
    this.target.group = _lodash2.default.map(this.groupParts, function (part) {
      return {
        type: part.def.type,
        datatype: part.datatype,
        params: part.params
      };
    });
  };

  BigQueryQueryCtrl.prototype.buildSelectMenu = function () {
    this.selectMenu = [];
    var aggregates = {
      text: 'Aggregate Functions',
      value: 'aggregate',
      submenu: [{
        text: 'Average',
        value: 'avg'
      }, {
        text: 'Count',
        value: 'count'
      }, {
        text: 'Maximum',
        value: 'max'
      }, {
        text: 'Minimum',
        value: 'min'
      }, {
        text: 'Sum',
        value: 'sum'
      }, {
        text: 'Standard deviation',
        value: 'stddev'
      }, {
        text: 'Variance',
        value: 'variance'
      }]
    }; // first and last aggregate are timescaledb specific

    if (this.datasource.jsonData.timescaledb === true) {
      aggregates.submenu.push({
        text: 'First',
        value: 'first'
      });
      aggregates.submenu.push({
        text: 'Last',
        value: 'last'
      });
    }

    this.selectMenu.push(aggregates); // ordered set aggregates require postgres 9.4+

    if (this.datasource.jsonData.postgresVersion >= 904) {
      var aggregates2 = {
        text: 'Ordered-Set Aggregate Functions',
        value: 'percentile',
        submenu: [{
          text: 'Percentile (continuous)',
          value: 'percentile_cont'
        }, {
          text: 'Percentile (discrete)',
          value: 'percentile_disc'
        }]
      };
      this.selectMenu.push(aggregates2);
    }

    var windows = {
      text: 'Window Functions',
      value: 'window',
      submenu: [{
        text: 'Delta',
        value: 'delta'
      }, {
        text: 'Increase',
        value: 'increase'
      }, {
        text: 'Rate',
        value: 'rate'
      }, {
        text: 'Sum',
        value: 'sum'
      }, {
        text: 'Moving Average',
        value: 'avg',
        type: 'moving_window'
      }]
    };
    this.selectMenu.push(windows);
    this.selectMenu.push({
      text: 'Alias',
      value: 'alias'
    });
    this.selectMenu.push({
      text: 'Column',
      value: 'column'
    });
  };

  BigQueryQueryCtrl.prototype.toggleEditorMode = function () {
    var _this = this;

    if (this.target.rawQuery) {
      _app_events2.default.emit('confirm-modal', {
        title: 'Warning',
        text2: 'Switching to query builder may overwrite your raw SQL.',
        icon: 'fa-exclamation',
        yesText: 'Switch',
        onConfirm: function onConfirm() {
          _this.target.rawQuery = !_this.target.rawQuery;
        }
      });
    } else {
      this.target.rawQuery = !this.target.rawQuery;
    }
  };

  BigQueryQueryCtrl.prototype.resetPlusButton = function (button) {
    var plusButton = this.uiSegmentSrv.newPlusButton();
    button.html = plusButton.html;
    button.value = plusButton.value;
  };

  BigQueryQueryCtrl.prototype.getProjectSegments = function () {
    return this.datasource.getProjects().then(this.uiSegmentSrv.transformToSegments(false)).catch(this.handleQueryError.bind(this));
  };

  BigQueryQueryCtrl.prototype.projectChanged = function () {
    this.target.project = this.projectSegment.value;
    this.datasource.projectName = this.projectSegment.value;
  };

  BigQueryQueryCtrl.prototype.getDatasetSegments = function () {
    return this.datasource.getDatasets(this.target.project).then(this.uiSegmentSrv.transformToSegments(false)).catch(this.handleQueryError.bind(this));
  };

  BigQueryQueryCtrl.prototype.datasetChanged = function () {
    this.target.dataset = this.datasetSegment.value;
  };

  BigQueryQueryCtrl.prototype.getTableSegments = function () {
    return this.datasource.getTables(this.target.project, this.target.dataset).then(this.uiSegmentSrv.transformToSegments(false)).catch(this.handleQueryError.bind(this));
  };

  BigQueryQueryCtrl.prototype.tableChanged = function () {
    var _this = this;

    this.target.table = this.tableSegment.value;
    this.target.where = [];
    this.target.group = [];
    this.updateProjection();
    var segment = this.uiSegmentSrv.newSegment('none');
    this.metricColumnSegment.html = segment.html;
    this.metricColumnSegment.value = segment.value;
    this.target.metricColumn = 'none';
    var task1 = this.getTimeColumnSegments().then(function (result) {
      // check if time column is still valid
      if (result.length > 0 && !_lodash2.default.find(result, function (r) {
        return r.text === _this.target.timeColumn;
      })) {
        var segment_1 = _this.uiSegmentSrv.newSegment(result[0].text);

        _this.timeColumnSegment.html = segment_1.html;
        _this.timeColumnSegment.value = segment_1.value;
      }

      return _this.timeColumnChanged(false);
    });
    var task2 = this.getValueColumnSegments().then(function (result) {
      if (result.length > 0) {
        _this.target.select = [[{
          type: 'column',
          params: [result[0].text]
        }]];

        _this.updateProjection();
      }
    });
    this.$q.all([task1, task2]).then(function () {
      _this.panelCtrl.refresh();
    });
  };

  BigQueryQueryCtrl.prototype.getTimeColumnSegments = function () {
    return this.datasource.getTableFields(this.target.project, this.target.dataset, this.target.table, ['DATE', 'TIMESTAMP', 'DATETIME']).then(this.uiSegmentSrv.transformToSegments(false)).catch(this.handleQueryError.bind(this));
  };

  BigQueryQueryCtrl.prototype.getValueColumnSegments = function () {
    return this.datasource.getTableFields(this.target.project, this.target.dataset, this.target.table, ['INT64', 'NUMERIC', 'FLOAT64', 'FLOAT', 'INT']).then(this.uiSegmentSrv.transformToSegments(false)).catch(this.handleQueryError.bind(this));
  };

  BigQueryQueryCtrl.prototype.timeColumnChanged = function (refresh) {
    this.target.timeColumn = this.timeColumnSegment.value;
    var partModel;
    partModel = _sql_part2.default.create({
      type: 'macro',
      name: '$__timeFilter',
      params: []
    });

    if (this.whereParts.length >= 1 && this.whereParts[0].def.type === 'macro') {
      // replace current macro
      this.whereParts[0] = partModel;
    } else {
      this.whereParts.splice(0, 0, partModel);
    }

    this.updatePersistedParts();

    if (refresh !== false) {
      this.panelCtrl.refresh();
    }
  };

  BigQueryQueryCtrl.prototype.getMetricColumnSegments = function () {
    return this.datasource.getTableFields(this.target.project, this.target.dataset, this.target.table, ['STRING', 'BYTES']).then(this.uiSegmentSrv.transformToSegments(false)).catch(this.handleQueryError.bind(this));
  };

  BigQueryQueryCtrl.prototype.metricColumnChanged = function () {
    this.target.metricColumn = this.metricColumnSegment.value;
    this.panelCtrl.refresh();
  };

  BigQueryQueryCtrl.prototype.onDataReceived = function (dataList) {//TODO fixme

    /*this.lastQueryMeta = null;
    this.lastQueryError = null;
     const anySeriesFromQuery = _.find(dataList, { refId: this.target.refId });
    if (anySeriesFromQuery) {
      this.lastQueryMeta = anySeriesFromQuery.meta;
    }*/
  };

  BigQueryQueryCtrl.prototype.onDataError = function (err) {
    if (err.data && err.data.results) {
      var queryRes = err.data.results[this.target.refId];

      if (queryRes) {
        this.lastQueryMeta = queryRes.meta;
        this.lastQueryError = queryRes.error;
      }
    }
  };

  BigQueryQueryCtrl.prototype.transformToSegments = function (config) {
    var _this = this;

    return function (results) {
      var segments = _lodash2.default.map(results, function (segment) {
        return _this.uiSegmentSrv.newSegment({
          value: segment.text,
          expandable: segment.expandable
        });
      });

      if (config.addTemplateVars) {
        for (var _i = 0, _a = _this.templateSrv.variables; _i < _a.length; _i++) {
          var variable = _a[_i];
          var value = void 0;
          value = '$' + variable.name;

          if (config.templateQuoter && variable.multi === false) {
            value = config.templateQuoter(value);
          }

          segments.unshift(_this.uiSegmentSrv.newSegment({
            type: 'template',
            value: value,
            expandable: true
          }));
        }
      }

      if (config.addNone) {
        segments.unshift(_this.uiSegmentSrv.newSegment({
          type: 'template',
          value: 'none',
          expandable: true
        }));
      }

      return segments;
    };
  };

  BigQueryQueryCtrl.prototype.findAggregateIndex = function (selectParts) {
    return _lodash2.default.findIndex(selectParts, function (p) {
      return p.def.type === 'aggregate' || p.def.type === 'percentile';
    });
  };

  BigQueryQueryCtrl.prototype.findWindowIndex = function (selectParts) {
    return _lodash2.default.findIndex(selectParts, function (p) {
      return p.def.type === 'window' || p.def.type === 'moving_window';
    });
  };

  BigQueryQueryCtrl.prototype.addSelectPart = function (selectParts, item, subItem) {
    var partType = item.value;

    if (subItem && subItem.type) {
      partType = subItem.type;
    }

    var partModel = _sql_part2.default.create({
      type: partType
    });

    if (subItem) {
      partModel.params[0] = subItem.value;
    }

    var addAlias = false;

    switch (partType) {
      case 'column':
        var parts = _lodash2.default.map(selectParts, function (part) {
          return _sql_part2.default.create({
            type: part.def.type,
            params: _lodash2.default.clone(part.params)
          });
        });

        this.selectParts.push(parts);
        break;

      case 'percentile':
      case 'aggregate':
        // add group by if no group by yet
        if (this.target.group.length === 0) {
          this.addGroup('time', '$__interval');
        }

        var aggIndex = this.findAggregateIndex(selectParts);

        if (aggIndex !== -1) {
          // replace current aggregation
          selectParts[aggIndex] = partModel;
        } else {
          selectParts.splice(1, 0, partModel);
        }

        if (!_lodash2.default.find(selectParts, function (p) {
          return p.def.type === 'alias';
        })) {
          addAlias = true;
        }

        break;

      case 'moving_window':
      case 'window':
        var windowIndex = this.findWindowIndex(selectParts);

        if (windowIndex !== -1) {
          // replace current window function
          selectParts[windowIndex] = partModel;
        } else {
          var aggIndex_1 = this.findAggregateIndex(selectParts);

          if (aggIndex_1 !== -1) {
            selectParts.splice(aggIndex_1 + 1, 0, partModel);
          } else {
            selectParts.splice(1, 0, partModel);
          }
        }

        if (!_lodash2.default.find(selectParts, function (p) {
          return p.def.type === 'alias';
        })) {
          addAlias = true;
        }

        break;

      case 'alias':
        addAlias = true;
        break;
    }

    if (addAlias) {
      // set initial alias name to column name
      partModel = _sql_part2.default.create({
        type: 'alias',
        params: [selectParts[0].params[0].replace(/"/g, '')]
      });

      if (selectParts[selectParts.length - 1].def.type === 'alias') {
        selectParts[selectParts.length - 1] = partModel;
      } else {
        selectParts.push(partModel);
      }
    }

    this.updatePersistedParts();
    this.panelCtrl.refresh();
  };

  BigQueryQueryCtrl.prototype.removeSelectPart = function (selectParts, part) {
    if (part.def.type === 'column') {
      // remove all parts of column unless its last column
      if (this.selectParts.length > 1) {
        var modelsIndex = _lodash2.default.indexOf(this.selectParts, selectParts);

        this.selectParts.splice(modelsIndex, 1);
      }
    } else {
      var partIndex = _lodash2.default.indexOf(selectParts, part);

      selectParts.splice(partIndex, 1);
    }

    this.updatePersistedParts();
  };

  BigQueryQueryCtrl.prototype.handleSelectPartEvent = function (selectParts, part, evt) {
    switch (evt.name) {
      case 'get-param-options':
        {
          switch (part.def.type) {
            case 'aggregate':
              return this.datasource.metricFindQuery(this.metaBuilder.buildAggregateQuery()).then(this.transformToSegments({})).catch(this.handleQueryError.bind(this));

            case 'column':
              return this.datasource.getTableFields(this.target.project, this.target.dataset, this.target.table, ['INT64', 'NUMERIC', 'FLOAT64']).then(this.uiSegmentSrv.transformToSegments(false)).catch(this.handleQueryError.bind(this));
          }
        }

      case 'part-param-changed':
        {
          this.updatePersistedParts();
          this.panelCtrl.refresh();
          break;
        }

      case 'action':
        {
          this.removeSelectPart(selectParts, part);
          this.panelCtrl.refresh();
          break;
        }

      case 'get-part-actions':
        {
          return this.$q.when([{
            text: 'Remove',
            value: 'remove-part'
          }]);
        }
    }
  };

  BigQueryQueryCtrl.prototype.handleGroupPartEvent = function (part, index, evt) {
    switch (evt.name) {
      case 'get-param-options':
        {
          return this.datasource.metricFindQuery(this.metaBuilder.buildColumnQuery()).then(this.transformToSegments({})).catch(this.handleQueryError.bind(this));
        }

      case 'part-param-changed':
        {
          this.updatePersistedParts();
          this.panelCtrl.refresh();
          break;
        }

      case 'action':
        {
          this.removeGroup(part, index);
          this.panelCtrl.refresh();
          break;
        }

      case 'get-part-actions':
        {
          return this.$q.when([{
            text: 'Remove',
            value: 'remove-part'
          }]);
        }
    }
  };

  BigQueryQueryCtrl.prototype.addGroup = function (partType, value) {
    var params = [value];

    if (partType === 'time') {
      params = ['$__interval', 'none'];
    }

    var partModel = _sql_part2.default.create({
      type: partType,
      params: params
    });

    if (partType === 'time') {
      // put timeGroup at start
      this.groupParts.splice(0, 0, partModel);
    } else {
      this.groupParts.push(partModel);
    } // add aggregates when adding group by


    for (var _i = 0, _a = this.selectParts; _i < _a.length; _i++) {
      var selectParts = _a[_i];

      if (!selectParts.some(function (part) {
        return part.def.type === 'aggregate';
      })) {
        var aggregate = _sql_part2.default.create({
          type: 'aggregate',
          params: ['avg']
        });

        selectParts.splice(1, 0, aggregate);

        if (!selectParts.some(function (part) {
          return part.def.type === 'alias';
        })) {
          var alias = _sql_part2.default.create({
            type: 'alias',
            params: [selectParts[0].part.params[0]]
          });

          selectParts.push(alias);
        }
      }
    }

    this.updatePersistedParts();
  };

  BigQueryQueryCtrl.prototype.removeGroup = function (part, index) {
    if (part.def.type === 'time') {
      // remove aggregations
      this.selectParts = _lodash2.default.map(this.selectParts, function (s) {
        return _lodash2.default.filter(s, function (part) {
          if (part.def.type === 'aggregate' || part.def.type === 'percentile') {
            return false;
          }

          return true;
        });
      });
    }

    this.groupParts.splice(index, 1);
    this.updatePersistedParts();
  };

  BigQueryQueryCtrl.prototype.handleWherePartEvent = function (whereParts, part, evt, index) {
    var _this = this;

    switch (evt.name) {
      case 'get-param-options':
        {
          switch (evt.param.name) {
            case 'left':
              return this.datasource.metricFindQuery(this.metaBuilder.buildColumnQuery()).then(this.transformToSegments({})).catch(this.handleQueryError.bind(this));

            case 'right':
              if (['int4', 'int8', 'float4', 'float8', 'timestamp', 'timestamptz'].indexOf(part.datatype) > -1) {
                // don't do value lookups for numerical fields
                return this.$q.when([]);
              } else {
                return this.datasource.metricFindQuery(this.metaBuilder.buildValueQuery(part.params[0])).then(this.transformToSegments({
                  addTemplateVars: true,
                  templateQuoter: function templateQuoter(v) {
                    return _this.queryModel.quoteLiteral(v);
                  }
                })).catch(this.handleQueryError.bind(this));
              }

            case 'op':
              return this.$q.when(this.uiSegmentSrv.newOperators(this.metaBuilder.getOperators(part.datatype)));

            default:
              return this.$q.when([]);
          }
        }

      case 'part-param-changed':
        {
          this.updatePersistedParts();
          this.datasource.metricFindQuery(this.metaBuilder.buildDatatypeQuery(part.params[0])).then(function (d) {
            if (d.length === 1) {
              part.datatype = d[0].text;
            }
          });
          this.panelCtrl.refresh();
          break;
        }

      case 'action':
        {
          // remove element
          whereParts.splice(index, 1);
          this.updatePersistedParts();
          this.panelCtrl.refresh();
          break;
        }

      case 'get-part-actions':
        {
          return this.$q.when([{
            text: 'Remove',
            value: 'remove-part'
          }]);
        }
    }
  };

  BigQueryQueryCtrl.prototype.getWhereOptions = function () {
    var options = [];

    if (this.queryModel.hasUnixEpochTimecolumn()) {
      options.push(this.uiSegmentSrv.newSegment({
        type: 'macro',
        value: '$__unixEpochFilter'
      }));
    } else {
      options.push(this.uiSegmentSrv.newSegment({
        type: 'macro',
        value: '$__timeFilter'
      }));
    }

    options.push(this.uiSegmentSrv.newSegment({
      type: 'expression',
      value: 'Expression'
    }));
    return this.$q.when(options);
  };

  BigQueryQueryCtrl.prototype.addWhereAction = function (part, index) {
    switch (this.whereAdd.type) {
      case 'macro':
        {
          var partModel = _sql_part2.default.create({
            type: 'macro',
            name: this.whereAdd.value,
            params: []
          });

          if (this.whereParts.length >= 1 && this.whereParts[0].def.type === 'macro') {
            // replace current macro
            this.whereParts[0] = partModel;
          } else {
            this.whereParts.splice(0, 0, partModel);
          }

          break;
        }

      default:
        {
          this.whereParts.push(_sql_part2.default.create({
            type: 'expression',
            params: ['value', '=', 'value']
          }));
        }
    }

    this.updatePersistedParts();
    this.resetPlusButton(this.whereAdd);
    this.panelCtrl.refresh();
  };

  BigQueryQueryCtrl.prototype.getGroupOptions = function () {
    var _this = this;

    return this.datasource.metricFindQuery(this.metaBuilder.buildColumnQuery('group')).then(function (tags) {
      var options = [];

      if (!_this.queryModel.hasTimeGroup()) {
        options.push(_this.uiSegmentSrv.newSegment({
          type: 'time',
          value: 'time($__interval,none)'
        }));
      }

      for (var _i = 0, tags_1 = tags; _i < tags_1.length; _i++) {
        var tag = tags_1[_i];
        options.push(_this.uiSegmentSrv.newSegment({
          type: 'column',
          value: tag.text
        }));
      }

      return options;
    }).catch(this.handleQueryError.bind(this));
  };

  BigQueryQueryCtrl.prototype.addGroupAction = function () {
    switch (this.groupAdd.value) {
      default:
        {
          this.addGroup(this.groupAdd.type, this.groupAdd.value);
        }
    }

    this.resetPlusButton(this.groupAdd);
    this.panelCtrl.refresh();
  };

  BigQueryQueryCtrl.prototype.handleQueryError = function (err) {
    this.error = err.message || 'Failed to issue metric query';
    return [];
  };

  BigQueryQueryCtrl.templateUrl = 'partials/query.editor.html';
  return BigQueryQueryCtrl;
}(_sdk.QueryCtrl);

exports.BigQueryQueryCtrl = BigQueryQueryCtrl;

/***/ }),

/***/ "./response_parser.ts":
/*!****************************!*\
  !*** ./response_parser.ts ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = __webpack_require__(/*! lodash */ "lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ResponseParser =
/** @class */
function () {
  function ResponseParser($q) {
    this.$q = $q;
  }

  ResponseParser.prototype.parseProjects = function (results) {
    var projects = [];

    if (!results || !results.data || !results.data.projects || results.data.projects.length === 0) {
      return projects;
    }

    for (var _i = 0, _a = results.data.projects; _i < _a.length; _i++) {
      var prj = _a[_i];
      projects.push({
        value: prj.id,
        text: prj.id
      });
    }

    return projects;
  };

  ResponseParser.prototype.parseDatasets = function (results) {
    var datasets = [];

    if (!results || !results.data || !results.data.datasets || results.data.datasets.length === 0) {
      return datasets;
    }

    for (var _i = 0, _a = results.data.datasets; _i < _a.length; _i++) {
      var ds = _a[_i];
      datasets.push({
        value: ds.datasetReference.datasetId,
        text: ds.datasetReference.datasetId
      });
    }

    return datasets;
  };

  ResponseParser.prototype.parseTabels = function (results) {
    var tabels = [];

    if (!results || !results.data || !results.data.tables || results.data.tables.length === 0) {
      return tabels;
    }

    for (var _i = 0, _a = results.data.tables; _i < _a.length; _i++) {
      var tbl = _a[_i];
      tabels.push({
        value: tbl.tableReference.tableId,
        text: tbl.tableReference.tableId
      });
    }

    return tabels;
  };

  ResponseParser.prototype.parseTabelFields = function (results, filter) {
    var fields = [];

    if (!results || !results.data || !results.data.schema || !results.data.schema.fields || results.data.schema.fields.length === 0) {
      return fields;
    }

    for (var _i = 0, _a = results.data.schema.fields; _i < _a.length; _i++) {
      var fl = _a[_i];

      for (var i = 0; i < filter.length; i++) {
        if (filter[i] === fl.type) {
          fields.push({
            text: fl.name,
            value: fl.type
          });
        }
      }
    }

    return fields;
  };
  /*parseDataQuery(results) {
    const data = [];
    console.log(results);
    if (!results.data.rows) {
      return { data: data };
    }
    const datapoints = [];
    for (const row of results.data.rows) {
      const dp = [];
      for (const i in row.f) {
        dp.push(Number(row.f[i].v)*1000);
      }
      datapoints.push(dp);
    }
    data.push({
      datapoints: datapoints,
      meta: 'meta'
    });
    console.log(data)
    const last = datapoints[datapoints.length - 1][0];
    console.log("last ", last)
       return { data: data };
  }*/


  ResponseParser.prototype.parseDataQuery = function (results) {
    var data = [];
    console.log(results);

    if (!results.data.rows) {
      return {
        data: data
      };
    }

    var timeIndex = -1;
    var metricIndex = -1;
    var valueIndex = -1;

    for (var i = 0; i < results.data.schema.fields.length; i++) {
      if (timeIndex === -1 && ['DATE', 'TIMESTAMP', 'DATETIME'].includes(results.data.schema.fields[i].type)) {
        timeIndex = i;
      }

      if (metricIndex === -1 && results.data.schema.fields[i].type === 'STRING') {
        metricIndex = i;
      }

      if (valueIndex === -1 && ['INT64', 'NUMERIC', 'FLOAT64', 'FLOAT', 'INT'].includes(results.data.schema.fields[i].type)) {
        valueIndex = i;
      }
    }

    if (timeIndex === -1) {
      throw new Error('No datetime column found in the result. The Time Series format requires a time column.');
    }

    for (var _i = 0, _a = results.data.rows; _i < _a.length; _i++) {
      var row = _a[_i];
      var epoch = Number(row.f[timeIndex].v) * 1000;
      var metricName = metricIndex > -1 ? row.f[metricIndex].v : results.data.schema.fields[valueIndex].name;
      var bucket = ResponseParser.findOrCreateBucket(data, metricName);
      bucket.datapoints.push([row.f[valueIndex].v, epoch]);
    }

    return {
      data: data
    };
  };

  ResponseParser.findOrCreateBucket = function (data, target) {
    var dataTarget = _lodash2.default.find(data, ['target', target]);

    if (!dataTarget) {
      dataTarget = {
        target: target,
        datapoints: [],
        refId: '',
        query: ''
      };
      data.push(dataTarget);
    }

    return dataTarget;
  };

  ResponseParser.prototype.processQueryResult = function (res) {
    var data = [];

    if (!res.data.results) {
      return {
        data: data
      };
    }

    for (var key in res.data.results) {
      var queryRes = res.data.results[key];

      if (queryRes.series) {
        for (var _i = 0, _a = queryRes.series; _i < _a.length; _i++) {
          var series = _a[_i];
          data.push({
            target: series.name,
            datapoints: series.points,
            refId: queryRes.refId,
            meta: queryRes.meta
          });
        }
      }

      if (queryRes.tables) {
        for (var _b = 0, _c = queryRes.tables; _b < _c.length; _b++) {
          var table = _c[_b];
          table.type = 'table';
          table.refId = queryRes.refId;
          table.meta = queryRes.meta;
          data.push(table);
        }
      }
    }

    return {
      data: data
    };
  };

  ResponseParser.prototype.parseMetricFindQueryResult = function (refId, results) {
    if (!results || results.data.length === 0 || results.data.results[refId].meta.rowCount === 0) {
      return [];
    }

    var columns = results.data.results[refId].tables[0].columns;
    var rows = results.data.results[refId].tables[0].rows;
    var textColIndex = this.findColIndex(columns, '__text');
    var valueColIndex = this.findColIndex(columns, '__value');

    if (columns.length === 2 && textColIndex !== -1 && valueColIndex !== -1) {
      return this.transformToKeyValueList(rows, textColIndex, valueColIndex);
    }

    return this.transformToSimpleList(rows);
  };

  ResponseParser.prototype.transformToKeyValueList = function (rows, textColIndex, valueColIndex) {
    var res = [];

    for (var i = 0; i < rows.length; i++) {
      if (!this.containsKey(res, rows[i][textColIndex])) {
        res.push({
          text: rows[i][textColIndex],
          value: rows[i][valueColIndex]
        });
      }
    }

    return res;
  };

  ResponseParser.prototype.transformToSimpleList = function (rows) {
    var res = [];

    for (var i = 0; i < rows.length; i++) {
      for (var j = 0; j < rows[i].length; j++) {
        var value = rows[i][j];

        if (res.indexOf(value) === -1) {
          res.push(value);
        }
      }
    }

    return _lodash2.default.map(res, function (value) {
      return {
        text: value
      };
    });
  };

  ResponseParser.prototype.findColIndex = function (columns, colName) {
    for (var i = 0; i < columns.length; i++) {
      if (columns[i].text === colName) {
        return i;
      }
    }

    return -1;
  };

  ResponseParser.prototype.containsKey = function (res, key) {
    for (var i = 0; i < res.length; i++) {
      if (res[i].text === key) {
        return true;
      }
    }

    return false;
  };

  ResponseParser.prototype.transformAnnotationResponse = function (options, data) {
    var table = data.data.results[options.annotation.name].tables[0];
    var timeColumnIndex = -1;
    var titleColumnIndex = -1;
    var textColumnIndex = -1;
    var tagsColumnIndex = -1;

    for (var i = 0; i < table.columns.length; i++) {
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
        message: 'Missing mandatory time column in annotation query.'
      });
    }

    var list = [];

    for (var i = 0; i < table.rows.length; i++) {
      var row = table.rows[i];
      list.push({
        annotation: options.annotation,
        time: Math.floor(row[timeColumnIndex]),
        title: row[titleColumnIndex],
        text: row[textColumnIndex],
        tags: row[tagsColumnIndex] ? row[tagsColumnIndex].trim().split(/\s*,\s*/) : []
      });
    }

    return list;
  };

  return ResponseParser;
}();

exports.default = ResponseParser;

/***/ }),

/***/ "./sql_part.ts":
/*!*********************!*\
  !*** ./sql_part.ts ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SqlPart = exports.SqlPartDef = undefined;

var _lodash = __webpack_require__(/*! lodash */ "lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SqlPartDef =
/** @class */
function () {
  function SqlPartDef(options) {
    this.type = options.type;

    if (options.label) {
      this.label = options.label;
    } else {
      this.label = this.type[0].toUpperCase() + this.type.substring(1) + ':';
    }

    this.style = options.style;

    if (this.style === 'function') {
      this.wrapOpen = '(';
      this.wrapClose = ')';
      this.separator = ', ';
    } else {
      this.wrapOpen = ' ';
      this.wrapClose = ' ';
      this.separator = ' ';
    }

    this.params = options.params;
    this.defaultParams = options.defaultParams;
  }

  return SqlPartDef;
}();

exports.SqlPartDef = SqlPartDef;

var SqlPart =
/** @class */
function () {
  function SqlPart(part, def) {
    this.part = part;
    this.def = def;

    if (!this.def) {
      throw {
        message: 'Could not find sql part ' + part.type
      };
    }

    this.datatype = part.datatype;

    if (part.name) {
      this.name = part.name;
      this.label = def.label + ' ' + part.name;
    } else {
      this.name = '';
      this.label = def.label;
    }

    part.params = part.params || _lodash2.default.clone(this.def.defaultParams);
    this.params = part.params;
  }

  SqlPart.prototype.updateParam = function (strValue, index) {
    // handle optional parameters
    if (strValue === '' && this.def.params[index].optional) {
      this.params.splice(index, 1);
    } else {
      this.params[index] = strValue;
    }

    this.part.params = this.params;
  };

  return SqlPart;
}();

exports.SqlPart = SqlPart;
var index = [];

function createPart(part) {
  var def = index[part.type];

  if (!def) {
    return null;
  }

  return new SqlPart(part, def);
}

function register(options) {
  index[options.type] = new SqlPartDef(options);
}

register({
  type: 'column',
  style: 'label',
  params: [{
    type: 'column',
    dynamicLookup: true
  }],
  defaultParams: ['value']
});
register({
  type: 'expression',
  style: 'expression',
  label: 'Expr:',
  params: [{
    name: 'left',
    type: 'string',
    dynamicLookup: true
  }, {
    name: 'op',
    type: 'string',
    dynamicLookup: true
  }, {
    name: 'right',
    type: 'string',
    dynamicLookup: true
  }],
  defaultParams: ['value', '=', 'value']
});
register({
  type: 'macro',
  style: 'label',
  label: 'Macro:',
  params: [],
  defaultParams: []
});
register({
  type: 'aggregate',
  style: 'label',
  params: [{
    name: 'name',
    type: 'string',
    options: ['avg', 'count', 'min', 'max', 'sum', 'stddev', 'variance']
  }],
  defaultParams: ['avg']
});
register({
  type: 'percentile',
  label: 'Aggregate:',
  style: 'label',
  params: [{
    name: 'name',
    type: 'string',
    options: ['percentile_cont', 'percentile_disc']
  }, {
    name: 'fraction',
    type: 'number',
    options: ['0.5', '0.75', '0.9', '0.95', '0.99']
  }],
  defaultParams: ['percentile_cont', '0.95']
});
register({
  type: 'alias',
  style: 'label',
  params: [{
    name: 'name',
    type: 'string',
    quote: 'double'
  }],
  defaultParams: ['alias']
});
register({
  type: 'time',
  style: 'function',
  label: 'time',
  params: [{
    name: 'interval',
    type: 'interval',
    options: ['$__interval', '1s', '10s', '1m', '5m', '10m', '15m', '1h']
  }, {
    name: 'fill',
    type: 'string',
    options: ['none', 'NULL', 'previous', '0']
  }],
  defaultParams: ['$__interval', 'none']
});
register({
  type: 'window',
  style: 'label',
  params: [{
    name: 'function',
    type: 'string',
    options: ['delta', 'increase', 'rate', 'sum']
  }],
  defaultParams: ['increase']
});
register({
  type: 'moving_window',
  style: 'label',
  label: 'Moving Window:',
  params: [{
    name: 'function',
    type: 'string',
    options: ['avg']
  }, {
    name: 'window_size',
    type: 'number',
    options: ['3', '5', '7', '10', '20']
  }],
  defaultParams: ['avg', '5']
});
exports.default = {
  create: createPart
};

/***/ }),

/***/ "grafana/app/core/app_events":
/*!**************************************!*\
  !*** external "app/core/app_events" ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_grafana_app_core_app_events__;

/***/ }),

/***/ "grafana/app/plugins/sdk":
/*!**********************************!*\
  !*** external "app/plugins/sdk" ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_grafana_app_plugins_sdk__;

/***/ }),

/***/ "lodash":
/*!*************************!*\
  !*** external "lodash" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_lodash__;

/***/ })

/******/ })});;
//# sourceMappingURL=module.js.map