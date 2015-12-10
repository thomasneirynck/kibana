module.exports = (server) => {
  server.route({
    method: 'GET',
    path: '/logout',
    handler(request, reply) {
      request.auth.session.clear();
      return reply.redirect('/');
    }
  });
};