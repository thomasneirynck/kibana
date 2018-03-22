import uiRoutes from 'ui/routes';
import { routeInitProvider } from 'plugins/monitoring/lib/route_init';
import template from './index.html';
import { LicenseViewController } from './controller';

uiRoutes.when('/license', {
  template,
  resolve: {
    clusters: (Private) => {
      const routeInit = Private(routeInitProvider);
      return routeInit();
    }
  },
  controllerAs: 'licenseView',
  controller: LicenseViewController
});
