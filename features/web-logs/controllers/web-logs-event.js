'use strict';

module.exports = [{
  event: 'call(web-logs/logs)',
  permissions: ['web-logs-access'],
  controller: function($SocketsService, $socket, WebLogModel, $message) {
    if (!this.validMessage($message)) {
      return;
    }

    WebLogModel.search($message, function(err, logs, total) {
      if (err) {
        return $SocketsService.error($socket, $message, 'read(tracker/logs)', err);
      }

      $socket.emit('read(web-logs/logs)', {
        isOwner: true,
        logs: logs || [],
        total: total
      });
    });
  }
}];
