(function() {
  'use strict';

  window.Ractive.controllerInjection('web-logs-layout', [
    '$Page', '$Layout', '$i18nService', '$WebLogsService', '$component', '$data', '$done',
  function webLogsLayoutController($Page, $Layout, $i18nService, $WebLogsService, $component, $data, $done) {

    var _scrolls = null;

    $data.hideFiles = true;

    var WebLogsLayout = $component({
          data: $.extend(true, {
            isSearching: true,
            total: 0
          }, $data),

          selectLog: function(i) {
            var logs = WebLogsLayout.get('logs');

            if (logs[i]) {
              var detailsHeight = logs[i].opened ? 0 : $('.web-logs-layout > .pl-scrolls > ul li:nth-child(' + (i + 1) + ') .details-content').outerHeight(true);

              WebLogsLayout.set('logs[' + i + '].detailsHeight', detailsHeight);
              WebLogsLayout.set('logs[' + i + '].opened', !logs[i].opened);

              setTimeout(function() {
                _scrolls.update();
              }, 350);
            }
          }
        });

    function _formatDate(date) {
      var actualYear = new Date().getFullYear(),
          hours = date.getHours(),
          minutes = date.getMinutes(),
          seconds = date.getSeconds(),
          days = date.getDate(),
          months = (date.getMonth() + 1);

      return (months > 9 ? months : '0' + months) +
        '/' + (days > 9 ? days : '0' + days) +
        (date.getFullYear() != actualYear ? '/' + date.getFullYear() : '') +
        ' - ' + (hours > 9 ? hours : '0' + hours) +
        ':' + (minutes > 9 ? minutes : '0' + minutes) +
        ':' + (seconds > 9 ? seconds : '0' + seconds);
    }

    function _formatDuration(duration) {
      duration = duration.toString().split('.');

      var ms = duration.length == 2 ? duration[1] : '';

      duration = parseInt(duration[0], 10);

      var result = [],
          hours = Math.floor(duration / 3600),
          minutes = Math.floor((duration - (hours * 3600)) / 60),
          seconds = duration - (hours * 3600) - (minutes * 60);

      if (hours) {
        result.push(hours + 'h');
      }

      if (minutes) {
        result.push(minutes + 'm');
      }

      if (seconds || ms) {
        result.push((seconds ? seconds : '0') + (ms ? '.' + ms : '') + 's');
      }

      return result.join(' ') || '0s';
    }

    $WebLogsService.onSafe('webLogsLayoutController.teardown', function() {
      WebLogsLayout.teardown();
      WebLogsLayout = null;

      setTimeout(function() {
        $WebLogsService.offNamespace('webLogsLayoutController');
      });
    });

    $WebLogsService.onSafe('webLogsLayoutController.search', function() {
      WebLogsLayout.set('isSearching', true);
    });

    $WebLogsService.onSafe('webLogsLayoutController.readLogs', function(args) {
      WebLogsLayout.set('isSearching', false);

      if (args.error || !args.logs) {
        return;
      }

      var logs = [];

      WebLogsLayout.set('total', args.total || 0);

      args.logs.forEach(function(log, i) {
        log.date = new Date(log.date);

        if (log.error && !log.label) {
          log.label = log.error;
        }
        else if (log.url && !log.label) {
          log.label = '<span class="nav" title="' + $i18nService._('Navigation to') + '">&rarr;</span> ' + log.url;
        }

        log.label = log.label || log.log;

        $WebLogsService.logConvert(log);

        var details = [];
        Object.keys(log).forEach(function(key) {
          var value = log[key];

          if (key == '__v') {
            return;
          }

          value = typeof value == 'object' ? JSON.stringify(value) : value;
          if (key == 'stack' || key == 'content') {
            value = value.replace(/\n/g, '<br />');
          }
          if (key == 'screen') {
            var size = /width":([0-9]+),"height":([0-9]+)/i.exec(value);
            if (size && size.length > 2) {
              value = size[1] + 'x' + size[2] + 'px';
            }
          }

          details.push({
            key: key,
            value: value
          });
        });

        log.increase = 0;

        if (i < args.logs.length - 1) {
          log.increase = (log.date.getTime() - new Date(args.logs[i + 1].date).getTime()) / 1000;
          log.increase = _formatDuration(log.increase);
        }

        log.date = _formatDate(log.date);
        log.isError = !!log.error;
        log.detailsHeight = 0;
        log.details = details;

        logs.push(log);
      });

      WebLogsLayout.set('logs', logs);

      _scrolls.update();
    });

    WebLogsLayout.require().then(function() {
      _scrolls = WebLogsLayout.findChild('name', 'pl-scrolls');

      $done();
    });
  }]);

})();
