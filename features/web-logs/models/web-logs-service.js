module.exports = function() {
  'use strict';

  DependencyInjection.service('$WebLogsService', ['$AbstractService', '$socket', function($AbstractService, $socket) {

    return new (function $WebLogsService() {

      $AbstractService.call(this);

      var _this = this,
          _logConverters = [];

      this.logConverter = function(func) {
        _logConverters.push(func);
      };

      this.logConvert = function(log, label) {
        _logConverters.forEach(function(converter) {
          converter(log, label);
        });
      };

      this.search = function(fields) {
        _this.fire('search', {
          fields: fields
        });

        _this.retryEmitOnError($socket, 'call(web-logs/logs)', fields, function(args) {
          return args.isOwner;
        });
      };

      $socket.on('read(web-logs/logs)', function(args) {
        _this.fire('readLogs', args);
      });

    })();

  }]);

};
