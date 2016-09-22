'use strict';

module.exports = function($allonsy, $options, $done) {
  if (
    !process.env.WEB_LOGS || process.env.WEB_LOGS != 'true' ||
    $options.owner != 'fork' || $options.processName != 'Allons-y Express'
  ) {
    return $done();
  }

  var path = require('path');

  require(path.resolve(__dirname, 'models/web-logs-service-back.js'))();

  var $WebLogsService = DependencyInjection.injector.controller.get('$WebLogsService');

  $allonsy.on('log', function(log) {
    $WebLogsService.log(log);
  });

  $done();
};
