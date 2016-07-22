const path = require('path');
const fs = require('fs');

const mainEntry = '/app/reporting/assets';

module.exports = function (server) {
  const modulePath = path.resolve(__dirname, '..', '..', '..', '..', 'node_modules');
  const assetPath = path.resolve(__dirname, '..', '..', 'server', 'assets');

  server.route({
    path: `${mainEntry}/font-awesome.svg`,
    method: 'GET',
    handler: function (request, reply) {
      const filepath = path.resolve(modulePath, 'font-awesome', 'fonts', 'fontawesome-webfont.svg');
      const filestream = fs.createReadStream(filepath);
      reply(filestream).type('image/svg+xml');
    }
  });

  server.route({
    path: `${mainEntry}/reporting-overrides.css`,
    method: 'GET',
    handler: function (request, reply) {
      const filepath = path.resolve(assetPath, 'reporting-overrides.css');
      const filestream = fs.createReadStream(filepath);
      reply(filestream).type('text/css');
    }
  });
};
