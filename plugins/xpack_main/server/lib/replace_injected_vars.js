export default async function replaceInjectedVars(originalInjectedVars, request, server) {
  if (server.plugins.security) {
    if (!await server.plugins.security.isAuthenticated(request)) {
      return originalInjectedVars;
    }
  }

  return {
    ...originalInjectedVars,
    xpackInitialInfo: server.plugins.xpack_main.info.toJSON(),
  };
}
