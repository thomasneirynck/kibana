
module.exports = function(server) {

  var callWithRequest = server.plugins.elasticsearch.callWithRequest;

  function graphExplore(req) {
    var payload = req.payload;
    return callWithRequest(req, "transport.request", {
      "path": "/" + encodeURIComponent(payload.index) + "/_graph/explore",
      body: payload.query,
      method: "POST",
      query: {}
    });
  }
  server.route({
    path: '/api/graph/graphExplore',
    method: 'POST',
    handler: function(req, reply) {
      graphExplore(req).then(function(resp) {
        reply({
          ok: true,
          resp: resp
        });
      }).catch(reply);
    }
  });

}
