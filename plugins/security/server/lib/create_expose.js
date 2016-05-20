import getClient from './get_client_shield';

export default function createExports(server) {
  const callWithRequest = getClient(server).callWithRequest;

  server.expose('getUser', (request) => callWithRequest(request, 'shield.authenticate'));
};
