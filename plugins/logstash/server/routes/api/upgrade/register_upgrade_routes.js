import { registerExecuteRoute } from './register_execute_route';

export function registerLogstashUpgradeRoutes(server) {
  registerExecuteRoute(server);
}
