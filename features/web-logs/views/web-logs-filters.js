(function() {
  'use strict';

  window.Ractive.controllerInjection('web-logs-filters', [
    '$WebLogsService', '$component', '$data', '$done',
  function logsFiltersController($WebLogsService, $component, $data, $done) {

    var LogsFilters = $component({
          data: $.extend({
            fields: {}
          }, $data)
        }),
        _observesActive = false,
        _scrolls = null,
        _$el = {
          content: $(LogsFilters.el).find('.web-logs-filters-content')
        };

    function _matchDate(value) {
      if (value.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)) {
        return value + ' 00:00:00';
      }
      else if (value.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}$/)) {
        return value + ':00';
      }
      else if (value.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$/)) {
        return value;
      }

      return false;
    }

    function _search() {
      var fields = $.extend(true, {}, LogsFilters.get('fields') || {});

      Object.keys(fields).forEach(function(fieldName) {
        var value = fields[fieldName],
            $input = _$el.content.find('#' + fieldName + 'WebLogsFilters'),
            type = $input.attr('type') || 'string',
            success = true;

        if (type == 'date') {
          fields[fieldName] = _matchDate(fields.dateTo);

          if (!fields[fieldName]) {
            success = false;
          }
        }
        else if (type == 'int') {
          if (value) {
            fields[fieldName] = parseInt(value, 10);

            if (isNaN(fields[fieldName])) {
              fields[fieldName] = null;
              success = false;
            }
          }
        }
        else if (type == 'float') {
          if (value) {
            fields[fieldName] = parseFloat(value);

            if (isNaN(fields[fieldName])) {
              fields[fieldName] = null;
              success = false;
            }
          }
        }
        else {
          success = !!value;
        }

        $input[success ? 'addClass' : 'removeClass']('success');
      });

      $WebLogsService.search(fields);
    }

    $WebLogsService.onSafe('logsFiltersController.teardown', function() {
      LogsFilters.teardown();
      LogsFilters = null;

      setTimeout(function() {
        $WebLogsService.offNamespace('logsFiltersController');
      });
    });

    $WebLogsService.onSafe('logsFiltersController.searchingConfigChanged', function(args) {
      LogsFilters.set('searching', args.value);
    });

    LogsFilters.on('search', function(event) {
      var charCode = event.original.charCode ? event.original.charCode : event.original.keyCode;

      // Enter
      if (charCode == 13) {
        _search();
      }
    });

    $WebLogsService.onSafe('logsFiltersController.init', function() {
      _observesActive = true;

      _search();
    });

    LogsFilters.require().then(function() {
      _scrolls = LogsFilters.findChild('name', 'pl-scrolls');

      $done();
    });

  }]);

})();
