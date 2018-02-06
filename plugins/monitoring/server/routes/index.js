/*eslint import/namespace: ['error', { allowComputed: true }]*/
import * as uiRoutes from './api/v1/ui'; // namespace import
import { telemetryRoute } from './api/v1/telemetry';

export function requireUIRoutes(server) {
  const routes = Object.keys(uiRoutes);

  routes.forEach(route => {
    const registerRoute = uiRoutes[route]; // computed reference to module objects imported via namespace
    registerRoute(server);
  });
}

export function requireTelemetryRoutes(server) {
  telemetryRoute(server);
}
