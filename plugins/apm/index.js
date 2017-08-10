import { resolve } from 'path';
import { initTransactionsApi } from './server/routes/transactions';
import { initChartApi } from './server/routes/charts';
import { initDistributionApi } from './server/routes/distribution';
import { initAppsApi } from './server/routes/apps';
import { initTracesApi } from './server/routes/traces';

export function apm(kibana) {
  return new kibana.Plugin({
    require: ['kibana', 'elasticsearch', 'xpack_main'],
    id: 'apm',
    configPrefix: 'xpack.apm',
    publicDir: resolve(__dirname, 'public'),

    uiExports: {
      app: {
        title: 'APM',
        description: 'A demo plugin',
        main: 'plugins/apm/app',
        icon: 'plugins/apm/icon.svg'
      }
    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
        indexPattern: Joi.string().default('apm*'),
        minimumBucketSize: Joi.number().default(15),
        bucketTargetCount: Joi.number().default(27)
      }).default();
    },

    init(server) {
      initTransactionsApi(server);
      initChartApi(server);
      initDistributionApi(server);
      initAppsApi(server);
      initTracesApi(server);
    }
  });
}
