export default (server) => {
  const ttl = server.config().get('xpack.shield.sessionTimeout');
  return () => Date.now() + ttl;
};
