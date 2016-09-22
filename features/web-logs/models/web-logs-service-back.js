module.exports = function() {
  'use strict';

  DependencyInjection.service('$WebLogsService', function() {

    return new (function $WebLogsService() {

      var WebLogModel = false,
          _waitingLogs = [];

      this.model = function(model) {
        WebLogModel = model;

        _waitingLogs.forEach(function(log) {
          WebLogModel.addLog(log);
        });

        _waitingLogs = [];
      };

      this.log = function(log) {
        if (WebLogModel) {
          WebLogModel.addLog(log);
        }
        else {
          _waitingLogs.push(log);
        }
      };

    })();

  });

};
