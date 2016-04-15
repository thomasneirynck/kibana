export default (server) => {
  const ttl = server.config().get('xpack.security.sessionTimeout');
  return () => Date.now() + ttl;
};
