module.exports = function (server, commonRouteConfig) {

  server.route({
    path: '/api/graph/searchProxy',
    method: 'POST',
    handler: function (req, reply) {
      var callWithRequest = server.plugins.elasticsearch.callWithRequest;
      callWithRequest(req, 'search', req.payload).then(function (resp) {
        reply({
          ok: true,
          resp:resp
        });
      }).catch(reply);


    },
    config: {
      ...commonRouteConfig
    }
  });


};
