module.exports = function (server) {

  server.route({
    path: '/api/graphui-plugin/getExampleDocs',
    method: 'POST',
    handler: function (req, reply) {
        var callWithRequest = server.plugins.elasticsearch.callWithRequest;
          callWithRequest(req, 'search', req.payload).then(function (resp) {
          reply({
            ok: true,
            resp:resp
          });
        }).catch(reply);


    }
  });


}
