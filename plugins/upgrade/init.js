import { registerLicenseChecker } from './server/register_license_checker';
import { registerRoutes, registerReindexRoutes } from './server/register_api_routes';

export function init(server) {
  registerLicenseChecker(server);

  registerRoutes(server);
  registerReindexRoutes(server);
}
