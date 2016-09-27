'use strict';

module.exports = function($server) {

  $server.use(function(req, res, next) {

    var jsonFunction = res.json;

    res.json = function(json) {
      if (res.statusCode && res.statusCode != 200 && json.error) {
        res.errorResult = json.error;
      }

      return jsonFunction.apply(res, arguments);
    };

    next();
  });
};
