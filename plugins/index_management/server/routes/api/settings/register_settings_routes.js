import { registerLoadRoute } from './register_load_route';
import { registerUpdateRoute } from './register_update_route';

export function registerSettingsRoutes(server) {
  registerLoadRoute(server);
  registerUpdateRoute(server);
}
