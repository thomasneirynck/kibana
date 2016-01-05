const path = require('path');
const fs = require('fs');
const debug = require('../lib/logger');

module.exports = function (server) {
  const modulePath = path.resolve(__dirname, '..', '..', 'node_modules');

  server.route({
    path: '/app/reporting/assets/font-awesome.svg',
    method: 'GET',
    handler: function (request, reply) {
      const filepath = path.resolve(modulePath, 'font-awesome', 'fonts', 'fontawesome-webfont.svg');
      const filestream = fs.createReadStream(filepath);
      reply(filestream).type('image/svg+xml');
    }
  });
};
