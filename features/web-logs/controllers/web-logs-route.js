'use strict';

module.exports = {
  url: '/logs',

  enter: [
    '$Page', '$FaviconService', '$BodyDataService', '$i18nService', '$Layout', '$next',
  function($Page, $FaviconService, $BodyDataService, $i18nService, $Layout, $next) {
    var user = $BodyDataService.data('user');

    if (user.permissionsPublic.indexOf('web-logs-access') < 0) {
      return $next();
    }

    document.title = $i18nService._('Logs') + ' - ' + $Page.get('web').brand;
    $FaviconService.update('/public/web-logs/favicon.png');

    $Layout.selectApp('Logs', false);

    setTimeout(function() {
      require('/public/web-logs/web-logs-service.js')
        .then(function() {
          return $Layout.require('web-logs-layout');
        })
        .then(function() {
          return $Layout.leftContext().require('web-logs-filters');
        })
        .then(function() {
          var $WebLogsService = DependencyInjection.injector.view.get('$WebLogsService');

          $Page.leftButtonAdd('web-logs-filters', {
            icon: 'fa fa-filter',
            group: 'group-web-logs-filters',
            autoOpen: 'main'
          });

          $WebLogsService.init();
        });
    });
  }],

  exit: ['$Page', '$Layout', '$next', function($Page, $Layout, $next) {
    require('/public/web-logs/web-logs-service.js').then(function() {
      $Layout.leftContext().closeIfGroupOpened('group-web-logs-filters');
      $Page.leftButtonRemove('web-logs-filters');

      DependencyInjection.injector.view.get('$WebLogsService').teardown(null, $next);
    });
  }]
};
