module.exports = function (server) {
  server.route({
    path: '/api/graph/getFields',
    method: 'GET',
    handler: function (req, reply) {
        var body = {
          index: req.query.index
        }
        var callWithRequest = server.plugins.elasticsearch.callWithRequest;
        //  See https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html
          callWithRequest(req, 'indices.getMapping', body).then(function (resp) {
          reply({
            ok: true,
            mappings:resp[req.query.index].mappings
          });
        }).catch(function (resp) {
          reply({
            ok: false,
            resp: resp
          });
        });


    }
  });


}
