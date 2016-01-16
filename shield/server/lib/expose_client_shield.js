const elasticsearchShield = require('elasticsearch-shield');

module.exports = (server) => {
  const createClient = server.plugins.elasticsearch.createClient;
  const client = createClient({
    auth: false,
    plugins: [elasticsearchShield]
  });
  server.expose('client', client);

  const callWithRequestFactory = server.plugins.elasticsearch.callWithRequestFactory;
  server.expose('callWithRequest', callWithRequestFactory(client));
};