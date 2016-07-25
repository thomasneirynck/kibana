import getClient from './get_client_shield';

export default function createExports(server) {
  const callWithRequest = getClient(server).callWithRequest;

  server.expose('getUser', (request) => {
    const xpackInfo = server.plugins.xpack_main.info;
    if (xpackInfo && xpackInfo.isAvailable() && !xpackInfo.feature('security').isEnabled()) {
      return null;
    }
    return callWithRequest(request, 'shield.authenticate');
  });
};
