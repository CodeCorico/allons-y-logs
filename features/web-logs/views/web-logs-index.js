(function() {
  'use strict';

  window.bootstrap([
    '$Page', '$BodyDataService', '$i18nService', '$done',
  function($Page, $BodyDataService, $i18nService, $done) {

    var _user = $BodyDataService.data('user') || null;

    if (_user && _user.permissionsPublic && _user.permissionsPublic.indexOf('web-logs-access') > -1) {
      $Page.remember(/^\/logs\/?$/);

      $Page.push('apps', {
        name: $i18nService._('Logs'),
        select: function() {
          window.page('/logs');
        }
      });
    }

    $done();
  }]);

})();
