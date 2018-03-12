import uiRoutes from 'ui/routes';
import template from './index.html';
import { NoDataController } from './controller';
uiRoutes
  .when('/no-data', {
    template,
    resolve: {
      clusters: $injector => {
        const monitoringClusters = $injector.get('monitoringClusters');
        const kbnUrl = $injector.get('kbnUrl');

        return monitoringClusters().then(clusters => {
          if (clusters && clusters.length) {
            kbnUrl.changePath('/home');
            return Promise.reject();
          }
          return Promise.resolve();
        });
      }
    },
    controller: NoDataController
  })
  .otherwise({ redirectTo: '/home' });
