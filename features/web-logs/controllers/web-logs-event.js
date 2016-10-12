'use strict';

module.exports = [{
  event: 'update(web/route)',
  controller: function($socket, UserModel, $message) {
    if (!this.validMessage($message, {
      path: ['string', 'filled']
    })) {
      return;
    }

    if (!$socket.user || !$socket.user.id || !$message.path.match(/^\/logs\/?$/)) {
      return;
    }

    UserModel.addHomeTile({
      date: new Date(),
      url: '/logs',
      cover: '/public/web-logs/web-logs-home.jpg',
      large: true,
      centered: {
        title: 'LOGS'
      }
    }, $socket.user.id);
  }
}, {
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
