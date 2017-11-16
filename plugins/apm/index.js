import { resolve } from 'path';
import { initTransactionsApi } from './server/routes/transactions';
import { initAppsApi } from './server/routes/apps';
import { initErrorsApi } from './server/routes/errors';
import { initStatusApi } from './server/routes/status_check';

export function apm(kibana) {
  return new kibana.Plugin({
    require: ['kibana', 'elasticsearch', 'xpack_main'],
    id: 'apm',
    configPrefix: 'xpack.apm',
    publicDir: resolve(__dirname, 'public'),

    uiExports: {
      app: {
        title: 'APM',
        description: 'APM for the Elastic Stack',
        main: 'plugins/apm/app',
        icon: 'plugins/apm/icon.svg'
      },
      home: ['plugins/apm/register_feature']
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
      initAppsApi(server);
      initErrorsApi(server);
      initStatusApi(server);
    }
  });
}
