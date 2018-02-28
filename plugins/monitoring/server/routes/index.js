/*eslint import/namespace: ['error', { allowComputed: true }]*/
import * as uiRoutes from './api/v1/ui'; // namespace import

export function requireUIRoutes(server) {
  const routes = Object.keys(uiRoutes);

  routes.forEach(route => {
    const registerRoute = uiRoutes[route]; // computed reference to module objects imported via namespace
    registerRoute(server);
  });
}
