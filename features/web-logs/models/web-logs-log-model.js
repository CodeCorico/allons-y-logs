module.exports = function() {
  'use strict';

  DependencyInjection.model('WebLogModel', function($AbstractModel) {

    var PERMISSIONS = {
          'web-logs-access': {
            title: 'Access to the Logs app',
            description: 'Access to the Logs app',
            isPublic: true
          }
        },
        LOGS_HOME_TILE = {
          url: '/logs',
          cover: '/public/web-logs/web-logs-home.jpg',
          large: true,
          centered: {
            title: 'LOGS'
          }
        },
        NAMPESPACES_AVOID = ['allons-y', 'allons-y-models'],

        path = require('path'),
        extend = require('extend'),
        _logsToAdd = [],
        _tickInAction = false,
        _logConverters = [],
        _logsFilter = [],
        _searchConditions = [];

    require(path.resolve(__dirname, 'web-logs-service-back.js'))();

    var $WebLogsService = DependencyInjection.injector.model.get('$WebLogsService');

    return $AbstractModel('WebLogModel', function() {

      return {
        identity: 'weblogs',
        connection: 'WebLogs',
        migrate: 'safe',
        schema: false,
        autoCreatedAt: false,
        autoUpdatedAt: false,
        attributes: {
          date: {
            type: 'date',
            index: true
          },
          namespace: {
            type: 'string',
            index: true
          },
          log: {
            type: 'string',
            index: true
          },
          ip: {
            type: 'string',
            index: true
          },
          agent: 'string',
          url: {
            type: 'string',
            index: true
          },
          error: {
            type: 'string',
            index: true
          },
          session: {
            type: 'string',
            index: true
          }
        },

        init: function() {
          var GroupModel = DependencyInjection.injector.model.get('GroupModel'),
              UserModel = DependencyInjection.injector.model.get('UserModel');

          GroupModel.registerPermissions(PERMISSIONS);

          $WebLogsService.model(this);

          UserModel.homeDefaultTile(extend(true, {
            date: new Date()
          }, LOGS_HOME_TILE), ['web-logs-access']);
        },

        logConverter: function(func) {
          var funcString = func.toString();

          for (var i = 0; i < _logConverters.length; i++) {
            if (_logConverters[i].toString() == funcString) {
              return;
            }
          }

          _logConverters.push(func);
        },

        logFilter: function(func) {
          _logsFilter.push(func);
        },

        addLog: function(logData) {
          if (typeof logData != 'object' || !logData || !logData.namespace || !logData.log || !logData.type) {
            return;
          }

          if (
            NAMPESPACES_AVOID.indexOf(logData.namespace) > -1 ||
            (logData.namespace == 'allons-y-express' && logData.log != 'express-start')
          ) {
            return;
          }

          for (var i = 0; i < _logsFilter.length; i++) {
            if (_logsFilter[i](logData) === false) {
              return;
            }
          }

          logData.args = logData.args || {};

          var log = logData.args;

          log.date = log.timestamp ? new Date(log.timestamp) : log.date || new Date();
          log.date = typeof log.date == 'object' && log.date.toJSON() || log.date;
          log.namespace = logData.namespace;
          log.log = logData.log;
          log.type = logData.type;
          log.agent = 'node';
          log.ip = log.ip || '127.0.0.1';

          _logConverters.forEach(function(converter) {
            converter(log);
          });

          delete log.timestamp;

          if (log.req) {
            log.agent = log.req.headers['user-agent'];
            log.ip = log.req.headers['x-forwarded-for'] || log.req.connection.remoteAddress;
            log.url = log.req.originalUrl;
            log.method = log.req.method || 'GET';

            delete log.req;
          }

          if (log.res) {
            if (log.res.errorResult) {
              log.result = log.res.errorResult;
            }

            if (log.res.statusCode) {
              log.response = log.res.statusCode;
            }

            delete log.res;
          }

          if (log.socket) {
            log.isSocket = true,
            log.clientId = log.socket.client.id,
            log.agent = log.socket.handshake.headers['user-agent'];
            log.ip = log.socket.handshake.address;
            log.referer = log.socket.handshake.headers.referer;

            delete log.socket;
          }

          if (typeof log.error == 'object') {
            log.stack = log.error.stack.toString();
            log.error = log.error.message;
          }

          _logsToAdd.push(log);

          this.tickAddLog();
        },

        tickAddLog: function() {
          if (!_logsToAdd.length || _tickInAction) {
            return;
          }

          _tickInAction = true;

          var _this = this,
              log = _logsToAdd.splice(0, 1);

          this
            .create(log)
            .exec(function() {
              _tickInAction = false;

              _this.tickAddLog();
            });
        },

        searchConditions: function(func) {
          return _searchConditions.push(func);
        },

        search: function(conditions, callback) {
          conditions = typeof conditions == 'object' ? conditions : {};

          var _this = this,
              query = {};

          if (conditions.id) {
            query._id = this.mongo.objectId(conditions.id);
          }

          if (conditions.dateFrom) {
            query.date = query.date || {};
            query.date.$gte = new Date(conditions.dateFrom);
          }

          if (conditions.dateTo) {
            query.date = query.date || {};
            query.date.$lte = new Date(conditions.dateTo);
          }

          if (conditions.type) {
            query.type = conditions.type;
          }

          if (conditions.namespace) {
            query.namespace = {
              $regex: conditions.namespace,
              $options: 'i'
            };
          }

          if (conditions.log) {
            query.log = {
              $regex: conditions.log,
              $options: 'i'
            };
          }

          if (conditions.url) {
            query.url = query.url || {};
            query.url.$regex = conditions.url;
            query.url.$options = 'i';
          }

          _searchConditions.forEach(function(searchCondition) {
            searchCondition(conditions, query);
          });

          var count = Math.max(1, Math.min(200, conditions.count && parseInt(conditions.count, 10) || 50));

          _this.native(function(err, collection) {

            collection.count(query, function(err, total) {
              total = total || 0;

              collection
                .find(query, {
                  sort: {
                    date: -1
                  },
                  limit: count
                })
                .toArray(function(err, logs) {
                  if (err) {
                    callback(err);
                  }

                  logs.forEach(function(log) {
                    log.id = log._id;
                    delete log._id;
                  });

                  callback(null, logs, total);
                });
            });
          });
        }
      };

    });

  });

  return 'WebLogModel';

};
