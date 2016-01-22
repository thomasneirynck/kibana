const {once} = require('lodash');
const elasticsearchShield = require('elasticsearch-shield');

module.exports = once((server) => {
  const createClient = server.plugins.elasticsearch.createClient;
  const client = createClient({
    auth: false,
    plugins: [elasticsearchShield]
  });

  const callWithRequestFactory = server.plugins.elasticsearch.callWithRequestFactory;
  const callWithRequest = callWithRequestFactory(client);

  return {client, callWithRequest};
});